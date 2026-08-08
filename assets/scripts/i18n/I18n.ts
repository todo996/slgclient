import {
    Button,
    Color,
    EditBox,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    RichText,
    Sprite,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
import { gameTermTranslations } from './GameTerms';
import { generalNameTranslations } from './GeneralNames';
import { runtimeTermTranslations } from './RuntimeTerms';

/**
 * Phông hệ thống hỗ trợ đầy đủ dấu tiếng Việt trên trình duyệt.
 * Arial có sẵn trên hầu hết hệ điều hành; trình duyệt sẽ tự dùng sans-serif tương thích khi cần.
 */
export const VIETNAMESE_FONT_FAMILY = 'Arial';
export const VIETNAMESE_TITLE_FONT_FAMILY = 'Times New Roman';

export const ANCIENT_UI = {
    gold: new Color(231, 190, 109, 255),
    goldSoft: new Color(196, 168, 115, 235),
    text: new Color(239, 225, 198, 255),
    muted: new Color(177, 163, 139, 255),
    panel: new Color(17, 14, 12, 242),
    panelSoft: new Color(31, 25, 20, 236),
    border: new Color(152, 107, 54, 235),
    borderSoft: new Color(112, 79, 43, 180),
    jade: new Color(38, 76, 63, 255),
    red: new Color(117, 47, 39, 255),
    success: new Color(111, 183, 97, 255),
};

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
};

// Chỉ thay theo cụm từ từ hai ký tự trở lên để tránh làm hỏng tên riêng
// hoặc câu chưa có trong từ điển bởi các mục đơn ký tự như 主, 吴, 魏.
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

/**
 * Việt hoá dữ liệu JSON đã được Cocos nạp. Hàm thay đổi object tại chỗ để
 * các proxy và model hiện tại tiếp tục sử dụng cùng tham chiếu dữ liệu.
 */
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

/** Các hàm dưới đây chỉ thay lớp trình bày, không tạo packet hay sửa handler gameplay. */
export function ensureUiTransform(node: Node, width: number, height: number): UITransform {
    const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return transform;
}

export function ensureUiChild(parent: Node, name: string): Node {
    let node = parent.getChildByName(name);
    if (!node) {
        node = new Node(name);
        node.setParent(parent);
    }
    return node;
}

export function hideDirectUiSprites(node: Node): void {
    for (const sprite of node.getComponents(Sprite)) {
        sprite.enabled = false;
    }
}

export function suppressLegacyChrome(root: Node, maxDepth: number = 2): void {
    const visit = (node: Node, depth: number): void => {
        if (depth > maxDepth) {
            return;
        }
        const name = node.name.toLowerCase();
        const isProtectedArt = /(icon|pic|head|avatar|portrait|general|skill|map|army|star)/.test(name);
        const isChrome = /(^bg$|background|diban|panel|frame|kuang|border|base|bottom|top|di$)/.test(name);
        if (isChrome && !isProtectedArt) {
            hideDirectUiSprites(node);
        }
        for (const child of node.children) {
            visit(child, depth + 1);
        }
    };
    visit(root, 0);
}

