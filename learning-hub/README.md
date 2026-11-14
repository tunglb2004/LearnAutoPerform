# QA Study Hub

Mở **indexHome.html** bằng Chrome, Edge hoặc Firefox để chọn giáo trình.

```text
learning-hub/
├── indexHome.html               ← Trang chủ chung, mở tệp này
├── index.html                   ← Lối vào tương đương
├── assets/                      ← Giao diện và các chức năng dùng chung
├── automation/
│   ├── index.html               ← Selenium Java và Playwright JavaScript
│   └── source.md                ← Bản Markdown có đáp án
└── javascript-performance/
    ├── index.html               ← JavaScript cho Performance Tester
    └── source.md                ← Bản Markdown có đáp án
```

## Cách học

- Chọn một giáo trình ở trang chủ, sau đó chọn chương trong mục lục.
- Tìm tên hàm hoặc thuật ngữ bằng ô tìm kiếm. Kết quả tìm trong toàn bộ giáo trình đang mở, gồm cả các chương khác.
- Nhấn `/` hoặc `Ctrl+K` để chuyển đến ô tìm kiếm; `Esc` để xóa tìm kiếm hoặc đóng mục lục trên màn hình nhỏ.
- Code có màu cú pháp, xuống dòng và nút **Sao chép**. Khi code dài, cuộn ngang bên trong khối code.
- Đáp án nằm ngay sau câu hỏi và luôn hiển thị.
- Dùng **Chương trước / Chương tiếp theo** để học lần lượt; dùng **Đánh dấu đã học** để lưu tiến độ trên trình duyệt hiện tại.
- Có thể đổi sáng/tối, tăng giảm cỡ chữ và in/lưu PDF bằng chức năng của trình duyệt.

## Dùng trên máy khác

Sao chép hoặc giải nén nguyên thư mục rồi mở **indexHome.html**. Giữ nguyên thư mục `assets` và hai thư mục giáo trình để các liên kết hoạt động.

Trang đã có sẵn toàn bộ nội dung và màu cú pháp; việc đọc không cần kết nối mạng hay cài thư viện. Các liên kết tài liệu chính thức dẫn ra Internet khi bạn chủ động mở.

Tiến độ và tùy chọn đọc được lưu tại trình duyệt nếu trình duyệt cho phép lưu dữ liệu cho tệp cục bộ. Đổi máy, đổi trình duyệt hoặc xóa dữ liệu có thể làm mất tiến độ đã lưu; nội dung giáo trình vẫn có sẵn.

## Cập nhật nội dung sau này

Hai tệp Markdown gốc ở thư mục gốc của repository là nguồn biên soạn. Công cụ chuyển đổi nằm trong `tools/build.mjs`. Sau khi sửa nguồn, chạy các lệnh sau từ thư mục gốc của repository bằng Node.js 22 trở lên để tạo lại HTML và các bản `source.md`:

```powershell
npm --prefix learning-hub/tools ci
npm --prefix learning-hub/tools run build
```

Bạn chỉ cần `indexHome.html`, `index.html`, `assets`, `automation` và `javascript-performance` để đọc. Thư mục `tools` phục vụ việc biên soạn lại.

## Video bài giảng

Mỗi giáo trình có video đi kèm trong `learning-hub/videos/` (Automation: 8 video, JavaScript Performance: 5 video). Khi mở trang giáo trình, bấm nút **▶ Video** ở thanh công cụ hoặc bấm chip **▶ Video N · mm:ss** cạnh tên chương/mục để mở trình phát nổi và nhảy tới đúng thời điểm. Vị trí xem dở được nhớ theo trình duyệt.

- Mốc thời gian nằm trong `learning-hub/tools/video-map.json` (mục -> video, giây) và được `node build.mjs` chèn vào HTML.
- Mốc của mục không có đoạn riêng trong video được nội suy giữa hai mục lân cận, nên có thể lệch vài chục giây. Chương bài tập và lộ trình ôn tập chưa có video.
- Sửa mốc trong `video-map.json` rồi chạy `npm --prefix learning-hub/tools run build`.
