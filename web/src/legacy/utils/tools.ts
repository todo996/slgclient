import { LocalCache } from "./local-cache";

export class Tools {
  static getUUID(): string {
    const cached = LocalCache.getUuid();
    if (cached) return cached;

    const characters =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const uuid: string[] = [];

    for (let index = 0; index < 36; index += 1) {
      uuid[index] = characters[
        Math.floor(Math.random() * characters.length)
      ];
    }

    uuid[8] = "-";
    uuid[13] = "-";
    uuid[18] = "-";
    uuid[23] = "-";

    const value = uuid.join("");
    LocalCache.setUuid(value);
    return value;
  }

  static getCodeStr(code = 0): string {
    const messages: Record<number, string> = {
      [-4]: "Không thể kết nối dịch vụ trung gian.",
      [-3]: "Dịch vụ trung gian gặp lỗi.",
      [-2]: "Không tìm thấy tài khoản trong kết nối.",
      [-1]: "Không tìm thấy nhân vật trong kết nối.",
      [0]: "Thành công.",
      [1]: "Thông tin gửi lên không hợp lệ.",
      [2]: "Cơ sở dữ liệu gặp sự cố.",
      [3]: "Tài khoản đã tồn tại.",
      [4]: "Mật khẩu không chính xác.",
      [5]: "Tài khoản không tồn tại.",
      [6]: "Phiên đăng nhập không hợp lệ.",
      [7]: "Thiết bị đăng nhập không hợp lệ.",
      [8]: "Tài khoản đã tạo nhân vật.",
      [9]: "Nhân vật chưa tồn tại.",
      [10]: "Thành trì không tồn tại.",
      [11]: "Bạn không sở hữu thành trì này.",
      [12]: "Nâng cấp thất bại.",
      [13]: "Võ tướng không tồn tại.",
      [14]: "Bạn không sở hữu võ tướng này.",
      [15]: "Bạn không sở hữu đội quân này.",
      [16]: "Không đủ tài nguyên.",
      [17]: "Vượt quá giới hạn binh lực.",
      [18]: "Đội quân đang thực hiện nhiệm vụ khác.",
      [19]: "Võ tướng đang thực hiện nhiệm vụ khác.",
      [20]: "Không thể từ bỏ mục tiêu này.",
      [21]: "Bạn không sở hữu lãnh địa này.",
      [22]: "Đội quân chưa có chủ tướng.",
      [23]: "Không thể di chuyển đến vị trí này.",
      [24]: "Không đủ thể lực.",
      [25]: "Không đủ lệnh.",
      [26]: "Không đủ vàng.",
      [27]: "Võ tướng đã được xếp vào đội hình.",
      [28]: "Không đủ điểm thống lĩnh.",
      [29]: "Không có võ tướng dùng để dung hợp.",
      [30]: "Các võ tướng dung hợp không cùng tên.",
      [31]: "Không đủ giới hạn thống lĩnh.",
      [32]: "Nâng cấp thất bại.",
      [33]: "Võ tướng đã đạt số sao tối đa.",
      [34]: "Không thể tạo liên minh.",
      [35]: "Liên minh không tồn tại.",
      [36]: "Bạn không có quyền thực hiện thao tác này.",
      [37]: "Bạn đã tham gia một liên minh.",
      [38]: "Hiện chưa thể rời liên minh.",
      [39]: "Nội dung vượt quá độ dài cho phép.",
      [40]: "Người chơi không thuộc liên minh này.",
      [41]: "Liên minh đã đủ thành viên.",
      [42]: "Bạn đã gửi đơn xin gia nhập.",
      [43]: "Không thể đồn trú tại vị trí này.",
      [44]: "Không thể chiếm lĩnh vị trí này.",
      [45]: "Thành trì chưa có công trình chiêu mộ.",
      [46]: "Mục tiêu đang trong thời gian miễn chiến.",
      [47]: "Đội quân đang chiêu mộ binh lính.",
      [48]: "Lãnh địa đang trong quá trình từ bỏ.",
      [49]: "Không thể xây thêm công trình trên lãnh địa này.",
      [50]: "Không thể điều động đội quân.",
      [51]: "Tất cả vị trí đội hình đã được sử dụng.",
      [52]: "Đội quân đang ở ngoài thành.",
      [53]: "Không thể nâng cấp công trình.",
      [54]: "Không thể phá bỏ công trình.",
      [55]: "Đã dùng hết lượt thu thuế.",
      [56]: "Thao tác đang trong thời gian chờ.",
      [57]: "Số lượng võ tướng đã đạt giới hạn.",
      [58]: "Thành trì chưa có chợ.",
      [59]: "Số vị trí đánh dấu đã đạt giới hạn.",
      [60]: "Số kỹ năng đã đạt giới hạn.",
      [61]: "Trang bị kỹ năng thất bại.",
      [62]: "Gỡ kỹ năng thất bại.",
      [63]: "Binh chủng không phù hợp.",
      [64]: "Vị trí này chưa được trang bị kỹ năng.",
      [65]: "Kỹ năng đã đạt cấp tối đa.",
      [66]: "Tên nhân vật đã được sử dụng.",
    };

    return messages[code] ?? `Lỗi không xác định (${code}).`;
  }
}
