import { _decorator, Color, Component, Label, Layout, Node, Prefab, UITransform, Vec2, instantiate, Button, EditBox, Graphics, HorizontalTextAlignment, Sprite, VerticalTextAlignment } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { GeneralData } from '../../general/GeneralProxy';
import {
    ANCIENT_UI } from '../../common/AudioManager';
import LoginCommand from '../../login/LoginCommand';
import { Skill } from '../../skill/SkillProxy';
import UnionCommand from '../../union/UnionCommand';
import { EventMgr } from '../../utils/EventMgr';
import { Tools } from '../../utils/Tools';
import MapCommand from '../MapCommand';
import ArmySelectNodeLogic from './ArmySelectNodeLogic';
import CityAboutLogic from './CityAboutLogic';
import CityArmySettingLogic from './CityArmySettingLogic';
import Dialog, { DialogType } from './Dialog';
import DrawRLogic from './DrawRLogic';
import FacilityListLogic from './FacilityListLogic';
import FortressAbout from './FortressAbout';
import GeneralInfoLogic from './GeneralInfoLogic';
import GeneralListLogic from './GeneralListLogic';
import MapUICommand from './MapUICommand';
import SkillInfoLogic from './SkillInfoLogic';
import SkillLogic from './SkillLogic';
import TransformLogic from './TransformLogic';
import WarReportLogic from './WarReportLogic';

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


@ccclass('MapUILogic')
export default class MapUILogic extends Component {
    @property(Node)
    contentNode: Node = null;

    @property(Prefab)
    facilityPrefab: Prefab = null;
    protected _facilityNode: Node = null;

    @property(Prefab)
    armySettingPrefab: Prefab = null;
    protected _armySettingNode: Node = null;

    @property(Prefab)
    dialog: Prefab = null;
    protected _dialogNode: Node = null;

    @property(Prefab)
    generalPrefab: Prefab = null;
    protected _generalNode: Node = null;

    @property(Prefab)
    generalDesPrefab: Prefab = null;
    protected _generalDesNode: Node = null;

    @property(Prefab)
    cityAboutPrefab: Prefab = null;
    protected _cityAboutNode: Node = null;

    @property(Prefab)
    fortressAboutPrefab: Prefab = null;
    protected _fortressAboutNode: Node = null;

    @property(Prefab)
    warReportPrefab: Prefab = null;
    protected _warReportNode: Node = null;

    @property(Prefab)
    armySelectPrefab: Prefab = null;
    protected _armySelectNode: Node = null;

    @property(Prefab)
    drawPrefab: Prefab = null;
    protected _drawNode: Node = null;

    @property(Prefab)
    drawResultrefab: Prefab = null;
    protected _drawResultNode: Node = null;

    @property(Prefab)
    unionPrefab: Prefab = null;
    protected _unionNode: Node = null;

    @property(Prefab)
    chatPrefab: Prefab = null;
    protected _chatNode: Node = null;

    @property(Prefab)
    collectPrefab: Prefab = null;
    protected _collectNode: Node = null;

    @property(Prefab)
    transFormPrefab: Prefab = null;
    protected _transFormNode: Node = null;

    @property(Prefab)
    generalConvertPrefab: Prefab = null;
    protected _generalConvertNode: Node = null;

    @property(Prefab)
    generalRosterPrefab: Prefab = null;
    protected _generalRosterNode: Node = null;

    @property(Prefab)
    skillPrefab: Prefab = null;
    protected _skillNode: Node = null;

    @property(Prefab)
    skillInfoPrefab: Prefab = null;
    protected _skillInfoNode: Node = null;

    @property(Prefab)
    settingPrefab: Prefab = null;
    protected _settingNode: Node = null;

    @property(Prefab)
    cloudAniPrefab: Prefab = null;
    protected _cloudAniNode: Node = null;

    @property(Node)
    widgetNode: Node = null;

    @property(Layout)
    srollLayout: Layout = null;

