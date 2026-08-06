# Game assets

Tài nguyên web được sao chép chọn lọc từ client Cocos, không chứa `.meta`, `.scene`, `.prefab` hoặc `.anim`.

## `world/`

- `map.json`: bản chuyển cơ học từ `assets/resources/world/map.tmx`.
- `mapRes_0.json`: dữ liệu cell hiện tại của game.
- Bốn ảnh tileset đúng theo tham chiếu trong TMX.

Có thể tạo lại map bằng:

```bash
npm run prepare:map
```

Sau khi tạo lại, chạy `npm run test:map` để xác nhận kích thước, layer, tile ID và số cell.

## `ui/auth/`

Chỉ lấy lại các texture trang trí không chứa chữ để dựng đăng nhập/tạo nhân vật. Chữ tiếng Việt và input được hiển thị bằng HTML/CSS.
