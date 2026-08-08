import {
    AudioClip,
    AudioSource,
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
    assert,
    clamp01,
    resources,
    warn,
} from 'cc';
import { LocalCache } from '../utils/LocalCache';

export class AudioManager {
    private static _instance: AudioManager;
    private static _audioSource?: AudioSource;

    static get instance() {
        if (this._instance) {
            return this._instance;
        }
        this._instance = new AudioManager();
        return this._instance;
    }

    soundVolume: number = 1;

    init(audioSource: AudioSource) {
        this.soundVolume = this.getConfiguration(false) ? 1 : 0;
        AudioManager._audioSource = audioSource;
        if (this.getConfiguration(true)) {
            this.openMusic();
        } else {
            this.closeMusic();
        }
    }

    getConfiguration(isMusic: boolean) {
        let state;
        if (isMusic) {
            state = LocalCache.getMusic();
        } else {
            state = LocalCache.getSound();
        }
        return state === undefined || state ? true : false;
    }

    playMusic(loop: boolean) {
        const audioSource = AudioManager._audioSource!;
        assert(audioSource, 'AudioManager not inited!');
        audioSource.loop = loop;
        if (!audioSource.playing) {
            audioSource.play();
        }
    }

    playSound(name: string) {
        const audioSource = AudioManager._audioSource!;
        assert(audioSource, 'AudioManager not inited!');
        const path = '/audio/sound/';
        resources.load(path + name, AudioClip, (err, clip) => {
            if (err) {
                warn('load audioClip failed: ', err);
                return;
            }
            audioSource.playOneShot(clip, this.soundVolume);
        });
    }

    playClick() {
        this.playSound('click');
    }

    setMusicVolume(flag: number) {
        console.log('setMusicVolume:', flag);
        const audioSource = AudioManager._audioSource!;
        assert(audioSource, 'AudioManager not inited!');
        flag = clamp01(flag);
        audioSource.volume = flag;
    }

    setSoundVolume(flag: number) {
        this.soundVolume = flag;
    }

    openMusic() {
        this.setMusicVolume(0.2);
        this.playMusic(true);
        LocalCache.setMusic(true);
    }

    closeMusic() {
        AudioManager._audioSource.stop();
        LocalCache.setMusic(false);
    }

    openSound() {
        this.setSoundVolume(1);
        LocalCache.setSound(true);
    }

    closeSound() {
        this.setSoundVolume(0);
        LocalCache.setSound(false);
    }
}

/**
 * Bộ primitive UI nằm trong module lõi đã tồn tại từ đầu dự án.
 * Cocos Creator 3.4.0 trên Windows có lỗi resolver với một số module UI mới;
 * đặt các helper thuần trình bày tại đây giúp không tạo thêm dependency graph mới.
 */
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

const UI_TRANSLATIONS: Record<string, string> = {
    '关闭': 'Đóng',
    '返回': 'Quay lại',
    '确定': 'Xác nhận',
    '取消': 'Hủy',
    '将领': 'Tướng',
    '武将': 'Tướng',
    '征兵': 'Chiêu mộ',
    '战报': 'Chiến báo',
    '联盟': 'Liên minh',
    '市场': 'Chợ',
    '税收': 'Thu thuế',
    '聊天': 'Trò chuyện',
    '技能': 'Kỹ năng',
    '设置': 'Cài đặt',
    '世界': 'Thế giới',
    '申请': 'Đăng ký',
    '成员': 'Thành viên',
    '日志': 'Nhật ký',
    '创建': 'Tạo',
    '加入联盟': 'Gia nhập liên minh',
    '退出联盟': 'Rời liên minh',
    '解散联盟': 'Giải tán liên minh',
    '木材': 'Gỗ',
    '铁矿': 'Sắt',
    '石料': 'Đá',
    '粮食': 'Lương thực',
    '政令': 'Lệnh',
    '资源': 'Tài nguyên',
    '胜利': 'Chiến thắng',
    '失败': 'Thất bại',
    '未读': 'Chưa đọc',
    '已读': 'Đã đọc',
    '坐标': 'Toạ độ',
    '经验': 'Kinh nghiệm',
    '数量': 'Số lượng',
    '状态': 'Trạng thái',
    '时间': 'Thời gian',
    '请输入内容': 'Nhập nội dung',
};

const UI_TRANSLATION_ENTRIES = Object.entries(UI_TRANSLATIONS)
    .sort((left, right) => right[0].length - left[0].length);

export function translateUiText(value: string): string {
    if (!value) {
        return value;
    }
    const exact = UI_TRANSLATIONS[value];
    if (exact !== undefined) {
        return exact;
    }
    let translated = value;
    for (const [source, target] of UI_TRANSLATION_ENTRIES) {
        if (source.length >= 2 && translated.includes(source)) {
            translated = translated.split(source).join(target);
        }
    }
    return translated;
}

export function localizeNode(root: Node): void {
    for (const label of root.getComponentsInChildren(Label)) {
        label.useSystemFont = true;
        label.fontFamily = 'Arial';
        label.string = translateUiText(label.string);
    }
    for (const richText of root.getComponentsInChildren(RichText)) {
        richText.fontFamily = 'Arial';
        richText.string = translateUiText(richText.string);
    }
    for (const editBox of root.getComponentsInChildren(EditBox)) {
        editBox.placeholder = translateUiText(editBox.placeholder);
        if (editBox.placeholderLabel) {
            editBox.placeholderLabel.useSystemFont = true;
            editBox.placeholderLabel.fontFamily = 'Arial';
        }
        if (editBox.textLabel) {
            editBox.textLabel.useSystemFont = true;
            editBox.textLabel.fontFamily = 'Arial';
        }
    }
}

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
    label.fontFamily = titleFont ? 'Times New Roman' : 'Arial';
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
        editBox.placeholderLabel.useSystemFont = true;
        editBox.placeholderLabel.fontFamily = 'Arial';
        editBox.placeholderLabel.fontSize = 18;
        editBox.placeholderLabel.lineHeight = 24;
        editBox.placeholderLabel.color = new Color(151, 139, 120, 255);
        editBox.placeholderLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
        editBox.placeholderLabel.verticalAlign = VerticalTextAlignment.CENTER;
    }
    if (editBox.textLabel) {
        editBox.textLabel.useSystemFont = true;
        editBox.textLabel.fontFamily = 'Arial';
        editBox.textLabel.fontSize = 19;
        editBox.textLabel.lineHeight = 25;
        editBox.textLabel.color = ANCIENT_UI.text;
        editBox.textLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
        editBox.textLabel.verticalAlign = VerticalTextAlignment.CENTER;
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
            label.useSystemFont = true;
            label.fontFamily = 'Arial';
            label.color = ANCIENT_UI.text;
        }
    }
    addAncientScreenTitle(root, title);
}
