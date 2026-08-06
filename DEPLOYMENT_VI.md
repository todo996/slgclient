# Triển khai Client lên Vercel

Client sử dụng Cocos Creator 3.4.0, được build dưới dạng Web Desktop và bổ sung lớp PWA cho máy tính, Android và iPhone.

## 1. Kiến trúc

```text
Người chơi
    │
    ▼
Vercel — Cocos Web/PWA
    ├── HTTPS ─┐
    └── WSS ───┤
               ▼
     Một Railway Service duy nhất
               │
               ▼
      Supabase PostgreSQL
```

Client không kết nối trực tiếp tới Supabase. HTTP API và WebSocket cùng sử dụng một domain Railway.

## 2. Build Cocos trước khi đưa lên Vercel

Vercel không có sẵn Cocos Creator 3.4.0. Vì vậy cần tạo bản Web Desktop trước:

1. Mở repository bằng Cocos Creator 3.4.0.
2. Chọn **Project → Build**.
3. Chọn nền tảng **Web Desktop**.
4. Đặt thư mục đầu ra: `build/web-desktop`.
5. Nhấn **Build**.
6. Kiểm tra thư mục có `index.html`, `assets`, `src` và các tệp ứng dụng Cocos.
7. Commit thư mục `build/web-desktop` cùng mã nguồn.

Quy trình cập nhật:

```text
Sửa project Cocos
→ Build lại build/web-desktop
→ Commit và push GitHub
→ Vercel tự deploy
```

Nếu không có máy tính, cần dùng một máy Windows/macOS trên cloud có cài Cocos Creator 3.4.0 hoặc nhờ một máy khác thực hiện lần build Cocos. GitHub/Vercel chỉ tự động hoá được sau khi có môi trường Cocos hợp lệ.

## 3. Tạo Vercel Project

1. Vào Vercel và chọn **Add New → Project**.
2. Import repository `slgclient`.
3. Chọn nhánh `main`.
4. Framework Preset: **Other**.
5. Build Command: `npm run vercel-build`.
6. Output Directory: `build/web-desktop`.
7. Install Command có thể để mặc định hoặc để trống.

`vercel.json` đã chứa Build Command, Output Directory, cache PWA và các header bảo mật cơ bản.

## 4. Biến môi trường Vercel

Giả sử Railway cấp domain:

```text
https://tam-quoc-server-production.up.railway.app
```

Thêm trong **Project Settings → Environment Variables**:

```dotenv
GAME_HTTP_URL=https://tam-quoc-server-production.up.railway.app
GAME_WS_URL=wss://tam-quoc-server-production.up.railway.app
GAME_LOCALE=vi-VN
GAME_APP_NAME=Tam Quốc Việt Nam
GAME_SHORT_NAME=Tam Quốc
```

Ba biến bắt buộc:

- `GAME_HTTP_URL`: domain HTTPS duy nhất của Railway.
- `GAME_WS_URL`: cùng domain đó nhưng dùng `wss://`.
- `GAME_LOCALE`: đặt `vi-VN`.

Hai biến tên ứng dụng là tuỳ chọn. Không thêm dấu `/` cuối URL và không thêm `/api` hoặc `/ws`.

## 5. Đồng bộ domain Vercel sang Railway

Sau khi Vercel cấp domain, ví dụ:

```text
https://tam-quoc-viet-nam.vercel.app
```

Cập nhật service Railway duy nhất:

```dotenv
CORS_ALLOWED_ORIGINS=https://tam-quoc-viet-nam.vercel.app
WS_ALLOWED_ORIGINS=https://tam-quoc-viet-nam.vercel.app
```

Nếu có cả domain Vercel và custom domain, phân cách bằng dấu phẩy:

```dotenv
CORS_ALLOWED_ORIGINS=https://tam-quoc-viet-nam.vercel.app,https://game.example.com
WS_ALLOWED_ORIGINS=https://tam-quoc-viet-nam.vercel.app,https://game.example.com
```

Sau đó Railway chỉ redeploy một service.

## 6. PWA được tạo tự động

