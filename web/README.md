# Client web Tam Quốc Truyền Kỳ

Đây là client web được triển khai song song với client Cocos hiện tại.

## Nguyên tắc

- Không xóa hoặc sửa cấu trúc client Cocos trong giai đoạn chuyển đổi.
- Giữ nguyên backend, protocol, command, proxy, gameplay, map và asset.
- Phaser chỉ quản lý vùng game/map.
- HTML/CSS quản lý menu, panel, chữ, danh sách, input và popup.
- Mỗi module chỉ được port sau khi module trước build và kiểm thử đạt.

## Chạy local

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

## Kiểm tra

```bash
npm run typecheck
npm run build
```

## Biến môi trường

```dotenv
VITE_GAME_HTTP_URL=https://ten-backend.up.railway.app
VITE_GAME_WS_URL=wss://ten-backend.up.railway.app
```

Không thêm `/api` hoặc `/ws` nếu backend không sử dụng prefix đó.

## Trạng thái chuyển đổi

### M1 — nền tảng web

- Vite + TypeScript strict.
- Phaser game canvas.
- Camera kéo map và wheel zoom nền tảng.
- Runtime config HTTP/WebSocket.
- Asset, timer và storage adapter.
- UI shell HTML/CSS cổ phong.
- Cấu hình Vercel và GitHub Actions.

### M2 — network nền tảng

Đã port sang browser mà không đổi protocol:

- `EventMgr` tương thích API cũ.
- `HttpInvoke` và `HttpManager`.
- `WebSock`, `NetTimer`, `NetNode`, `NetManager`.
- Envelope `name/msg/seq`.
- Gzip level 9.
- Handshake nhận key.
- AES-CBC với key dùng làm IV và ZeroPadding.
- Request queue, timeout, heartbeat và reconnect.
- Trạng thái kết nối hiển thị trên app shell.

Bước kế tiếp:

1. Port config endpoint và `LoginCommand`/`LoginProxy` thuần TypeScript.
2. Dựng panel đăng nhập HTML/CSS và đăng nhập bằng backend thật.
3. Lập manifest rồi tải map thật từ `assets/resources`.
4. Port HUD và panel theo từng prefab.
