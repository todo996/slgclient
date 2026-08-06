# Tam Quốc Việt Nam — Cocos Client

Client game chiến thuật SLG Tam Quốc được phát triển bằng **Cocos Creator 3.4.0**, đã được chuẩn bị cho giao diện tiếng Việt, trình duyệt máy tính, Android, iPhone và chế độ PWA.

## Tính năng chính

- Bản đồ thế giới, thành trì và lãnh địa.
- Võ tướng, kỹ năng, đội quân và chiêu mộ binh lính.
- Xây dựng, nâng cấp công trình và quản lý tài nguyên.
- Liên minh, trò chuyện và chiến báo.
- Giao diện và dữ liệu hiển thị bằng tiếng Việt có dấu.
- Kết nối backend bằng HTTPS và WebSocket bảo mật WSS.
- Giao diện responsive theo màn hình điện thoại và máy tính.
- Hỗ trợ vùng tai thỏ, Dynamic Island và thanh Home Indicator trên iPhone.
- PWA có thể cài lên màn hình chính và chạy toàn màn hình.

## Cấu trúc triển khai

```text
Cocos Web Desktop / PWA
        │
        ├── HTTPS → http-service trên Railway
        └── WSS   → gate-service trên Railway
```

Client không kết nối trực tiếp tới Supabase. Toàn bộ dữ liệu tài khoản và dữ liệu game đi qua backend Railway.

## Yêu cầu phát triển

- Cocos Creator `3.4.0`.
- Node.js `22` để chạy kiểm tra và script chuẩn bị Vercel.
- Backend `slgserver` đã được triển khai.

## Chạy trong Cocos Creator

1. Mở thư mục repository bằng Cocos Creator 3.4.0.
2. Chờ Editor import toàn bộ asset và metadata.
3. Mở `assets/MainScene.scene`.
4. Nhấn Preview để kiểm tra giao diện.
5. Backend local mặc định có thể được cấu hình trong `assets/scripts/config/GameConfig.ts`.

## Build Web Desktop

Trong Cocos Creator:

1. Chọn **Project → Build**.
2. Chọn nền tảng **Web Desktop**.
3. Đặt thư mục đầu ra là `build/web-desktop`.
4. Build project.

Sau khi build, chạy script chuẩn bị Vercel/PWA:

```bash
GAME_WS_URL=wss://domain-gate-railway \
GAME_HTTP_URL=https://domain-http-railway \
GAME_LOCALE=vi-VN \
npm run vercel-build
```

Script sẽ tạo thêm:

- `manifest.webmanifest`;
- `service-worker.js`;
- giao diện safe-area cho Android/iPhone;
- biểu tượng PWA và Apple Touch Icon;
- trang thông báo mất kết nối;
- cấu hình runtime kết nối Railway.

## Hỗ trợ mobile và iPhone

Thiết kế gốc sử dụng tỷ lệ ngang `1280 × 720`.

- Khi thiết bị đang ngang, game mở rộng phù hợp theo chiều cao màn hình.
- Khi màn hình hẹp hoặc đang dọc, game dùng chế độ hiển thị toàn bộ để không mất nút giao diện.
- Trên điện thoại, nên xoay ngang để chơi thuận tiện nhất.
- Vùng tai thỏ, Dynamic Island và Home Indicator được xử lý bằng CSS safe-area.
- Chiều cao được cập nhật khi thanh Safari hoặc bàn phím ảo thay đổi.

### Cài trên iPhone

1. Mở game bằng Safari.
2. Nhấn nút **Chia sẻ**.
3. Chọn **Thêm vào Màn hình chính**.
4. Mở biểu tượng **Tam Quốc** vừa được tạo.

### Cài trên Android

Trình duyệt tương thích sẽ hiển thị nút **Cài game**. Người chơi cũng có thể mở menu trình duyệt và chọn **Cài đặt ứng dụng** hoặc **Thêm vào màn hình chính**.

## Kiểm tra tự động

```bash
npm run test:pwa
node scripts/check-typescript-syntax.mjs
node scripts/audit-vietnamese.mjs
```

GitHub Actions kiểm tra:

- cú pháp toàn bộ TypeScript;
- quá trình tạo PWA và biểu tượng;
- cấu hình mobile/iPhone;
- toàn bộ chuỗi Hán tự còn sót phải có bản dịch tiếng Việt.

## Triển khai

Xem hướng dẫn đầy đủ tại [`DEPLOYMENT_VI.md`](./DEPLOYMENT_VI.md).

## Ảnh minh hoạ

| Nội dung | Ảnh |
| --- | --- |
| Chiêu mộ binh lính | ![Chiêu mộ binh lính](./img/01.png) |
| Chiếm lãnh địa | ![Chiếm lãnh địa](./img/02.png) |
| Thành trì | ![Thành trì](./img/10.png) |
| Võ tướng | ![Võ tướng](./img/11.png) |
| Chiến báo | ![Chiến báo](./img/13.png) |
| Liên minh | ![Liên minh](./img/09.png) |
| Trò chuyện | ![Trò chuyện](./img/14.png) |

## Lưu ý bản quyền tài nguyên

Mã nguồn client được phát triển từ dự án demo gốc. Một số hình ảnh và tài nguyên đồ hoạ có nguồn từ Internet hoặc bản demo ban đầu. Trước khi phát hành thương mại, cần tự kiểm tra và thay thế mọi tài nguyên chưa có quyền sử dụng thương mại rõ ràng.
