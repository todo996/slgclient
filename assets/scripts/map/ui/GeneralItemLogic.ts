import { _decorator, Color, Component, Label, Layout, Node, Sprite, Button, EditBox, Graphics, HorizontalTextAlignment, UITransform, VerticalTextAlignment } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import GeneralCommand from '../../general/GeneralCommand';
import { GeneralCampType, GeneralData } from '../../general/GeneralProxy';
import {
    ANCIENT_UI } from '../../common/AudioManager';
import { EventMgr } from '../../utils/EventMgr';
import GeneralHeadLogic from './GeneralHeadLogic';

// UI presentation helpers are intentionally local to this existing controller.
// Cocos Creator 3.4.0 on Windows can mis-resolve newly introduced shared TS modules
// as file:\D:\... paths. Keeping presentation local avoids that resolver defect while
// leaving Command/Proxy/network/gameplay code untouched.
const ANCIENT_UI = {
    gold: new Color(231, 190, 109, 255),
    goldSoft: new Color(196, 168, 115, 235),
    text: new Color(239, 225, 198, 255),
    muted: new Color(177, 163, 139, 255),
    panel: new Color(17, 14, 12, 242),
    panelSoft: new Color(31, 25, 20, 236),
    border: new Color(152, 107, 54, 235),
    jade: new Color(38, 76, 63, 255),
    red: new Color(117, 47, 39, 255),
    success: new Color(111, 183, 97, 255),
};

const LOCAL_UI_TRANSLATIONS: Record<string, string> = {
    '关闭': 'Đóng', '返回': 'Quay lại', '确定': 'Xác nhận', '取消': 'Hủy',
    '将领': 'Tướng', '武将': 'Tướng', '征兵': 'Chiêu mộ', '战报': 'Chiến báo',
    '联盟': 'Liên minh', '市场': 'Chợ', '税收': 'Thu thuế', '聊天': 'Trò chuyện',
    '技能': 'Kỹ năng', '设置': 'Cài đặt', '世界': 'Thế giới', '申请': 'Đăng ký',
    '成员': 'Thành viên', '日志': 'Nhật ký', '创建': 'Tạo',
    '加入联盟': 'Gia nhập liên minh', '退出联盟': 'Rời liên minh', '解散联盟': 'Giải tán liên minh',
    '木材': 'Gỗ', '铁矿': 'Sắt', '石料': 'Đá', '粮食': 'Lương thực', '政令': 'Lệnh',
    '资源': 'Tài nguyên', '胜利': 'Chiến thắng', '失败': 'Thất bại',
    '未读': 'Chưa đọc', '已读': 'Đã đọc', '坐标': 'Toạ độ', '经验': 'Kinh nghiệm',
    '数量': 'Số lượng', '状态': 'Trạng thái', '时间': 'Thời gian', '请输入内容': 'Nhập nội dung',
};

