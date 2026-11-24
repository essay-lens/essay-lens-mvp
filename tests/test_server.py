import io
import json
import threading
import unittest
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen as client_urlopen
from unittest.mock import patch

import server


class FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return self.payload


class AnalyzeEndpointTests(unittest.TestCase):
    def setUp(self):
        self.http_server = ThreadingHTTPServer(("127.0.0.1", 0), server.DemoStaticHandler)
        self.thread = threading.Thread(target=self.http_server.serve_forever)
        self.thread.start()
        self.endpoint = f"http://127.0.0.1:{self.http_server.server_port}/api/analyze"
        self.paragraph = "Trong bối cảnh hiện nay, việc học tập là quan trọng."

    def tearDown(self):
        self.http_server.shutdown()
        self.http_server.server_close()
        self.thread.join()

    def post(self, payload):
        request = Request(
            self.endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with client_urlopen(request, timeout=3) as response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def test_missing_key_returns_local_rule_result(self):
        fallback = {
            "summary": "Đã rà soát bằng luật local.",
            "paragraphs": [{"suspicion_score": 51, "reasons": ["R01: Mở đầu khuôn mẫu."]}],
        }
        with patch.dict("os.environ", {"GROQ_API_KEY": ""}):
            status, result = self.post({"text": self.paragraph, "fallback": fallback})

        self.assertEqual(status, 200)
        self.assertEqual(result["engine"], "rule-fallback")
        self.assertEqual(result["overall_score"], 51)
        self.assertEqual(result["paragraphs"][0]["index"], 0)
        self.assertEqual(result["paragraphs"][0]["label"], "Cần lưu ý")

    def test_paragraphs_are_split_and_zero_indexed(self):
        fallback = {
            "summary": "Đã rà soát hai đoạn.",
            "paragraphs": [
                {"suspicion_score": 40, "reasons": ["Luật R01."]},
                {"suspicion_score": 60, "reasons": ["Luật R02."]},
            ],
        }
        text = f"{self.paragraph}\n  \nĐoạn thứ hai."
        with patch.dict("os.environ", {"GROQ_API_KEY": ""}):
            status, result = self.post({"text": text, "fallback": fallback})

        self.assertEqual(status, 200)
        self.assertEqual([item["index"] for item in result["paragraphs"]], [0, 1])
        self.assertEqual([item["text"] for item in result["paragraphs"]], [
            self.paragraph,
            "Đoạn thứ hai.",
        ])
        self.assertEqual(result["overall_score"], 50)

    def test_groq_success_uses_expected_request_options(self):
        model_result = {
            "summary": "Có một số tín hiệu cần xem xét.",
            "paragraphs": [{"index": 0, "suspicion_score": 70, "label": "Nhiều dấu hiệu", "reasons": ["Cụm mở đầu khuôn mẫu."]}],
        }
        response = FakeResponse({
            "choices": [{"message": {"content": json.dumps(model_result, ensure_ascii=False)}}],
        })
        fallback = {
            "summary": "Fallback local.",
            "paragraphs": [{"suspicion_score": 22, "reasons": []}],
        }
        with patch.dict("os.environ", {"GROQ_API_KEY": "test-key", "API_TIMEOUT": "15"}):
            with patch("server.urlopen", return_value=response) as mocked_urlopen:
                status, result = self.post({"text": self.paragraph, "fallback": fallback})

        self.assertEqual(status, 200)
        self.assertEqual(result["engine"], "groq-ai")
        self.assertEqual(result["overall_score"], 70)
        self.assertEqual(mocked_urlopen.call_args.kwargs["timeout"], 15)
        api_request = mocked_urlopen.call_args.args[0]
        request_body = json.loads(api_request.data.decode("utf-8"))
        self.assertEqual(request_body["temperature"], 0.2)
        self.assertEqual(request_body["response_format"], {"type": "json_object"})

    def test_groq_rate_limit_returns_local_rule_result(self):
        fallback = {
            "summary": "Đã rà soát bằng luật local.",
            "paragraphs": [{"suspicion_score": 30, "reasons": ["Không phát hiện tín hiệu mạnh."]}],
        }
        error = HTTPError(
            "https://api.groq.com/openai/v1/chat/completions",
            429,
            "Rate limited",
            {},
            io.BytesIO(b"rate limit"),
        )
        with patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}):
            with patch("server.urlopen", side_effect=error):
                status, result = self.post({"text": self.paragraph, "fallback": fallback})

        self.assertEqual(status, 200)
        self.assertEqual(result["engine"], "rule-fallback")
        self.assertEqual(result["overall_score"], 30)

    def test_timeout_and_invalid_model_json_return_local_rules(self):
        fallback = {
            "summary": "Đã rà soát bằng luật local.",
            "paragraphs": [{"suspicion_score": 30, "reasons": ["Luật local hoạt động."]}],
        }
        invalid_json_response = FakeResponse({
            "choices": [{"message": {"content": "not valid json"}}],
        })
        with patch.dict("os.environ", {"GROQ_API_KEY": "test-key"}):
            with patch("server.urlopen", side_effect=[TimeoutError(), invalid_json_response]):
                for _ in range(2):
                    with self.subTest(failure="timeout or malformed JSON"):
                        status, result = self.post({"text": self.paragraph, "fallback": fallback})
                        self.assertEqual(status, 200)
                        self.assertEqual(result["engine"], "rule-fallback")
                        self.assertEqual(result["overall_score"], 30)


if __name__ == "__main__":
    unittest.main()
