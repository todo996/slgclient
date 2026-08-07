import { EditBox, Label, Node, RichText } from 'cc';
import { gameTermTranslations } from './GameTerms';
import { generalNameTranslations } from './GeneralNames';
import { runtimeTermTranslations } from './RuntimeTerms';
import { applyGameTheme } from '../ui/theme/applyGameTheme';

/** Phông hệ thống hỗ trợ đầy đủ dấu tiếng Việt trên trình duyệt. */
export const VIETNAMESE_FONT_FAMILY = 'Arial';

const viDictionary: Record<string, string> = {
    ...gameTermTranslations,
    ...generalNameTranslations,
    ...runtimeTermTranslations,
    '账号密码有误': 'Tài khoản hoặc mật khẩu không hợp lệ.',
    '请输入昵称': 'Nhập tên nhân vật',
    '加载中': 'Đang tải...',
    '加载配置文件失败': 'Không thể tải dữ liệu cấu hình.',
    '连接服务器失败': 'Không thể kết nối máy chủ.',
    '网络异常': 'Kết nối mạng bất thường.',
    '请求超时': 'Yêu cầu đã hết thời gian chờ.',
    '重试': 'Thử lại',
    '关闭': 'Đóng',
    '请输入内容': 'Nhập nội dung',
    '系统': 'Hệ thống',
    '城池': 'Thành trì',
    '建造': 'Xây dựng',
    '将领': 'Tướng',
    '军队': 'Quân đội',
    '士兵': 'Binh lực',
    '征兵': 'Chiêu mộ',
    '出征': 'Xuất chinh',
    '行军': 'Hành quân',
    '驻守': 'Đồn trú',
    '扫荡': 'Càn quét',
    '防守': 'Phòng thủ',
    '返回中': 'Đang trở về',
    '行军中': 'Đang hành quân',
    '征兵中': 'Đang chiêu mộ',
    '空闲': 'Nhàn rỗi',
    '木材': 'Gỗ',
    '铁矿': 'Sắt',
    '石料': 'Đá',
    '粮食': 'Lương thực',
    '政令': 'Lệnh',
    '资源': 'Tài nguyên',
    '加入联盟': 'Gia nhập liên minh',
    '退出联盟': 'Rời liên minh',
    '解散联盟': 'Giải tán liên minh',
    '联盟申请': 'Đơn xin gia nhập',
    '申请': 'Đăng ký',
    '盟主': 'Minh chủ',
    '副盟主': 'Phó minh chủ',
    '胜利': 'Chiến thắng',
    '失败': 'Thất bại',
    '平局': 'Hoà',
    '未读': 'Chưa đọc',
    '已读': 'Đã đọc',
    '收藏': 'Đánh dấu',
    '坐标': 'Toạ độ',
    '耐久': 'Độ bền',
    '经验': 'Kinh nghiệm',
    '破坏': 'Công thành',
    '距离': 'Tầm đánh',
    '分解': 'Phân giải',
    '觉醒': 'Thức tỉnh',
    '进阶': 'Tiến bậc',
    '数量': 'Số lượng',
    '状态': 'Trạng thái',
    '时间': 'Thời gian',
    '今日': 'Hôm nay',
    '分钟': 'phút',
    '秒': 'giây',
    '登录': 'Đăng nhập',
    '注册': 'Đăng ký',
    '忘记密码': 'Quên mật khẩu',
    '武将': 'Tướng',
    '抽卡': 'Chiêu mộ',
    '战报': 'Chiến báo',
    '联盟': 'Liên minh',
    '征收': 'Thu thuế',
    '市场': 'Chợ',
    '聊天': 'Trò chuyện',
    '技能': 'Kỹ năng',
    '设置': 'Cài đặt',
    '返回': 'Quay lại',
    '确认': 'Xác nhận',
    '取消': 'Hủy',
    '发送': 'Gửi',
    '创建': 'Tạo mới',
    '加入': 'Gia nhập',
    '详情': 'Chi tiết',
    '升级': 'Nâng cấp',
    '排序': 'Sắp xếp',
    '筛选': 'Lọc',
    '全部': 'Tất cả',
    '世界': 'Thế giới',
    '邮件': 'Thư',
    '任务': 'Nhiệm vụ',
};

const phraseReplacementEntries = Object.entries(viDictionary)
    .filter(([source]) => source.length >= 2)
    .sort((left, right) => right[0].length - left[0].length);

export function translateText(value: string): string {
    if (!value) {
        return value;
    }

    const exact = viDictionary[value];
    if (exact !== undefined) {
        return exact;
    }

    let translated = value;
    for (const [source, target] of phraseReplacementEntries) {
        if (translated.includes(source)) {
            translated = translated.split(source).join(target);
        }
    }
    return translated;
}

export function localizeData<T>(value: T): T {
    if (typeof value === 'string') {
        return translateText(value) as unknown as T;
    }

    if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index += 1) {
            value[index] = localizeData(value[index]);
        }
        return value;
    }

    if (value && typeof value === 'object') {
        const record = value as unknown as Record<string, unknown>;
        for (const key of Object.keys(record)) {
            record[key] = localizeData(record[key]);
        }
    }

    return value;
}

function applyVietnameseFont(label: Label): void {
    label.useSystemFont = true;
    label.fontFamily = VIETNAMESE_FONT_FAMILY;
}

/** Áp dụng bản dịch, phông tiếng Việt và design system cho toàn bộ cây UI. */
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

    applyGameTheme(root);
}