    @property(Label)
    nameLabel: Label = null;

    @property(Label)
    ridLabel: Label = null;

    protected _resArray: any[] = [];
    protected _yieldArray: any[] = [];

    protected onLoad(): void {
        this._resArray.push({ key: 'gold', name: 'Vàng ' });
        this._resArray.push({ key: 'wood', name: 'Gỗ ' });
        this._resArray.push({ key: 'iron', name: 'Sắt ' });
        this._resArray.push({ key: 'stone', name: 'Đá ' });
        this._resArray.push({ key: 'grain', name: 'Lương ' });

        this._yieldArray.push({ key: 'wood_yield', name: 'Gỗ+' });
        this._yieldArray.push({ key: 'iron_yield', name: 'Sắt+' });
        this._yieldArray.push({ key: 'stone_yield', name: 'Đá+' });
        this._yieldArray.push({ key: 'grain_yield', name: 'Lương+' });

        EventMgr.on(LogicEvent.openCityAbout, this.openCityAbout, this);
        EventMgr.on(LogicEvent.closeCityAbout, this.closeCityAbout, this);
        EventMgr.on(LogicEvent.openFortressAbout, this.openFortressAbout, this);
        EventMgr.on(LogicEvent.openFacility, this.openFacility, this);
        EventMgr.on(LogicEvent.openArmySetting, this.openArmySetting, this);
        EventMgr.on(LogicEvent.upateMyRoleRes, this.updateRoleRes, this);
        EventMgr.on(LogicEvent.openGeneralDes, this.openGeneralDes, this);
        EventMgr.on(LogicEvent.openGeneralChoose, this.openGeneralChoose, this);
        EventMgr.on(LogicEvent.openArmySelectUi, this.onOpenArmySelectUI, this);
        EventMgr.on(LogicEvent.openDrawResult, this.openDrawR, this);
        EventMgr.on(LogicEvent.robLoginUI, this.robLoginUI, this);
        EventMgr.on(LogicEvent.interiorCollect, this.onCollection, this);
        EventMgr.on(LogicEvent.openGeneralConvert, this.onOpenGeneralConvert, this);
        EventMgr.on(LogicEvent.openGeneralRoster, this.onOpenGeneralRoster, this);
        EventMgr.on(LogicEvent.openGeneral, this.openGeneral, this);
        EventMgr.on(LogicEvent.openSkill, this.onOpenSkill, this);
        EventMgr.on(LogicEvent.closeSkill, this.onCloseSkill, this);
        EventMgr.on(LogicEvent.openSkillInfo, this.onOpenSkillInfo, this);
        EventMgr.on(LogicEvent.beforeScrollToMap, this.beforeScrollToMap, this);
        EventMgr.on(LogicEvent.showTip, this.showTip, this);

        this.applyModernMapHud();
        this.updateRoleRes();
        this.updateRole();

        const unionId = MapCommand.getInstance().cityProxy.myUnionId;
        if (unionId > 0) {
            UnionCommand.getInstance().unionApplyList(unionId);
        }
    }

