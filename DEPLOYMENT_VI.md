# Triển khai Cocos Client lên Vercel

Client sử dụng Cocos Creator 3.4.0 và được phát hành dưới dạng Web Desktop tĩnh.

## 1. Cấu hình kết nối production

Vercel cần ba biến môi trường:

```dotenv
GAME_WS_URL=wss://domain-gate-railway
GAME_HTTP_URL=https://domain-http-railway
GAME_LOCALE=vi-VN
```

Không sửa trực tiếp URL production trong `GameConfig.ts`. Script `scripts/prepare-vercel.mjs` tạo `game-config.js` từ biến môi trường khi chuẩn bị bản deploy.

Production bắt buộc dùng:

- `wss://` cho Gateway;
- `https://` cho HTTP API;
- domain Vercel thật phải được thêm vào `CORS_ALLOWED_ORIGINS` và `WS_ALLOWED_ORIGINS` của backend Railway.

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

Script build sẽ dừng nếu địa chỉ Railway không dùng `wss://` và `https://`.

## 5. Việt hoá và phông chữ

- Ngôn ngữ mặc định: `vi-VN`.
- Các `Label`, `RichText` và `EditBox` dùng phông hệ thống `Arial`, hỗ trợ đầy đủ dấu tiếng Việt trên trình duyệt.
- Chuỗi giao diện, prefab, scene và dữ liệu JSON được xử lý qua `assets/scripts/i18n/`.
- Tên võ tướng đã chuyển sang âm Hán–Việt có dấu.
- Thuật ngữ công trình, kỹ năng, liên minh, chiến báo và trạng thái động đã được Việt hoá.
- Workflow kiểm tra hiện xác nhận không còn chuỗi Hán tự thiếu ánh xạ trong dữ liệu người dùng nhìn thấy hoặc mã TypeScript.

## 6. Bảo mật tài khoản phía client

- Đăng ký dùng HTTP `POST`, không đưa mật khẩu vào URL.
- Đăng nhập gửi mật khẩu gốc qua kết nối TLS (`HTTPS`/`WSS`) để backend băm bằng bcrypt.
- Không ghi mật khẩu, session hoặc nội dung yêu cầu nhạy cảm ra console.
- Chỉ lưu tên tài khoản trong `localStorage`.
- Nếu phiên bản cũ từng lưu mật khẩu, lần mở game tiếp theo sẽ tự loại bỏ trường đó.
- Mật khẩu đăng ký mới phải dài từ 8 đến 72 byte; đăng nhập vẫn chấp nhận tài khoản cũ để backend tự nâng cấp hash.

## 7. Kiểm tra tự động

Workflow `.github/workflows/client-audit.yml` thực hiện:

- kiểm tra cú pháp các script triển khai;
- parse toàn bộ tệp TypeScript;
- kiểm tra mọi chuỗi Hán tự đều có bản dịch;
- lưu báo cáo Việt hoá dưới dạng artifact GitHub Actions.

Kiểm tra gần nhất đã xác nhận:

- 145 tệp TypeScript có cú pháp hợp lệ;
- 775 khóa dịch;
- 863 lần xuất hiện Hán tự đều được ánh xạ;
- 0 chuỗi thiếu trong prefab, scene, JSON và TypeScript.

## 8. Kiểm tra thủ công trước khi phát hành

- Mở bản build bằng web server local, không mở trực tiếp `index.html` bằng `file://`.
- Kiểm tra đăng ký, đăng nhập, đăng nhập lại và đăng xuất.
- Kiểm tra tạo nhân vật có dấu tiếng Việt.
- Kiểm tra bản đồ, tướng, đội quân, liên minh, chat và chiến báo.
- Kiểm tra kết nối HTTPS API và WSS Gateway.
- Kiểm tra dấu tiếng Việt trên iOS Safari, Android Chrome và máy tính.
- Kiểm tra bố cục vì chuỗi tiếng Việt thường dài hơn tiếng Trung.