Lệnh `npm run vercel-build` không build lại Cocos. Lệnh này lấy bản Cocos đã có trong `build/web-desktop` và tạo thêm:

```text
manifest.webmanifest
service-worker.js
pwa-register.js
mobile-shell.css
offline.html
icons/icon-192.png
icons/icon-512.png
icons/icon-maskable-512.png
icons/apple-touch-icon.png
game-config.js
```

PWA có:

- chế độ toàn màn hình;
- hướng ngang ưu tiên;
- cache tài nguyên đã tải;
- trang thông báo khi mất mạng;
- nút cài ứng dụng trên trình duyệt hỗ trợ;
- hướng dẫn cài thủ công trên iPhone;
- biểu tượng Android, maskable và Apple Touch Icon.

`game-config.js` luôn dùng `no-store` để không giữ URL backend cũ sau khi đổi môi trường.

## 7. Hỗ trợ Android và iPhone

Game dùng thiết kế ngang `1280 × 720`.

- Khi màn hình đủ rộng, game giữ chiều cao và mở rộng vùng nhìn ngang.
- Khi màn hình hẹp hoặc dọc, game hiển thị toàn bộ khung thiết kế.
- CSS dùng `env(safe-area-inset-*)` để tránh tai thỏ, Dynamic Island và Home Indicator.
- `visualViewport` giúp cập nhật chiều cao khi Safari thu gọn thanh công cụ hoặc bàn phím ảo mở.
- Người chơi được nhắc xoay ngang nếu mở dọc.

### Cài trên iPhone/iPad

1. Mở domain game bằng Safari.
2. Nhấn **Chia sẻ**.
3. Chọn **Thêm vào Màn hình chính**.
4. Xác nhận tên ứng dụng.
5. Mở game từ biểu tượng mới để chạy ở chế độ ứng dụng.

### Cài trên Android

1. Mở game bằng Chrome hoặc trình duyệt hỗ trợ PWA.
2. Nhấn nút **Cài game** khi xuất hiện.
3. Hoặc mở menu trình duyệt và chọn **Cài đặt ứng dụng**.

## 8. Kiểm tra trước khi phát hành

Chạy:

```bash
npm run test:pwa
node scripts/check-typescript-syntax.mjs
node scripts/audit-vietnamese.mjs
```

Kiểm tra thủ công:

- đăng ký, đăng nhập, đăng nhập lại và đăng xuất;
- tạo tên nhân vật tiếng Việt có dấu;
- bản đồ, thành trì, võ tướng, đội quân, liên minh, chat và chiến báo;
- iPhone Safari khi mở trực tiếp và khi mở từ màn hình chính;
- Android Chrome ở chế độ trình duyệt và PWA;
- xoay ngang/dọc;
- thiết bị có tai thỏ hoặc Dynamic Island;
- mất mạng và kết nối lại;
- domain HTTPS/WSS không có lỗi CORS hoặc Origin.

## 9. Khắc phục lỗi thường gặp

### Không tìm thấy `build/web-desktop/index.html`

Cần build Web Desktop bằng Cocos Creator 3.4.0 trước. Vercel không thể tự thay thế Cocos Editor chỉ từ mã nguồn project.

### Website mở được nhưng không kết nối server

Kiểm tra:

- `GAME_WS_URL` có đúng `wss://`;
- `GAME_HTTP_URL` có đúng `https://`;
- hai biến dùng cùng một domain Railway;
- domain Vercel đã nằm trong `CORS_ALLOWED_ORIGINS` và `WS_ALLOWED_ORIGINS`;
- `/healthz` của Railway trả đủ năm thành phần ở trạng thái `ok`.

### iPhone chưa cập nhật bản mới

Đóng PWA hoàn toàn rồi mở lại. Nếu vẫn còn bản cũ, xoá ứng dụng khỏi màn hình chính, xoá dữ liệu website trong Safari và cài lại.

### Không thấy nút cài trên iPhone

Safari iPhone dùng quy trình **Chia sẻ → Thêm vào Màn hình chính**, không dùng sự kiện cài đặt giống Chrome Android.
