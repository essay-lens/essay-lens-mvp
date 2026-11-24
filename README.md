# Essay Lens — MVP demo

Giao diện MVP rà soát dấu hiệu văn phong theo từng đoạn. Khi cấu hình Groq, máy chủ ưu tiên phân tích qua Groq Cloud API; nếu thiếu API key hoặc Groq lỗi/timeout thì giao diện tự động dùng bộ luật chạy local trong trình duyệt.

## Chạy trên Windows

Yêu cầu Python 3.9+.

```powershell
Set-Location "C:\Users\PC\Downloads\dự án khởi nghiệp\ai-work-checker-mvp"
python server.py
```

Mở http://127.0.0.1:3000. Có thể đặt cổng khác qua biến môi trường `PORT`.

## Phân tích bằng Groq (tùy chọn)

Sao chép `.env.example` thành `.env` trong thư mục dự án, sau đó điền API key:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_BASE_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=llama-3.3-70b-versatile
API_TIMEOUT=15
```

Khởi động lại `python server.py` để máy chủ đọc cấu hình. Không commit hoặc chia sẻ `.env`. Khi có API key, nội dung bài được gửi tới Groq; khi không có key hoặc API lỗi, phân tích chuyển sang 50 luật local. Máy chủ không lưu văn bản.

## Luật demo

`public/rule-engine.js` áp dụng 50 luật heuristic minh họa theo năm nhóm: từ nối/cụm khuôn mẫu, cấu trúc và nhịp câu, từ vựng/ngữ nghĩa, tổ chức lập luận/dấu câu, và tín hiệu tự nhiên làm giảm điểm. Mỗi đoạn bắt đầu từ 22/100; các nhóm cộng điểm có trần lần lượt là 26, 24, 20 và 18, còn các tín hiệu tự nhiên được khấu trừ tối đa 28 điểm. Một số luật dùng ước lượng đơn giản trên câu chữ, không phải phân tích ngôn ngữ học đã được kiểm chứng. Hiện UI chỉ hiển thị tối đa ba lý do cộng điểm và ghi nhận riêng các tín hiệu tự nhiên.

Ngưỡng nhãn theo tài liệu luật: 0–39 là “Ít dấu hiệu”, 40–64 là “Cần lưu ý”, 65–100 là “Nhiều dấu hiệu”. Điểm tổng quan là trung bình điểm các đoạn.

Đây chỉ là heuristic minh họa, không phải AI detector đã được kiểm chứng và không đưa ra xác suất sử dụng AI. Các luật có thể đánh dấu nhầm văn bản do người viết; không dùng kết quả làm bằng chứng hoặc căn cứ kỷ luật.
