# Client web Tam Quốc Truyền Kỳ

Client web được triển khai song song với client Cocos hiện tại.

## Nguyên tắc

- Không xóa hoặc sửa cấu trúc client Cocos trong giai đoạn chuyển đổi.
- Giữ nguyên backend, protocol, command, proxy, gameplay, map và asset.
- Phaser quản lý vùng game/map.
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

Client hỗ trợ cả tên mới và tên Vercel cũ:

```dotenv
VITE_GAME_HTTP_URL=https://ten-backend.up.railway.app
VITE_GAME_WS_URL=wss://ten-backend.up.railway.app

# Hoặc
GAME_HTTP_URL=https://ten-backend.up.railway.app
GAME_WS_URL=wss://ten-backend.up.railway.app
```

Không thêm `/api` hoặc `/ws` nếu backend không sử dụng prefix đó.

## Trạng thái chuyển đổi

### M1 — nền tảng web

- Vite + TypeScript strict.
- Phaser game canvas và camera kéo/zoom nền tảng.
- Runtime config, adapter và UI shell cổ phong.
- Build độc lập trên GitHub Actions và Vercel.

### M2 — network nền tảng

- `EventMgr`, `HttpInvoke`, `HttpManager`.
- `WebSock`, `NetTimer`, `NetNode`, `NetManager`.
- Giữ `name/msg/seq`, handshake key, gzip level 9 và AES-CBC ZeroPadding.
- Request queue, timeout, heartbeat và reconnect.

### M3 — đăng nhập và tạo nhân vật

- Port `HttpConfig`, `ServerConfig`, `LocalCache`, `Tools`, `DateUtil`.
- Port `LoginProxy` và `LoginCommand`.
- Form đăng nhập/đăng ký HTML/CSS với validation giống Cocos.
- Form tạo nhân vật, giới tính và tên ngẫu nhiên tiếng Việt.
- Giữ chuỗi request `account.login` → `role.enterServer`.
- Mã `9` mở tạo nhân vật rồi gửi `role.create`.
- Sau khi vào server, lấy `nationMap.config`, `role.myProperty` và `role.posTagList` trước khi báo map sẵn sàng.

## Bước tiếp theo

1. Sao chép asset runtime từ `assets/resources` nhưng bỏ `.meta`, `.scene`, `.prefab`, `.anim`.
2. Lập manifest asset.
3. Port TMX/tileset và thay lưới nền tảng bằng map thật.
4. Port HUD và panel theo từng prefab.
