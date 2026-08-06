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
npm test
npm run typecheck
npm run build
```

`npm test` kiểm tra cấu trúc map thật, công thức tọa độ/cell ID và EventMgr.

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
- Phaser game canvas, camera kéo, wheel zoom và pinch zoom.
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
- Dùng lại khung panel và dải tiêu đề của prefab cũ; vùng chữ/input được làm rõ hơn.
- Form tạo nhân vật, giới tính và tên ngẫu nhiên tiếng Việt.
- Giữ chuỗi request `account.login` → `role.enterServer`.
- Mã `9` mở tạo nhân vật rồi gửi `role.create`.
- Sau khi vào server, lấy `nationMap.config`, `role.myProperty` và `role.posTagList` trước khi báo map sẵn sàng.

### M4 — bản đồ thật (đang triển khai)

- Chuyển nguyên `map.tmx` 200×200 sang Tiled JSON, không đổi tile ID.
- Giữ đủ `base`, `hill1`, `hill2`, `hill3`, `obstruct`, `city_position`.
- Sao chép đúng bốn tileset đang được map tham chiếu.
- Giữ `mapRes_0.json` và kiểm tra đủ 40.000 cell.
- Giữ công thức cell ID và chuyển đổi tọa độ của `MapUtil` cũ.
- Camera kéo, zoom chuột, pinch zoom và chọn ô trên map thật.

## Bước tiếp theo

1. Port dữ liệu scan block, thành trì, tài nguyên và công trình lên map thật.
2. Port HUD tài nguyên và menu dưới theo prefab cũ.
3. Port panel thành trì/công trình trước, rồi đến tướng và đội quân.
4. Chuyển animation cần thiết sau khi hành vi từng module đã pass.
