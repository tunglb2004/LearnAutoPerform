# LearnProject

Hai giáo trình tiếng Việt dành cho người muốn đọc hiểu và chỉnh sửa mã kiểm thử:

- **Automation Testing:** Selenium + Java đối chiếu với Playwright + JavaScript, gồm 32 chương và 203 bảng so sánh.
- **JavaScript cho Performance Tester:** ôn JavaScript, đọc kịch bản k6, cấu hình tải và phân tích kết quả, gồm 30 chương.

Giao diện có mục lục, tìm kiếm, code xuống dòng và tô màu, nút sao chép, đáp án ngay dưới bài tập, tùy chọn sáng/tối và lưu tiến độ trên trình duyệt.

## Mở giáo trình

Mở **[learning-hub/indexHome.html](learning-hub/indexHome.html)** bằng Chrome, Edge hoặc Firefox. Giữ nguyên các thư mục bên trong `learning-hub`.

Việc đọc giáo trình hoạt động ngoại tuyến và không cần cài dependency. Các liên kết tài liệu chính thức cần Internet khi mở.

```text
LearnProject/
├── README.md
├── Giao-trinh-Automation-Selenium-Java-va-Playwright-JavaScript.md
├── Giao-trinh-JavaScript-cho-Performance-Tester.md
├── learning-hub/
│   ├── indexHome.html
│   ├── index.html
│   ├── assets/
│   ├── automation/
│   ├── javascript-performance/
│   └── tools/
└── examples/
    ├── automation/
    │   ├── demo-app/
    │   ├── selenium-java/
    │   └── playwright-js/
    └── performance/
```

## Cập nhật nội dung và tạo lại HTML

Chỉnh hai tệp Markdown ở thư mục gốc, rồi chạy các lệnh sau từ thư mục LearnProject. Cần Node.js 22 trở lên và npm để biên soạn lại:

```powershell
npm --prefix learning-hub/tools ci
npm --prefix learning-hub/tools run build
```

Công cụ sẽ tạo lại hai trang giáo trình cùng bản `source.md` tương ứng. CSS và JavaScript của giao diện nằm trong `learning-hub/assets`.

Các thư viện tải về, trình duyệt dùng kiểm chứng và thư mục làm việc tạm được loại khỏi Git bằng `.gitignore`.

## Mã mẫu kiểm thử

- **Automation** nằm trong [examples/automation](examples/automation). Từ thư mục đó, chạy `node demo-app/server.mjs` ở một cửa sổ terminal. Ở cửa sổ khác, chạy `mvn test` trong `selenium-java`, hoặc `npm ci`, `npx playwright install chromium` rồi `npm test` trong `playwright-js`. Xem chương 21, 22 và 31 để biết cấu hình và dữ liệu mẫu.
- **Performance** nằm trong [examples/performance](examples/performance). Từ thư mục đó, kiểm tra cấu hình bằng `k6 inspect tests/product.test.js`. Khi chạy tải, truyền `BASE_URL` trỏ tới API khớp hợp đồng ở chương 20 của giáo trình.

## Video bài giảng

Mỗi giáo trình có video đi kèm trong `learning-hub/videos/` (Automation: 8 video, JavaScript Performance: 5 video). Khi mở trang giáo trình, bấm nút **▶ Video** ở thanh công cụ hoặc bấm chip **▶ Video N · mm:ss** cạnh tên chương/mục để mở trình phát nổi và nhảy tới đúng thời điểm. Vị trí xem dở được nhớ theo trình duyệt.

- Mốc thời gian nằm trong `learning-hub/tools/video-map.json` (mục -> video, giây) và được `node build.mjs` chèn vào HTML.
- Mốc của mục không có đoạn riêng trong video được nội suy giữa hai mục lân cận, nên có thể lệch vài chục giây. Chương bài tập và lộ trình ôn tập chưa có video.
- Sửa mốc trong `video-map.json` rồi chạy `npm --prefix learning-hub/tools run build`.