    private applyModernMapHud(): void {
        localizeNode(this.node);

        const hudRoot = this.widgetNode || this.node;
        const profile = ensureUiChild(hudRoot, '__MapProfilePanel');
        profile.setPosition(-500, 307, 0);
        profile.setSiblingIndex(0);
        drawAncientPanel(profile, 270, 94, 10, new Color(16, 14, 12, 230));

        this.nameLabel.node.setParent(profile);
        this.nameLabel.node.setPosition(28, 18, 0);
        this.nameLabel.useSystemFont = true;
        this.nameLabel.fontFamily = 'Times New Roman';
        this.nameLabel.fontSize = 21;
        this.nameLabel.lineHeight = 27;
        this.nameLabel.enableWrapText = false;
        this.nameLabel.overflow = Label.Overflow.SHRINK;
        this.nameLabel.color = ANCIENT_UI.gold;
        ensureUiTransform(this.nameLabel.node, 190, 30);

        this.ridLabel.node.setParent(profile);
        this.ridLabel.node.setPosition(28, -20, 0);
        this.ridLabel.useSystemFont = true;
        this.ridLabel.fontFamily = 'Arial';
        this.ridLabel.fontSize = 14;
        this.ridLabel.lineHeight = 19;
        this.ridLabel.enableWrapText = false;
        this.ridLabel.overflow = Label.Overflow.SHRINK;
        this.ridLabel.color = ANCIENT_UI.muted;
        ensureUiTransform(this.ridLabel.node, 190, 24);

        const profileMark = createUiText(profile, '__ProfileMark', 'T', 29, ANCIENT_UI.gold, 54, 54, true);
        profileMark.node.setPosition(-90, 0, 0);

        this.srollLayout.type = Layout.Type.HORIZONTAL;
        this.srollLayout.spacingX = 5;
        this.srollLayout.node.setPosition(210, 326, 0);
        ensureUiTransform(this.srollLayout.node, 850, 48);
        const resourceChildren = this.srollLayout.node.children;
        for (let i = 0; i < resourceChildren.length; i += 1) {
            const child = resourceChildren[i];
            child.active = i < 6;
            if (!child.active) {
                continue;
            }
            suppressLegacyChrome(child, 1);
            ensureUiTransform(child, i === 0 ? 120 : 138, 44);
            drawAncientPanel(child, i === 0 ? 120 : 138, 44, 6, ANCIENT_UI.panelSoft);
            const label = child.getChildByName('New Label')?.getComponent(Label);
            if (label) {
                label.useSystemFont = true;
                label.fontFamily = 'Arial';
                label.fontSize = 15;
                label.lineHeight = 20;
                label.enableWrapText = false;
                label.overflow = Label.Overflow.SHRINK;
                label.color = ANCIENT_UI.text;
                ensureUiTransform(label.node, i === 0 ? 108 : 126, 32);
            }
        }

        const menu: Array<[string, string, number]> = [
            ['onClickGeneral', 'Tướng', 178],
            ['openDraw', 'Chiêu mộ', 118],
            ['openWarReport', 'Chiến báo', 58],
            ['openUnion', 'Liên minh', -2],
            ['openTr', 'Chợ', -62],
            ['onClickCollection', 'Thu thuế', -122],
            ['onClickSkillBtn', 'Kỹ năng', -182],
        ];

        for (const [handler, text, y] of menu) {
            const button = findButtonByHandler(this.node, handler);
            if (!button) {
                continue;
            }
            button.node.setParent(hudRoot);
            button.node.setPosition(-552, y, 0);
            styleAncientButton(button.node, text, 'dark', 160, 52);
            button.node.setSiblingIndex(hudRoot.children.length - 1);
        }

        const chat = findButtonByHandler(this.node, 'openChat');
        if (chat) {
            chat.node.setParent(hudRoot);
            chat.node.setPosition(-342, -319, 0);
            styleAncientButton(chat.node, 'Trò chuyện', 'dark', 430, 50);
            chat.node.setSiblingIndex(hudRoot.children.length - 1);
        }

        const setting = findButtonByHandler(this.node, 'onClickSetting');
        if (setting) {
            setting.node.setParent(hudRoot);
            setting.node.setPosition(555, -305, 0);
            styleAncientButton(setting.node, 'Cài đặt', 'gold', 145, 72);
            setting.node.setSiblingIndex(hudRoot.children.length - 1);
        }

        const back = findButtonByHandler(this.node, 'onBack');
        if (back) {
            back.node.setParent(profile);
            back.node.setPosition(97, -63, 0);
            styleAncientButton(back.node, 'Đăng xuất', 'dark', 110, 32);
        }
    }

