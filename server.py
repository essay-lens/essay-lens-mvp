import json
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT / "public"
MAX_REQUEST_BYTES = 100_000
MAX_CHARACTERS = 10_000
MAX_PARAGRAPHS = 60
DISCLAIMER = (
    "Đây là nhận định tham khảo, không phải xác suất sử dụng AI hay kết luận về tác giả. "
    "Các dấu hiệu có thể xuất hiện trong bài do con người viết; không dùng kết quả làm "
    "bằng chứng hoặc căn cứ kỷ luật."
)


def load_dotenv(path=ROOT / ".env"):
    """Load simple KEY=VALUE entries without overriding the process environment."""
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return

    for line in lines:
        entry = line.strip()
        if not entry or entry.startswith("#"):
            continue
        if entry.startswith("export "):
            entry = entry[7:].lstrip()
        key, separator, value = entry.partition("=")
        key = key.strip()
        if not separator or not key or key in os.environ:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        os.environ[key] = value


def split_paragraphs(text):
    return [part.strip() for part in re.split(r"\n\s*\n", text.strip()) if part.strip()]


def label_for_score(score):
    if score < 40:
        return "Ít dấu hiệu"
    if score < 65:
        return "Cần lưu ý"
    return "Nhiều dấu hiệu"


def normalize_result(candidate, paragraphs, engine):
    if not isinstance(candidate, dict):
        raise ValueError("Analysis result must be a JSON object.")
    source_paragraphs = candidate.get("paragraphs")
    if not isinstance(source_paragraphs, list) or len(source_paragraphs) != len(paragraphs):
        raise ValueError("Analysis result has an invalid paragraph list.")

    results = []
    for index, (text, item) in enumerate(zip(paragraphs, source_paragraphs)):
        if not isinstance(item, dict):
            raise ValueError("Analysis result contains an invalid paragraph.")
        raw_score = item.get("suspicion_score")
        if isinstance(raw_score, bool) or not isinstance(raw_score, (int, float)):
            raise ValueError("Paragraph score must be numeric.")
        score = max(0, min(100, round(raw_score)))
        reasons = item.get("reasons")
        if not isinstance(reasons, list) or any(not isinstance(reason, str) for reason in reasons):
            raise ValueError("Paragraph reasons must be a list of strings.")
        results.append({
            "index": index,
            "text": text,
            "suspicion_score": score,
            "label": label_for_score(score),
            "reasons": reasons[:3],
        })

    overall_score = round(sum(item["suspicion_score"] for item in results) / len(results))
    summary = candidate.get("summary")
    if not isinstance(summary, str) or not summary.strip():
        raise ValueError("Analysis result has no summary.")
    return {
        "engine": engine,
        "overall_risk_level": label_for_score(overall_score),
        "overall_score": overall_score,
        "overall_suspicion_score": overall_score,
        "summary": summary.strip(),
        "paragraphs": results,
        "disclaimer": DISCLAIMER,
    }


def fallback_result(candidate, paragraphs):
    if candidate is None:
        candidate = {
            "summary": "Đã sử dụng bộ luật văn phong local do chưa cấu hình Groq.",
            "paragraphs": [
                {
                    "suspicion_score": 22,
                    "reasons": ["Chưa có kết quả luật local gửi từ giao diện."],
                }
                for _ in paragraphs
            ],
        }
    return normalize_result(candidate, paragraphs, "rule-fallback")


