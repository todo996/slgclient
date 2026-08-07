# Audit UI/UX và Việt hoá `slgclient`

Ngày audit: 2026-08-07  
Engine: Cocos Creator 3.4.0  
Nhánh cơ sở: `main` tại `818994c32902effc4e49e6d5b27ac363627a008e`

## 1. Phạm vi bất biến

Các hạng mục sau không được thay thế hoặc làm sai lệch trong quá trình nâng cấp:

- Ảnh và minh hoạ tướng hiện có.
- Bản đồ, tile map và dữ liệu địa hình hiện có.
- Công thức chiến đấu, tỉ lệ, chỉ số, tài nguyên và thời gian hồi.
- API contract, database, save data và dữ liệu người chơi.
- Luồng chức năng đã kết nối backend thật.

## 2. Kiến trúc hiện tại

- Client TypeScript chạy trên Cocos Creator 3.4.0.
- Scene gốc khởi tạo qua `assets/scripts/Main.ts`.
- UI được tổ chức bằng prefab/scene Cocos và controller theo từng miền nghiệp vụ.
- Các miền chính đã thấy trong source: đăng nhập, bản đồ, tướng/đội hình, kỹ năng, chat, liên minh, chiến báo, thành trì và tài nguyên.
- Kết nối HTTP và WebSocket được quản lý tập trung qua `HttpManager`, `NetManager` và `GameConfig`.
- Dự án đã có lớp Việt hoá runtime trong `assets/scripts/i18n`, nhưng phần lớn hoạt động bằng cách thay cụm từ trực tiếp sau khi node được tạo.
- Build production dùng Cocos Creator 3.4.0 trên GitHub Actions và phát hành sang nhánh `build-web`.

## 3. Phát hiện chính

### Mức P0 — chức năng và tính đúng

1. Không được dựng các màn hình quên mật khẩu/OTP/đổi mật khẩu như chức năng hoàn chỉnh khi backend chưa có API tương ứng.
2. Mọi nút dấu cộng, chiêu mộ, thu thuế, trao đổi, liên minh, chat, thư và nhiệm vụ chỉ được hiển thị ở trạng thái hoạt động khi đã có handler và luồng server thật.
3. Cần kiểm thử hồi quy toàn bộ packet WebSocket và HTTP sau mỗi nhóm thay đổi UI.

### Mức P1 — nền tảng giao diện

1. Chưa có design token dùng chung cho màu, typography, spacing, radius, shadow, trạng thái nút và animation.
2. Nhiều prefab dùng sprite/label cũ trực tiếp; việc sửa rời rạc sẽ gây lệch phong cách và khó bảo trì.
3. Cần một lớp theme runtime an toàn: chỉ áp dụng font, màu chữ, trạng thái tương tác và độ rõ; không được thay sprite tướng hoặc tile map.
4. Cần quy chuẩn safe area và kích thước chạm tối thiểu cho mobile landscape.

### Mức P1 — Việt hoá

1. Hệ thống hiện tại dùng từ điển chuỗi nguồn → chuỗi Việt và thay thế cụm từ runtime.
2. Cách này giúp xử lý prefab cũ nhanh nhưng chưa giải quyết triệt để chuỗi hard-code, chuỗi ghép động, text trong texture và lỗi tràn chữ.
3. Mục tiêu dài hạn là key-based localization; giai đoạn chuyển tiếp phải giữ tương thích với dữ liệu server và prefab cũ.
4. Text nằm trực tiếp trong texture phải được thay bằng asset hợp lệ hoặc che vùng chữ cũ và dùng Label; không được thay ảnh tướng/map.

### Mức P1 — kiểm thử và CI

1. `package.json` ban đầu chỉ có kiểm tra PWA và build Vercel, chưa có typecheck/lint/unit test riêng.
2. Workflow build ban đầu chỉ chạy khi push `main`; nhánh PR chưa có build xác nhận độc lập.
3. Cần thêm audit tự động để thống kê CJK, debug marker, mock/placeholder và file có nguy cơ còn text cũ.
4. Build PR phải tuyệt đối không ghi đè nhánh deployment `build-web`.

### Mức P2 — production hygiene

1. Source còn các `console.log`; cần giữ log cần thiết ở development và loại/giảm log trong production.
2. Cấu hình build đã dùng `debug=false`, nhưng cần kiểm tra thực tế để bảo đảm không còn FPS/stats overlay.
3. Cần trạng thái chung cho loading, mất kết nối, lỗi, empty state và xác nhận nguy hiểm.

## 4. Ma trận màn hình cần rà soát

| Nhóm | Màn hình/luồng | Trạng thái audit |
|---|---|---|
| Tài khoản | Đăng nhập, đăng ký | Có luồng hiện hữu; cần thay prefab/theme và kiểm thử server thật |
| Tài khoản | Quên mật khẩu, OTP, đặt lại mật khẩu | Chưa được coi là hoàn tất cho tới khi xác nhận API backend |
| Gameplay | Bản đồ chính, chọn ô, thành trì, đội quân | Giữ map/logic; thay HUD, menu, popup |
| Tướng | Kho tướng, chi tiết, đội hình, nâng cấp | Giữ ảnh/chỉ số; chuẩn hoá card/tab/button |
| Kỹ năng | Danh sách, chi tiết, nâng cấp | Chuẩn hoá panel và trạng thái thiếu tài nguyên |
| Chiêu mộ | Banner, thao tác, kết quả | Không sinh kết quả phía client; dùng phản hồi server |
| Chiến báo | Danh sách, chi tiết | Không tạo dữ liệu mẫu; xử lý empty/error |
| Liên minh | Danh sách, tạo, gia nhập, thành viên | Chỉ bật hành động có API/handler thật |
| Kinh tế | Thu thuế, chợ, tài nguyên | Không tự cộng/trừ tài nguyên phía client |
| Xã hội | Chat thế giới/liên minh/riêng, thư | Không tạo tin nhắn mẫu; kiểm tra timeout và retry |
| Hệ thống | Nhiệm vụ, phần thưởng, cài đặt, đăng xuất | Chuẩn hoá modal/toast/confirm |

## 5. Kế hoạch triển khai

1. **Audit có thể lặp lại**: script quét source và sinh `artifacts/ui-audit.json`.
2. **Design system**: token, typography và bộ áp theme an toàn cho prefab hiện hữu.
3. **Localization**: chuẩn hoá API dịch, thêm key mới, thống kê chuỗi CJK còn lại.
4. **Tài khoản**: đăng nhập/đăng ký trước; chỉ triển khai quên mật khẩu khi backend xác nhận.
5. **Gameplay chính**: HUD bản đồ, kho tướng, đội hình, kỹ năng, chiêu mộ, chiến báo.
6. **Xã hội/kinh tế**: liên minh, chợ, chat, thư, nhiệm vụ, thu thuế.
7. **Hoàn thiện**: responsive, safe area, loading/error/empty, giảm log production.
8. **Nghiệm thu**: build Cocos production, kiểm tra smoke test và các luồng backend thật.

## 6. Quy tắc nghiệm thu theo commit

- Mỗi commit chỉ chứa một nhóm thay đổi logic rõ ràng.
- Không commit build artifact vào nhánh source.
- Không merge khi workflow PR chưa xanh.
- Mọi chức năng chưa có backend phải được ẩn/vô hiệu hoá kèm TODO kỹ thuật, không mô phỏng thành công.
- Báo cáo cuối phải phân biệt rõ: đã hoàn thành, đã kiểm thử, chưa có backend và chưa thể xác nhận.
