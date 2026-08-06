# Triển khai Cocos Client lên Vercel

Client sử dụng Cocos Creator 3.4.0 và được phát hành dưới dạng Web Desktop tĩnh.

## 1. Cấu hình kết nối production

Vercel cần ba biến môi trường:

```dotenv
GAME_WS_URL=wss://domain-gate-railway
GAME_HTTP_URL=https://domain-http-railway
GAME_LOCALE=vi-VN
```

Không sửa trực tiếp URL production trong `GameConfig.ts`. Script `scripts/prepare-vercel.mjs` sẽ tạo `game-config.js` khi build Vercel.

## 2. Build bằng Cocos Creator

Repository là mã nguồn Cocos, không phải dự án web npm thông thường. Máy build phải có Cocos Creator 3.4.0.

Trong Cocos Creator:

1. Mở project.
2. Chọn **Project > Build**.
3. Chọn nền tảng **Web Desktop**.
4. Đặt thư mục đầu ra là `build/web-desktop`.
5. Build project.

Sau khi build, thư mục phải chứa tối thiểu:

```text
build/web-desktop/
├── index.html
├── application.*
├── assets/
└── src/
```

## 3. Deploy Vercel

1. Kết nối Vercel Project với repository `slgclient`.
2. Chọn nhánh triển khai.
3. Build Command: `npm run vercel-build`.
4. Output Directory: `build/web-desktop`.
5. Thêm ba biến môi trường ở mục 1.

`vercel.json` đã chứa sẵn Build Command, Output Directory và quy tắc cache.

## 4. Cách cập nhật

Ở giai đoạn hiện tại, Cocos Creator phải tạo lại bản Web Desktop trước khi push:

```text
Sửa mã nguồn Cocos
→ Build Web Desktop bằng Cocos Creator 3.4.0
→ Commit mã nguồn và build/web-desktop
→ Push GitHub một lần
→ Vercel tự deploy
```

Không dùng `ws://` hoặc `http://` cho production vì website Vercel chạy HTTPS. Script build sẽ dừng nếu URL Railway không dùng `wss://` và `https://`.

## 5. Việt hoá và phông chữ

- Ngôn ngữ mặc định: `vi-VN`.
- Các Label/RichText/EditBox được chuyển sang phông hệ thống `Arial`, hỗ trợ đầy đủ dấu tiếng Việt trên trình duyệt.
- Chuỗi giao diện cũ được xử lý qua `assets/scripts/i18n/I18n.ts`.
- Tên ngẫu nhiên đã đổi sang tên Hán–Việt có dấu.

## 6. Kiểm tra trước khi phát hành

- Mở bản build bằng một web server local, không mở trực tiếp `index.html` bằng `file://`.
- Kiểm tra đăng ký, đăng nhập, tạo nhân vật.
- Kiểm tra kết nối HTTPS API và WSS gateway.
- Kiểm tra dấu tiếng Việt trên iOS Safari, Android Chrome và máy tính.
- Kiểm tra bố cục vì chuỗi tiếng Việt thường dài hơn tiếng Trung.