export function drawAncientPanel(
    node: Node,
    width: number,
    height: number,
    radius: number = 12,
    fill: Color = ANCIENT_UI.panel,
): void {
    ensureUiTransform(node, width, height);
    const skin = ensureUiChild(node, '__AncientPanelSkin');
    skin.setPosition(0, 0, 0);
    skin.setSiblingIndex(0);
    ensureUiTransform(skin, width, height);
    const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
    graphics.clear();

    graphics.fillColor = new Color(0, 0, 0, 105);
    graphics.roundRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, radius + 2);
    graphics.fill();

    graphics.fillColor = fill;
    graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    graphics.fill();

    graphics.strokeColor = new Color(72, 48, 28, 255);
    graphics.lineWidth = 4;
    graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    graphics.stroke();

    graphics.strokeColor = ANCIENT_UI.border;
    graphics.lineWidth = 1.6;
    graphics.roundRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, Math.max(4, radius - 4));
    graphics.stroke();

    const c = 22;
    graphics.strokeColor = ANCIENT_UI.gold;
    graphics.lineWidth = 1.5;
    graphics.moveTo(-width / 2 + 8, height / 2 - c);
    graphics.lineTo(-width / 2 + 8, height / 2 - 8);
    graphics.lineTo(-width / 2 + c, height / 2 - 8);
    graphics.moveTo(width / 2 - c, height / 2 - 8);
    graphics.lineTo(width / 2 - 8, height / 2 - 8);
    graphics.lineTo(width / 2 - 8, height / 2 - c);
    graphics.moveTo(-width / 2 + 8, -height / 2 + c);
    graphics.lineTo(-width / 2 + 8, -height / 2 + 8);
    graphics.lineTo(-width / 2 + c, -height / 2 + 8);
    graphics.moveTo(width / 2 - c, -height / 2 + 8);
    graphics.lineTo(width / 2 - 8, -height / 2 + 8);
    graphics.lineTo(width / 2 - 8, -height / 2 + c);
    graphics.stroke();
}

export function createUiText(
    parent: Node,
    name: string,
    text: string,
    fontSize: number,
    color: Color,
    width: number,
    height: number,
    titleFont: boolean = false,
): Label {
    const node = ensureUiChild(parent, name);
    ensureUiTransform(node, width, height);
    const label = node.getComponent(Label) || node.addComponent(Label);
    label.useSystemFont = true;
    label.fontFamily = titleFont ? VIETNAMESE_TITLE_FONT_FAMILY : VIETNAMESE_FONT_FAMILY;
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = Math.ceil(fontSize * 1.25);
    label.enableWrapText = false;
    label.overflow = Label.Overflow.SHRINK;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.color = color;
    return label;
}

export function getButtonHandler(button: Button): string {
    for (const event of (button.clickEvents as any[]) || []) {
        if (event && typeof event.handler === 'string' && event.handler) {
            return event.handler;
        }
    }
    return '';
}

export function findButtonByHandler(root: Node, handler: string): Button | null {
    return root.getComponentsInChildren(Button)
        .find((button) => getButtonHandler(button) === handler) || null;
}

export function styleAncientButton(
    buttonNode: Node,
    text: string,
    variant: 'gold' | 'dark' | 'jade' | 'red' = 'dark',
    width: number = 180,
    height: number = 50,
): Button {
    ensureUiTransform(buttonNode, width, height);
    hideDirectUiSprites(buttonNode);
    const background = buttonNode.getChildByName('Background');
    if (background) {
        hideDirectUiSprites(background);
    }

    const skin = ensureUiChild(buttonNode, '__AncientButtonSkin');
    skin.setPosition(0, 0, 0);
    skin.setSiblingIndex(0);
    ensureUiTransform(skin, width, height);
    const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
    graphics.clear();

    let fill = ANCIENT_UI.panelSoft;
    if (variant === 'gold') {
        fill = new Color(120, 78, 28, 255);
    } else if (variant === 'jade') {
        fill = ANCIENT_UI.jade;
    } else if (variant === 'red') {
        fill = ANCIENT_UI.red;
    }
    graphics.fillColor = fill;
    graphics.roundRect(-width / 2, -height / 2, width, height, 7);
    graphics.fill();
    graphics.strokeColor = variant === 'gold' ? ANCIENT_UI.gold : ANCIENT_UI.border;
    graphics.lineWidth = 2;
    graphics.roundRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 6);
    graphics.stroke();
    graphics.strokeColor = new Color(244, 215, 155, variant === 'gold' ? 140 : 70);
    graphics.lineWidth = 1;
    graphics.roundRect(-width / 2 + 7, -height / 2 + 7, width - 14, height - 14, 4);
    graphics.stroke();

    for (const label of buttonNode.getComponentsInChildren(Label)) {
        if (label.node.name !== '__AncientButtonLabel') {
            label.node.active = false;
        }
    }
    const label = createUiText(
        buttonNode,
        '__AncientButtonLabel',
        text,
        variant === 'gold' ? 21 : 18,
        variant === 'gold' ? new Color(255, 239, 194, 255) : ANCIENT_UI.text,
        width - 20,
        height - 8,
        true,
    );
    label.node.active = true;
    label.node.setPosition(0, 0, 0);
    label.node.setSiblingIndex(buttonNode.children.length - 1);

    const button = buttonNode.getComponent(Button) || buttonNode.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.97;
    button.duration = 0.08;
    return button;
}

