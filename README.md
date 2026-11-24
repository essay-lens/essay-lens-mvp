# Essay Lens — MVP demo

Essay Lens là giao diện tĩnh rà soát dấu hiệu văn phong theo từng đoạn. Trang tự điền sẵn một bài luận mẫu về trí tuệ nhân tạo trong giáo dục để thử kiểm tra; người dùng có thể thay bằng nội dung của mình. Phân tích chạy hoàn toàn trong trình duyệt bằng bộ luật local; bài làm không được gửi tới API hay lưu trên máy chủ. Có thể mở `public/index.html` qua Live Server hoặc static hosting, không cần Python.

## Chạy trên Windows

Yêu cầu Python 3.9+.

```powershell
Set-Location "C:\Users\PC\Downloads\dự án khởi nghiệp\ai-work-checker-mvp"
python server.py
```

Mở http://127.0.0.1:3000. Có thể đặt cổng khác qua biến môi trường `PORT`.

## Luật demo

`public/rule-engine.js` áp dụng 50 luật heuristic minh họa theo năm nhóm: từ nối/cụm khuôn mẫu, cấu trúc và nhịp câu, từ vựng/ngữ nghĩa, tổ chức lập luận/dấu câu, và tín hiệu tự nhiên làm giảm điểm. Mỗi đoạn bắt đầu từ 22/100; các nhóm cộng điểm có trần lần lượt là 26, 24, 20 và 18, còn các tín hiệu tự nhiên được khấu trừ tối đa 28 điểm. Một số luật dùng ước lượng đơn giản trên câu chữ, không phải phân tích ngôn ngữ học đã được kiểm chứng. Hiện UI chỉ hiển thị tối đa ba lý do cộng điểm và ghi nhận riêng các tín hiệu tự nhiên.

Ngưỡng nhãn theo tài liệu luật: 0–39 là “Ít dấu hiệu”, 40–64 là “Cần lưu ý”, 65–100 là “Nhiều dấu hiệu”. Điểm tổng quan là trung bình điểm các đoạn.

Đây chỉ là heuristic minh họa, không phải AI detector đã được kiểm chứng và không đưa ra xác suất sử dụng AI. Các luật có thể đánh dấu nhầm văn bản do người viết; không dùng kết quả làm bằng chứng hoặc căn cứ kỷ luật.