    protected robLoginUI(): void {
        this.showTip('Tài khoản đã đăng nhập ở nơi khác', () => {
            EventMgr.emit(LogicEvent.enterLogin);
        });
    }

    protected showTip(text: string, close: Function): void {
        if (this._dialogNode == null) {
            this._dialogNode = instantiate(this.dialog);
            this._dialogNode.parent = this.contentNode;
        } else {
            this._dialogNode.active = true;
        }
        this._dialogNode.setSiblingIndex(this.topLayer());
        this._dialogNode.getComponent(Dialog).show(text, DialogType.OnlyConfirm);
        this._dialogNode.getComponent(Dialog).setClose(close);
    }

    protected onDestroy(): void {
        this.clearAllNode();
        MapUICommand.getInstance().proxy.clearData();
        EventMgr.targetOff(this);
    }

    protected onBack(): void {
        AudioManager.instance.playClick();
        LoginCommand.getInstance().account_logout();
    }

    protected clearAllNode(): void {
        this._facilityNode = null;
        this._generalNode = null;
        this._cityAboutNode = null;
        this._fortressAboutNode = null;
        this._armySelectNode = null;
        this._armySettingNode = null;
        this._drawNode = null;
        this._drawResultNode = null;
        this._generalDesNode = null;
        this._dialogNode = null;
    }

    public topLayer(): number {
        return this.contentNode.children.length + 1;
    }

    protected openFacility(data: any): void {
        if (this._facilityNode == null) {
            this._facilityNode = instantiate(this.facilityPrefab);
            this._facilityNode.parent = this.contentNode;
        } else {
            this._facilityNode.active = true;
        }
        this._facilityNode.setSiblingIndex(this.topLayer());
        this._facilityNode.getComponent(FacilityListLogic).setData(data);
    }

    protected openArmySetting(cityId: number, order: number): void {
        if (this._armySettingNode == null) {
            this._armySettingNode = instantiate(this.armySettingPrefab);
            this._armySettingNode.parent = this.contentNode;
        } else {
            this._armySettingNode.active = true;
        }
        this._armySettingNode.setSiblingIndex(this.topLayer());
        this._armySettingNode.getComponent(CityArmySettingLogic).setData(cityId, order);
    }

    protected onClickGeneral(): void {
        AudioManager.instance.playClick();
        this.openGeneral([]);
    }

    protected openGeneral(data: number[], type: number = 0, position: number = 0): void {
        if (this._generalNode == null) {
            this._generalNode = instantiate(this.generalPrefab);
            this._generalNode.parent = this.contentNode;
        } else {
            this._generalNode.active = true;
        }
        this._generalNode.setSiblingIndex(this.topLayer());
        this._generalNode.getComponent(GeneralListLogic).setData(data, type, position);
    }

    protected openGeneralChoose(data: number[], position: number = 0): void {
        this.openGeneral(data, 1, position);
    }

    protected onOpenArmySelectUI(cmd: number, x: number, y: number): void {
        if (this._armySelectNode == null) {
            this._armySelectNode = instantiate(this.armySelectPrefab);
            this._armySelectNode.parent = this.contentNode;
        } else {
            this._armySelectNode.active = true;
        }
        this._armySelectNode.setSiblingIndex(this.topLayer());
        this._armySelectNode.getComponent(ArmySelectNodeLogic).setData(cmd, x, y);
    }

    protected openGeneralDes(cfgData: any, curData: any): void {
        if (this._generalDesNode == null) {
            this._generalDesNode = instantiate(this.generalDesPrefab);
            this._generalDesNode.parent = this.contentNode;
        } else {
            this._generalDesNode.active = true;
        }
        this._generalDesNode.setSiblingIndex(this.topLayer());
        this._generalDesNode.getComponent(GeneralInfoLogic).setData(cfgData, curData);
    }

