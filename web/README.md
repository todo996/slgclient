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

## Trạng thái

Mốc nền tảng đã có:

- Vite + TypeScript strict.
- Phaser game canvas.
- camera kéo map và wheel zoom nền tảng.
- runtime config HTTP/WebSocket.
- EventBus, timer, storage và asset adapter.
- UI shell HTML/CSS cổ phong.
- cấu hình Vercel và GitHub Actions.

Bước tiếp theo:

1. Port `WebSock`, `NetNode`, `NetManager` và HTTP manager.
2. Nối login thật với backend.
3. Lập manifest và tải map thật từ `assets/resources`.
4. Port HUD và panel theo prefab.
