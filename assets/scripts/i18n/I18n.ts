import { EditBox, Label, Node, RichText } from 'cc';

/**
 * Phông hệ thống hỗ trợ đầy đủ dấu tiếng Việt trên trình duyệt.
 * Arial có sẵn trên hầu hết hệ điều hành; trình duyệt sẽ tự dùng sans-serif tương thích khi cần.
 */
export const VIETNAMESE_FONT_FAMILY = 'Arial';

const viDictionary: Record<string, string> = {
    '账号密码有误': 'Tài khoản hoặc mật khẩu không hợp lệ.',
    '账号': 'Tài khoản',
    '密码': 'Mật khẩu',
    '登录': 'Đăng nhập',
    '注册': 'Đăng ký',
    '创建角色': 'Tạo nhân vật',
    '请输入昵称': 'Nhập tên nhân vật',
    '进入游戏': 'Vào game',
    '加载中': 'Đang tải...',
    '加载配置文件失败': 'Không thể tải dữ liệu cấu hình.',
    '连接服务器失败': 'Không thể kết nối máy chủ.',
    '网络异常': 'Kết nối mạng bất thường.',
    '请求超时': 'Yêu cầu đã hết thời gian chờ.',
    '重试': 'Thử lại',
    '提示': 'Thông báo',
    '确定': 'Xác nhận',
    '确认': 'Xác nhận',
    '取消': 'Huỷ',
    '关闭': 'Đóng',
    '返回': 'Quay lại',
    '请输入内容': 'Nhập nội dung',
    '发送': 'Gửi',
    '世界': 'Thế giới',
    '系统': 'Hệ thống',
    '聊天': 'Trò chuyện',
    '主城': 'Thành chính',
    '城池': 'Thành trì',
    '建筑': 'Công trình',
    '建造': 'Xây dựng',
    '升级': 'Nâng cấp',
    '拆除': 'Phá bỏ',
    '放弃': 'Từ bỏ',
    '武将': 'Võ tướng',
    '将领': 'Tướng',
    '部队': 'Đội quân',
    '军队': 'Quân đội',
    '士兵': 'Binh lực',
    '征兵': 'Chiêu mộ',
    '出征': 'Xuất chinh',
    '行军': 'Hành quân',
    '调动': 'Điều động',
    '驻守': 'Đồn trú',
    '扫荡': 'Càn quét',
    '攻击': 'Tấn công',
    '防守': 'Phòng thủ',
    '返回中': 'Đang trở về',
    '行军中': 'Đang hành quân',
    '征兵中': 'Đang chiêu mộ',
    '空闲': 'Nhàn rỗi',
    '木材': 'Gỗ',
    '铁矿': 'Sắt',
    '石料': 'Đá',
    '粮食': 'Lương thực',
    '金币': 'Vàng',
    '政令': 'Lệnh',
    '资源': 'Tài nguyên',
    '联盟': 'Liên minh',
    '创建联盟': 'Tạo liên minh',
    '加入联盟': 'Gia nhập liên minh',
    '退出联盟': 'Rời liên minh',
    '解散联盟': 'Giải tán liên minh',
    '联盟申请': 'Đơn xin gia nhập',
    '申请': 'Đăng ký',
    '同意': 'Đồng ý',
    '拒绝': 'Từ chối',
    '成员': 'Thành viên',
    '盟主': 'Minh chủ',
    '副盟主': 'Phó minh chủ',
    '公告': 'Thông báo',
    '任命': 'Bổ nhiệm',
    '禅让': 'Chuyển nhượng',
    '踢出': 'Khai trừ',
    '战报': 'Chiến báo',
    '胜利': 'Chiến thắng',
    '失败': 'Thất bại',
    '平局': 'Hoà',
    '未读': 'Chưa đọc',
    '已读': 'Đã đọc',
    '收藏': 'Đánh dấu',
    '坐标': 'Toạ độ',
    '耐久': 'Độ bền',
    '兵力': 'Binh lực',
    '体力': 'Thể lực',
    '等级': 'Cấp độ',
    '经验': 'Kinh nghiệm',
    '谋略': 'Mưu lược',
    '防御': 'Phòng thủ',
    '速度': 'Tốc độ',
    '破坏': 'Công thành',
    '距离': 'Tầm đánh',
    '技能': 'Kỹ năng',
    '学习': 'Học',
    '分解': 'Phân giải',
    '合成': 'Dung hợp',
    '觉醒': 'Thức tỉnh',
    '进阶': 'Tiến bậc',
    '名称': 'Tên',
    '详情': 'Chi tiết',
    '数量': 'Số lượng',
    '状态': 'Trạng thái',
    '时间': 'Thời gian',
    '今日': 'Hôm nay',
    '小时': 'giờ',
    '分钟': 'phút',
    '秒': 'giây',
};

const replacementEntries = Object.entries(viDictionary)
    .sort((left, right) => right[0].length - left[0].length);

export function translateText(value: string): string {
    if (!value) {
        return value;
    }

    const exact = viDictionary[value];
    if (exact) {
        return exact;
    }

    let translated = value;
    for (const [source, target] of replacementEntries) {
        if (translated.includes(source)) {
            translated = translated.split(source).join(target);
        }
    }
    return translated;
}

function applyVietnameseFont(label: Label): void {
    label.useSystemFont = true;
    label.fontFamily = VIETNAMESE_FONT_FAMILY;
}

/** Áp dụng bản dịch và phông tiếng Việt cho toàn bộ cây giao diện. */
export function localizeNode(root: Node): void {
    const labels = root.getComponentsInChildren(Label);
    for (const label of labels) {
        applyVietnameseFont(label);
        label.string = translateText(label.string);
    }

    const richTexts = root.getComponentsInChildren(RichText);
    for (const richText of richTexts) {
        richText.fontFamily = VIETNAMESE_FONT_FAMILY;
        richText.string = translateText(richText.string);
    }

    const editBoxes = root.getComponentsInChildren(EditBox);
    for (const editBox of editBoxes) {
        editBox.placeholder = translateText(editBox.placeholder);
        if (editBox.placeholderLabel) {
            applyVietnameseFont(editBox.placeholderLabel);
        }
        if (editBox.textLabel) {
            applyVietnameseFont(editBox.textLabel);
        }
    }
}
