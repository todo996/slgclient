const familyNames = [
  'Lưu', 'Quan', 'Trương', 'Triệu', 'Mã', 'Hoàng', 'Tào', 'Hạ Hầu',
  'Tôn', 'Chu', 'Lữ', 'Đổng', 'Viên', 'Gia Cát', 'Tư Mã', 'Cam',
  'Lục', 'Thái Sử', 'Điển', 'Hứa', 'Quách', 'Tuân', 'Trình', 'Bàng',
  'Khương', 'Ngụy', 'Đặng', 'Chung', 'Văn', 'Võ', 'Phan', 'Đỗ'
];

const maleGivenNames = [
  'Vân', 'Phi', 'Vũ', 'Bị', 'Tháo', 'Quyền', 'Du', 'Lượng', 'Siêu', 'Trung',
  'Uyên', 'Liêu', 'Hợp', 'Hủ', 'Gia', 'Úc', 'Nhân', 'Hạ', 'Ninh', 'Mông',
  'Tốn', 'Sách', 'Thống', 'Duy', 'Ngải', 'Hội', 'Tu', 'Bình', 'Thịnh', 'Kiên',
  'Minh', 'Phong', 'Long', 'Hùng', 'Kiệt', 'Quân', 'Tín', 'Nghĩa', 'Dũng', 'Thành'
];

const femaleGivenNames = [
  'Thiền', 'Kiều', 'Anh', 'Nguyệt', 'Lan', 'Hoa', 'Vân', 'Hương', 'Tuyết', 'Mai',
  'Linh', 'Châu', 'Ngọc', 'Thanh', 'Thư', 'Uyên', 'Diễm', 'Phượng', 'Nhi', 'Hà',
  'Như', 'Yến', 'Trúc', 'Quỳnh', 'Thảo', 'Dung', 'Oanh', 'Trang', 'Hiền', 'Tâm'
];

function randomItem<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

/** Tạo tên nhân vật có dấu tiếng Việt, phù hợp bối cảnh Tam Quốc. */
export function createName(sex: string): string {
  const givenNames = sex === 'girl' ? femaleGivenNames : maleGivenNames;
  return `${randomItem(familyNames)} ${randomItem(givenNames)}`;
}