    protected openCityAbout(data: any): void {
        if (this._cityAboutNode == null) {
            this._cityAboutNode = instantiate(this.cityAboutPrefab);
            this._cityAboutNode.parent = this.contentNode;
        } else {
            this._cityAboutNode.active = true;
        }
        this._cityAboutNode.setSiblingIndex(this.topLayer());
        this.widgetNode.active = false;
        EventMgr.emit(LogicEvent.scrollToMap, data.x, data.y);
        this._cityAboutNode.getComponent(CityAboutLogic).setData(data);
    }

    protected closeCityAbout(): void {
        this.widgetNode.active = true;
    }

    protected openFortressAbout(data: any): void {
        if (this._fortressAboutNode == null) {
            this._fortressAboutNode = instantiate(this.fortressAboutPrefab);
            this._fortressAboutNode.parent = this.contentNode;
        } else {
            this._fortressAboutNode.active = true;
        }
        this._fortressAboutNode.setSiblingIndex(this.topLayer());
        this._fortressAboutNode.getComponent(FortressAbout).setData(data);
    }

    protected openWarReport(): void {
        AudioManager.instance.playClick();
        if (this._warReportNode == null) {
            this._warReportNode = instantiate(this.warReportPrefab);
            this._warReportNode.parent = this.contentNode;
        } else {
            this._warReportNode.active = true;
        }
        this._warReportNode.setSiblingIndex(this.topLayer());
        this._warReportNode.getComponent(WarReportLogic).updateView();
    }

    protected updateRoleRes(): void {
        const children = this.srollLayout.node.children;
        const roleRes = LoginCommand.getInstance().proxy.getRoleResData();
        let i = 0;
        const decreeLabel = children[i]?.getChildByName('New Label')?.getComponent(Label);
        if (decreeLabel) {
            decreeLabel.string = `Lệnh ${Tools.numberToShow(roleRes.decree)}`;
        }
        i += 1;

        for (const obj of this._resArray) {
            const label = children[i]?.getChildByName('New Label')?.getComponent(Label);
            if (label) {
                label.string = `${obj.name}${Tools.numberToShow(roleRes[obj.key])}`;
            }
            i += 1;
        }

        for (const obj of this._yieldArray) {
            const label = children[i]?.getChildByName('New Label')?.getComponent(Label);
            if (label) {
                label.string = `${obj.name}${Tools.numberToShow(roleRes[obj.key])}`;
            }
            i += 1;
        }
    }

    protected openDraw(): void {
        AudioManager.instance.playClick();
        if (this._drawNode == null) {
            this._drawNode = instantiate(this.drawPrefab);
            this._drawNode.parent = this.contentNode;
        } else {
            this._drawNode.active = true;
        }
        this._drawNode.setSiblingIndex(this.topLayer());
    }

    protected openDrawR(data: any): void {
        if (this._drawResultNode == null) {
            this._drawResultNode = instantiate(this.drawResultrefab);
            this._drawResultNode.parent = this.contentNode;
        } else {
            this._drawResultNode.active = true;
        }
        this._drawResultNode.setSiblingIndex(this.topLayer());
        this._drawResultNode.getComponent(DrawRLogic).setData(data);
    }

    protected openUnion(): void {
        AudioManager.instance.playClick();
        if (this._unionNode == null) {
            this._unionNode = instantiate(this.unionPrefab);
            this._unionNode.parent = this.contentNode;
        } else {
            this._unionNode.active = true;
        }
        this._unionNode.setSiblingIndex(this.topLayer());
    }

    protected openChat(): void {
        AudioManager.instance.playClick();
        if (this._chatNode == null) {
            this._chatNode = instantiate(this.chatPrefab);
            this._chatNode.parent = this.contentNode;
        } else {
            this._chatNode.active = true;
        }
        this._chatNode.setSiblingIndex(this.topLayer());
    }

    protected openTr(): void {
        AudioManager.instance.playClick();
        if (this._transFormNode == null) {
            this._transFormNode = instantiate(this.transFormPrefab);
            this._transFormNode.parent = this.contentNode;
        } else {
            this._transFormNode.active = true;
        }
        this._transFormNode.setSiblingIndex(this.topLayer());
        this._transFormNode.getComponent(TransformLogic).initView();
    }

