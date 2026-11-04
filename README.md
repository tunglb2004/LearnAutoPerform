# LearnAutoPerform

Hai giáo trình tiếng Việt dành cho người muốn đọc hiểu và chỉnh sửa mã kiểm thử:

- **Automation Testing:** Selenium + Java đối chiếu với Playwright + JavaScript, gồm 32 chương và 203 bảng so sánh.
- **JavaScript cho Performance Tester:** ôn JavaScript, đọc kịch bản k6, cấu hình tải và phân tích kết quả, gồm 30 chương.

Giao diện có mục lục, tìm kiếm, code xuống dòng và tô màu, nút sao chép, đáp án ngay dưới bài tập, tùy chọn sáng/tối và lưu tiến độ trên trình duyệt.

## Mở giáo trình

Clone hoặc tải repository về máy, sau đó mở **[learning-hub/indexHome.html](learning-hub/indexHome.html)** bằng Chrome, Edge hoặc Firefox. Giữ nguyên các thư mục bên trong `learning-hub`.

Việc đọc giáo trình hoạt động ngoại tuyến và không cần cài dependency. Các liên kết tài liệu chính thức cần Internet khi mở.

```text
LearnAutoPerform/
├── README.md
├── Giao-trinh-Automation-Selenium-Java-va-Playwright-JavaScript.md
├── Giao-trinh-JavaScript-cho-Performance-Tester.md
└── learning-hub/
    ├── indexHome.html
    ├── index.html
    ├── assets/
    │   ├── styles.css
    │   └── app.js
    ├── automation/
    │   ├── index.html
    │   └── source.md
    ├── javascript-performance/
    │   ├── index.html
    │   └── source.md
    └── tools/
        ├── build.mjs
        ├── package.json
        └── package-lock.json
```

## Cập nhật nội dung và tạo lại HTML

Chỉnh hai tệp Markdown ở thư mục gốc, rồi chạy các lệnh sau từ thư mục gốc của repository. Cần Node.js 22 trở lên và npm để biên soạn lại:

```powershell
npm --prefix learning-hub/tools ci
npm --prefix learning-hub/tools run build
```

Công cụ sẽ tạo lại hai trang giáo trình cùng bản `source.md` tương ứng. CSS và JavaScript của giao diện nằm trong `learning-hub/assets`.

Các thư viện tải về, trình duyệt dùng kiểm chứng và thư mục làm việc tạm được loại khỏi Git bằng `.gitignore`.