export function styleAncientEditBox(
    editBox: EditBox,
    placeholder: string,
    width: number,
    height: number,
): void {
    const node = editBox.node;
    ensureUiTransform(node, width, height);
    hideDirectUiSprites(node);
    const background = node.getChildByName('Background');
    if (background) {
        hideDirectUiSprites(background);
    }

    const skin = ensureUiChild(node, '__AncientInputSkin');
    skin.setPosition(0, 0, 0);
    skin.setSiblingIndex(0);
    ensureUiTransform(skin, width, height);
    const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(18, 16, 14, 238);
    graphics.roundRect(-width / 2, -height / 2, width, height, 7);
    graphics.fill();
    graphics.strokeColor = new Color(127, 105, 77, 220);
    graphics.lineWidth = 1.4;
    graphics.roundRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 7);
    graphics.stroke();

    editBox.placeholder = placeholder;
    if (editBox.placeholderLabel) {
        const label = editBox.placeholderLabel;
        applyVietnameseFont(label);
        label.fontSize = 18;
        label.lineHeight = 24;
        label.color = new Color(151, 139, 120, 255);
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
    }
    if (editBox.textLabel) {
        const label = editBox.textLabel;
        applyVietnameseFont(label);
        label.fontSize = 19;
        label.lineHeight = 25;
        label.color = ANCIENT_UI.text;
        label.horizontalAlign = HorizontalTextAlignment.LEFT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
    }
}

export function addAncientScreenTitle(root: Node, title: string): void {
    const header = ensureUiChild(root, '__AncientScreenHeader');
    header.setPosition(0, 320, 0);
    header.setSiblingIndex(root.children.length - 1);
    ensureUiTransform(header, 1120, 70);

    const graphics = header.getComponent(Graphics) || header.addComponent(Graphics);
    graphics.clear();
    graphics.strokeColor = ANCIENT_UI.border;
    graphics.lineWidth = 1.5;
    graphics.moveTo(-500, -24);
    graphics.lineTo(-150, -24);
    graphics.moveTo(150, -24);
    graphics.lineTo(500, -24);
    graphics.stroke();

    const label = createUiText(header, '__AncientScreenTitle', title, 39, ANCIENT_UI.gold, 360, 58, true);
    label.node.setPosition(0, -2, 0);
    label.node.setSiblingIndex(header.children.length - 1);
}

export function applyAncientScreenChrome(root: Node, title: string): void {
    localizeNode(root);
    suppressLegacyChrome(root, 2);

    const backdrop = ensureUiChild(root, '__AncientScreenBackdrop');
    backdrop.setPosition(0, 0, 0);
    backdrop.setSiblingIndex(0);
    ensureUiTransform(backdrop, 1280, 720);
    const graphics = backdrop.getComponent(Graphics) || backdrop.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = new Color(12, 10, 9, 205);
    graphics.rect(-640, -360, 1280, 720);
    graphics.fill();
    graphics.strokeColor = new Color(90, 61, 32, 210);
    graphics.lineWidth = 2;
    graphics.moveTo(-620, 299);
    graphics.lineTo(620, 299);
    graphics.moveTo(-620, -309);
    graphics.lineTo(620, -309);
    graphics.stroke();

    for (const label of root.getComponentsInChildren(Label)) {
        if (!label.node.name.startsWith('__Ancient')) {
            applyVietnameseFont(label);
            label.color = ANCIENT_UI.text;
        }
    }
    addAncientScreenTitle(root, title);
}