function localizeNode(root: Node): void {
    const entries = Object.entries(LOCAL_UI_TRANSLATIONS).sort((a, b) => b[0].length - a[0].length);
    for (const label of root.getComponentsInChildren(Label)) {
        label.useSystemFont = true;
        label.fontFamily = 'Arial';
        let text = label.string || '';
        for (const [source, target] of entries) {
            if (text.includes(source)) text = text.split(source).join(target);
        }
        label.string = text;
    }
    for (const editBox of root.getComponentsInChildren(EditBox)) {
        let placeholder = editBox.placeholder || '';
        for (const [source, target] of entries) {
            if (placeholder.includes(source)) placeholder = placeholder.split(source).join(target);
        }
        editBox.placeholder = placeholder;
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

function ensureUiTransform(node: Node, width: number, height: number): UITransform {
    const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return transform;
}

function ensureUiChild(parent: Node, name: string): Node {
    let node = parent.getChildByName(name);
    if (!node) {
        node = new Node(name);
        node.setParent(parent);
    }
    return node;
}

function hideDirectUiSprites(node: Node): void {
    for (const sprite of node.getComponents(Sprite)) sprite.enabled = false;
}

function suppressLegacyChrome(root: Node, maxDepth: number = 2): void {
    const visit = (node: Node, depth: number): void => {
        if (depth > maxDepth) return;
        const name = node.name.toLowerCase();
        const protectedArt = /(icon|pic|head|avatar|portrait|general|skill|map|army|star)/.test(name);
        const legacyChrome = /(^bg$|background|diban|panel|frame|kuang|border|base|bottom|top|di$)/.test(name);
        if (legacyChrome && !protectedArt) hideDirectUiSprites(node);
        for (const child of node.children) visit(child, depth + 1);
    };
    visit(root, 0);
}

function drawAncientPanel(
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
    graphics.moveTo(-width / 2 + 8, height / 2 - c); graphics.lineTo(-width / 2 + 8, height / 2 - 8); graphics.lineTo(-width / 2 + c, height / 2 - 8);
    graphics.moveTo(width / 2 - c, height / 2 - 8); graphics.lineTo(width / 2 - 8, height / 2 - 8); graphics.lineTo(width / 2 - 8, height / 2 - c);
    graphics.moveTo(-width / 2 + 8, -height / 2 + c); graphics.lineTo(-width / 2 + 8, -height / 2 + 8); graphics.lineTo(-width / 2 + c, -height / 2 + 8);
    graphics.moveTo(width / 2 - c, -height / 2 + 8); graphics.lineTo(width / 2 - 8, -height / 2 + 8); graphics.lineTo(width / 2 - 8, -height / 2 + c);
    graphics.stroke();
}

function createUiText(
    parent: Node, name: string, text: string, fontSize: number, color: Color,
    width: number, height: number, titleFont: boolean = false,
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

function getButtonHandler(button: Button): string {
    for (const event of (button.clickEvents as any[]) || []) {
        if (event && typeof event.handler === 'string' && event.handler) return event.handler;
    }
    return '';
}

function findButtonByHandler(root: Node, handler: string): Button | null {
    return root.getComponentsInChildren(Button).find((button) => getButtonHandler(button) === handler) || null;
}

function styleAncientButton(
    buttonNode: Node, text: string, variant: 'gold' | 'dark' | 'jade' | 'red' = 'dark',
    width: number = 180, height: number = 50,
): Button {
    ensureUiTransform(buttonNode, width, height);
    hideDirectUiSprites(buttonNode);
    const background = buttonNode.getChildByName('Background');
    if (background) hideDirectUiSprites(background);
    const skin = ensureUiChild(buttonNode, '__AncientButtonSkin');
    skin.setPosition(0, 0, 0); skin.setSiblingIndex(0); ensureUiTransform(skin, width, height);
    const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
    graphics.clear();
    let fill = ANCIENT_UI.panelSoft;
    if (variant === 'gold') fill = new Color(120, 78, 28, 255);
    else if (variant === 'jade') fill = ANCIENT_UI.jade;
    else if (variant === 'red') fill = ANCIENT_UI.red;
    graphics.fillColor = fill;
    graphics.roundRect(-width / 2, -height / 2, width, height, 7); graphics.fill();
    graphics.strokeColor = variant === 'gold' ? ANCIENT_UI.gold : ANCIENT_UI.border;
    graphics.lineWidth = 2; graphics.roundRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 6); graphics.stroke();
    for (const label of buttonNode.getComponentsInChildren(Label)) {
        if (label.node.name !== '__AncientButtonLabel') label.node.active = false;
    }
    const label = createUiText(buttonNode, '__AncientButtonLabel', text, variant === 'gold' ? 21 : 18,
        variant === 'gold' ? new Color(255, 239, 194, 255) : ANCIENT_UI.text, width - 20, height - 8, true);
    label.node.active = true; label.node.setPosition(0, 0, 0); label.node.setSiblingIndex(buttonNode.children.length - 1);
    const button = buttonNode.getComponent(Button) || buttonNode.addComponent(Button);
    button.transition = Button.Transition.SCALE; button.zoomScale = 0.97; button.duration = 0.08;
    return button;
}

function styleAncientEditBox(editBox: EditBox, placeholder: string, width: number, height: number): void {
    const node = editBox.node;
    ensureUiTransform(node, width, height); hideDirectUiSprites(node);
    const background = node.getChildByName('Background'); if (background) hideDirectUiSprites(background);
    const skin = ensureUiChild(node, '__AncientInputSkin');
    skin.setPosition(0, 0, 0); skin.setSiblingIndex(0); ensureUiTransform(skin, width, height);
    const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
    graphics.clear(); graphics.fillColor = new Color(18, 16, 14, 238);
    graphics.roundRect(-width / 2, -height / 2, width, height, 7); graphics.fill();
    graphics.strokeColor = new Color(127, 105, 77, 220); graphics.lineWidth = 1.4;
    graphics.roundRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 7); graphics.stroke();
    editBox.placeholder = placeholder;
    if (editBox.placeholderLabel) { editBox.placeholderLabel.useSystemFont = true; editBox.placeholderLabel.fontFamily = 'Arial'; editBox.placeholderLabel.color = new Color(151, 139, 120, 255); }
    if (editBox.textLabel) { editBox.textLabel.useSystemFont = true; editBox.textLabel.fontFamily = 'Arial'; editBox.textLabel.color = ANCIENT_UI.text; }
}

function addAncientScreenTitle(root: Node, title: string): void {
    const header = ensureUiChild(root, '__AncientScreenHeader');
    header.setPosition(0, 320, 0); header.setSiblingIndex(root.children.length - 1); ensureUiTransform(header, 1120, 70);
    const graphics = header.getComponent(Graphics) || header.addComponent(Graphics);
    graphics.clear(); graphics.strokeColor = ANCIENT_UI.border; graphics.lineWidth = 1.5;
    graphics.moveTo(-500, -24); graphics.lineTo(-150, -24); graphics.moveTo(150, -24); graphics.lineTo(500, -24); graphics.stroke();
    const label = createUiText(header, '__AncientScreenTitle', title, 39, ANCIENT_UI.gold, 360, 58, true);
    label.node.setPosition(0, -2, 0); label.node.setSiblingIndex(header.children.length - 1);
}

function applyAncientScreenChrome(root: Node, title: string): void {
    localizeNode(root); suppressLegacyChrome(root, 2);
    const backdrop = ensureUiChild(root, '__AncientScreenBackdrop');
    backdrop.setPosition(0, 0, 0); backdrop.setSiblingIndex(0); ensureUiTransform(backdrop, 1280, 720);
    const graphics = backdrop.getComponent(Graphics) || backdrop.addComponent(Graphics);
    graphics.clear(); graphics.fillColor = new Color(12, 10, 9, 205); graphics.rect(-640, -360, 1280, 720); graphics.fill();
    graphics.strokeColor = new Color(90, 61, 32, 210); graphics.lineWidth = 2;
    graphics.moveTo(-620, 299); graphics.lineTo(620, 299); graphics.moveTo(-620, -309); graphics.lineTo(620, -309); graphics.stroke();
    for (const label of root.getComponentsInChildren(Label)) {
        if (!label.node.name.startsWith('__Ancient')) { label.useSystemFont = true; label.fontFamily = 'Arial'; label.color = ANCIENT_UI.text; }
    }
    addAncientScreenTitle(root, title);
}


export class GeneralItemType {
    static GeneralInfo = 0;
    static GeneralDispose = 1;
    static GeneralConScript = 2;
    static GeneralNoThing = 3;
    static GeneralSelect = 4;
}

@ccclass('GeneralItemLogic')
export default class GeneralItemLogic extends Component {
    @property(Label)
    nameLabel: Label = null;
    @property(Label)
    lvLabel: Label = null;
    @property(Sprite)
    spritePic: Sprite = null;
    @property(Label)
    costLabel: Label = null;
    @property(Label)
    campLabel: Label = null;
    @property(Label)
    armLabel: Label = null;
    @property(Layout)
    starLayout: Layout = null;
    @property(Node)
    delNode: Node = null;
    @property(Node)
    useNode: Node = null;
    @property(Node)
    selectNode: Node = null;

    private _curData: any = null;
    private _type = -1;
    private _position = 0;
    private _cityData: any = null;
    private _orderId = 1;
    private _isSelect = false;

    protected onLoad(): void {
        this.delNode.active = false;
        this._isSelect = false;
        this.applyModernCard();
    }

    private applyModernCard(): void {
        localizeNode(this.node);
        suppressLegacyChrome(this.node, 1);
        drawAncientPanel(this.node, 342, 466, 8, new Color(22, 18, 15, 246));

        if (this.spritePic) {
            this.spritePic.enabled = true;
            this.spritePic.node.setSiblingIndex(this.node.children.length - 2);
        }

        const labels = [this.nameLabel, this.lvLabel, this.costLabel, this.campLabel, this.armLabel];
        for (const label of labels) {
            if (!label) {
                continue;
            }
            label.node.active = true;
            label.useSystemFont = true;
            label.fontFamily = 'Arial';
            label.enableWrapText = false;
            label.overflow = Label.Overflow.SHRINK;
            label.color = ANCIENT_UI.text;
        }

        if (this.nameLabel) {
            this.nameLabel.fontFamily = 'Times New Roman';
            this.nameLabel.fontSize = 25;
            this.nameLabel.lineHeight = 30;
            this.nameLabel.color = ANCIENT_UI.gold;
        }
        if (this.lvLabel) {
            this.lvLabel.fontSize = 17;
            this.lvLabel.lineHeight = 22;
            this.lvLabel.color = ANCIENT_UI.text;
        }
        if (this.campLabel) {
            this.campLabel.fontSize = 16;
            this.campLabel.color = ANCIENT_UI.goldSoft;
        }
        if (this.armLabel) {
            this.armLabel.fontSize = 17;
            this.armLabel.color = ANCIENT_UI.text;
        }
        if (this.costLabel) {
            this.costLabel.fontSize = 16;
            this.costLabel.color = ANCIENT_UI.muted;
        }
    }

    public setData(curData: GeneralData, type: number = 0, position: number = 0): void {
        this.updateItem(curData);
    }

    public updateItem(curData: any): void {
        this.updateView(curData);
        this._type = this._curData.type == undefined ? -1 : this._curData.type;
        this._position = this._curData.position == undefined ? 0 : this._curData.position;
    }

    protected updateView(curData: any): void {
        this._curData = curData;
        const cfgData = GeneralCommand.getInstance().proxy.getGeneralCfg(this._curData.cfgId);
        this.nameLabel.string = cfgData.name;
        this.lvLabel.string = `Lv.${this._curData.level}`;
        this.spritePic.getComponent(GeneralHeadLogic).setHeadId(this._curData.cfgId);
        this.showStar(cfgData.star, this._curData.star_lv);
        this.delNode.active = false;

        if (cfgData.camp == GeneralCampType.Han) {
            this.campLabel.string = 'Hán';
        } else if (cfgData.camp == GeneralCampType.Qun) {
            this.campLabel.string = 'Quần Hùng';
        } else if (cfgData.camp == GeneralCampType.Wei) {
            this.campLabel.string = 'Ngụy';
        } else if (cfgData.camp == GeneralCampType.Shu) {
            this.campLabel.string = 'Thục';
        } else if (cfgData.camp == GeneralCampType.Wu) {
            this.campLabel.string = 'Ngô';
        }

        this.armLabel.string = this.armstr(cfgData.arms);
        if (this.useNode) {
            this.useNode.active = this._type == GeneralItemType.GeneralInfo && this._curData.order > 0;
        }
        if (this.costLabel) {
            this.costLabel.string = `${cfgData.cost}`;
        }
        this.select(false);
    }

    protected armstr(arms: number[]): string {
        if (arms.indexOf(1) >= 0 || arms.indexOf(4) >= 0 || arms.indexOf(7) >= 0) {
            return 'Bộ';
        }
        if (arms.indexOf(2) >= 0 || arms.indexOf(5) >= 0 || arms.indexOf(8) >= 0) {
            return 'Cung';
        }
        if (arms.indexOf(3) >= 0 || arms.indexOf(6) >= 0 || arms.indexOf(9) >= 0) {
            return 'Kỵ';
        }
        return '';
    }

    public select(flag: boolean): void {
        if (this.selectNode) {
            this.selectNode.active = flag;
        }
        this._isSelect = flag;
    }

    protected showStar(star: number = 3, star_lv: number = 0): void {
        const children = this.starLayout.node.children;
        for (let i = 0; i < children.length; i += 1) {
            if (i < star) {
                children[i].active = true;
                const sprite = children[i].getComponent(Sprite);
                if (sprite) {
                    sprite.color = i < star_lv
                        ? new Color(203, 74, 55, 255)
                        : ANCIENT_UI.gold;
                }
            } else {
                children[i].active = false;
            }
        }
    }

    protected setOtherData(cityData: any, orderId: number = 1): void {
        this._cityData = cityData;
        this._orderId = orderId;
        this.delNode.active = true;
    }

    protected onClickGeneral(event: any): void {
        AudioManager.instance.playClick();
        if (!this._curData) {
            return;
        }
        const cfgData = this._curData.config;
        if (this._type == GeneralItemType.GeneralInfo) {
            EventMgr.emit(LogicEvent.openGeneralDes, cfgData, this._curData);
        } else if (this._type == GeneralItemType.GeneralDispose) {
            EventMgr.emit(LogicEvent.chosedGeneral, cfgData, this._curData, this._position);
        } else if (this._type == GeneralItemType.GeneralConScript) {
            EventMgr.emit(LogicEvent.openArmyConscript, this._orderId, this._cityData);
        } else if (this._type == GeneralItemType.GeneralSelect) {
            this._isSelect = !this._isSelect;
            this.select(this._isSelect);
            EventMgr.emit(LogicEvent.openGeneralSelect, cfgData, this._curData, this.node);
        }
    }

    protected onDelete(): void {
        const cfgData = this._curData.config;
        EventMgr.emit(LogicEvent.chosedGeneral, cfgData, this._curData, -1);
    }

    public setWarReportData(curData: any): void {
        this.updateView(curData);
    }
}