def groq_result(paragraphs, language, field):
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    try:
        timeout = float(os.getenv("API_TIMEOUT", "15"))
        if timeout <= 0:
            raise ValueError
    except ValueError:
        timeout = 15.0
    base_url = os.getenv(
        "GROQ_BASE_URL",
        "https://api.groq.com/openai/v1/chat/completions",
    ).strip()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    if not base_url or not model:
        raise ValueError("Groq endpoint and model must be configured.")

    system_prompt = (
        "Bạn là chuyên gia rà soát văn phong học thuật tiếng Việt và đa ngành. "
        "Đánh giá thận trọng từng đoạn về các tín hiệu phong cách có thể gặp ở văn bản "
        "AI tạo sinh: câu chữ tổng hợp mượt nhưng sáo rỗng, lập luận cân đối khuôn mẫu, "
        "thiếu trải nghiệm cá nhân hoặc số liệu neo thực tế, và từ chuyển ý công thức. "
        "Đây chỉ là heuristic tham khảo, không xác định tác giả hay chứng minh việc dùng AI. "
        "Chỉ trả về một JSON object đúng schema: "
        '{"overall_risk_level":"Ít dấu hiệu|Cần lưu ý|Nhiều dấu hiệu",'
        '"overall_score":0,"summary":"...","paragraphs":['
        '{"index":0,"suspicion_score":0,"label":"Ít dấu hiệu|Cần lưu ý|Nhiều dấu hiệu",'
        '"reasons":["tối đa 3 lý do"]}],"disclaimer":"...","engine":"groq-ai"}. '
        "Mỗi đoạn phải có đúng một phần tử theo thứ tự đầu vào, điểm từ 0 đến 100, "
        "lý do ngắn gọn và bằng ngôn ngữ phù hợp với bài."
    )
    user_content = json.dumps({
        "language": language,
        "field": field,
        "paragraphs": [
            {"index": index, "text": paragraph}
            for index, paragraph in enumerate(paragraphs)
        ],
    }, ensure_ascii=False)
    request_body = json.dumps({
        "model": model,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
    }).encode("utf-8")
    request = Request(
        base_url,
        data=request_body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urlopen(request, timeout=timeout) as response:
        response_body = json.loads(response.read().decode("utf-8"))
    content = response_body["choices"][0]["message"]["content"]
    if not isinstance(content, str):
        raise ValueError("Groq returned non-text message content.")
    decoded = json.loads(content)
    return normalize_result(decoded, paragraphs, "groq-ai")


def analyze_request(payload):
    text = payload.get("text")
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Text must be a non-empty string.")
    if len(text) > MAX_CHARACTERS:
        raise ValueError("Text exceeds the maximum length.")
    paragraphs = split_paragraphs(text)
    if not paragraphs or len(paragraphs) > MAX_PARAGRAPHS:
        raise ValueError("Text must contain between 1 and 60 paragraphs.")

    try:
        return groq_result(
            paragraphs,
            str(payload.get("language", "vi")),
            str(payload.get("field", "general")),
        )
    except Exception as error:
        if not isinstance(error, RuntimeError) or "not configured" not in str(error):
            print(f"Groq analysis failed; using local rules ({type(error).__name__}).", file=sys.stderr)
        return fallback_result(payload.get("fallback"), paragraphs)


class DemoStaticHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        requested_path = urlsplit(path).path
        if requested_path == "/":
            return str(PUBLIC_DIR / "index.html")
        if requested_path in {"/styles.css", "/app.js", "/rule-engine.js"}:
            return str(PUBLIC_DIR / requested_path.lstrip("/"))
        return super().translate_path(path)

    def do_GET(self):
        requested_file = Path(super().translate_path(self.path)).resolve()
        if requested_file == (ROOT / ".env").resolve():
            self.send_error(404)
            return
        super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != "/api/analyze":
            self.send_error(404)
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > MAX_REQUEST_BYTES:
                raise ValueError("Invalid request size.")
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("Request body must be a JSON object.")
            result = analyze_request(payload)
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
            self.send_json(400, {"error": str(error)})
            return
        self.send_json(200, result)

    def send_json(self, status, payload):
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format_string, *args):
        return


def main():
    load_dotenv()
    try:
        port = int(os.getenv("PORT", "3000"))
        if not 1 <= port <= 65535:
            raise ValueError
    except ValueError:
        print("PORT must be an integer from 1 to 65535.", file=sys.stderr)
        raise SystemExit(2)
    server = ThreadingHTTPServer(("127.0.0.1", port), DemoStaticHandler)
    print(f"Essay Lens demo running at http://127.0.0.1:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