    protected onOpenGeneralConvert(): void {
        AudioManager.instance.playClick();
        if (this._generalConvertNode == null) {
            this._generalConvertNode = instantiate(this.generalConvertPrefab);
            this._generalConvertNode.parent = this.contentNode;
        } else {
            this._generalConvertNode.active = true;
        }
        this._generalConvertNode.setSiblingIndex(this.topLayer());
    }

    protected onOpenGeneralRoster(): void {
        AudioManager.instance.playClick();
        if (this._generalRosterNode == null) {
            this._generalRosterNode = instantiate(this.generalRosterPrefab);
            this._generalRosterNode.parent = this.contentNode;
        } else {
            this._generalRosterNode.active = true;
        }
        this._generalRosterNode.setSiblingIndex(this.topLayer());
    }

    onClickSkillBtn(): void {
        AudioManager.instance.playClick();
        this.onOpenSkill(0);
    }

    protected onOpenSkill(type: number = 0, general: GeneralData = null, skillPos: number = -1): void {
        if (this._skillNode == null) {
            this._skillNode = instantiate(this.skillPrefab);
            this._skillNode.parent = this.contentNode;
        } else {
            this._skillNode.active = true;
        }
        this._skillNode.setSiblingIndex(this.topLayer());
        this._skillNode.getComponent(SkillLogic).setData(type, general, skillPos);
    }

    protected onCloseSkill(): void {
        AudioManager.instance.playClick();
        if (this._skillNode) {
            this._skillNode.active = false;
        }
    }

    protected onOpenSkillInfo(cfg: Skill, type: number = 0, general: GeneralData = null, skillPos: number = -1): void {
        AudioManager.instance.playClick();
        if (this._skillInfoNode == null) {
            this._skillInfoNode = instantiate(this.skillInfoPrefab);
            this._skillInfoNode.parent = this.contentNode;
        } else {
            this._skillInfoNode.active = true;
        }
        this._skillInfoNode.setSiblingIndex(this.topLayer());
        this._skillInfoNode.getComponent(SkillInfoLogic).setData(cfg, type, general, skillPos);
    }

    protected onCollection(msg: any): void {
        this.showTip(`Đã thu được ${msg.gold} Vàng`, null);
    }

    protected updateRole(): void {
        const roleData = LoginCommand.getInstance().proxy.getRoleData();
        this.nameLabel.string = roleData.nickName;
        this.ridLabel.string = `ID: ${roleData.rid}`;
    }

    protected onClickCollection(): void {
        AudioManager.instance.playClick();
        if (this._collectNode == null) {
            this._collectNode = instantiate(this.collectPrefab);
            this._collectNode.parent = this.contentNode;
        }
        this._collectNode.active = true;
        this._collectNode.setSiblingIndex(this.topLayer());
    }

    protected onClickSetting(): void {
        AudioManager.instance.playClick();
        if (this._settingNode == null) {
            this._settingNode = instantiate(this.settingPrefab);
            this._settingNode.parent = this.contentNode;
        }
        this._settingNode.active = true;
        this._settingNode.setSiblingIndex(this.topLayer());
    }

    protected beforeScrollToMap(x: number, y: number, oldx: number, oldy: number): void {
        const newPoint = new Vec2(x, y);
        const oldPoint = new Vec2(oldx, oldy);
        const dis = Vec2.squaredDistance(newPoint, oldPoint);
        if (dis < 360000) {
            return;
        }
        if (this._cloudAniNode == null) {
            this._cloudAniNode = instantiate(this.cloudAniPrefab);
            this._cloudAniNode.parent = this.contentNode;
        }
        this._cloudAniNode.active = true;
        this._cloudAniNode.setSiblingIndex(this.topLayer());
    }
}
