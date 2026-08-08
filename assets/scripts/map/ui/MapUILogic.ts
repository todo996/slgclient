import { _decorator, Color, Component, Label, Layout, Node, Prefab, UITransform, Vec2, instantiate } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { GeneralData } from '../../general/GeneralProxy';
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

function ui(): any {
    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;
    if (!bridge) {
        throw new Error('Ancient UI bridge has not been initialized.');
    }
    return bridge;
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
        ui().localizeNode(this.node);

        const hudRoot = this.widgetNode || this.node;
        const profile = ui().ensureUiChild(hudRoot, '__MapProfilePanel');
        profile.setPosition(-500, 307, 0);
        profile.setSiblingIndex(0);
        ui().drawAncientPanel(profile, 270, 94, 10, new Color(16, 14, 12, 230));

        this.nameLabel.node.setParent(profile);
        this.nameLabel.node.setPosition(28, 18, 0);
        this.nameLabel.useSystemFont = true;
        this.nameLabel.fontFamily = 'Times New Roman';
        this.nameLabel.fontSize = 21;
        this.nameLabel.lineHeight = 27;
        this.nameLabel.enableWrapText = false;
        this.nameLabel.overflow = Label.Overflow.SHRINK;
        this.nameLabel.color = ui().ANCIENT_UI.gold;
        ui().ensureUiTransform(this.nameLabel.node, 190, 30);

        this.ridLabel.node.setParent(profile);
        this.ridLabel.node.setPosition(28, -20, 0);
        this.ridLabel.useSystemFont = true;
        this.ridLabel.fontFamily = 'Arial';
        this.ridLabel.fontSize = 14;
        this.ridLabel.lineHeight = 19;
        this.ridLabel.enableWrapText = false;
        this.ridLabel.overflow = Label.Overflow.SHRINK;
        this.ridLabel.color = ui().ANCIENT_UI.muted;
        ui().ensureUiTransform(this.ridLabel.node, 190, 24);

        const profileMark = ui().createUiText(profile, '__ProfileMark', 'T', 29, ui().ANCIENT_UI.gold, 54, 54, true);
        profileMark.node.setPosition(-90, 0, 0);

        this.srollLayout.type = Layout.Type.HORIZONTAL;
        this.srollLayout.spacingX = 5;
        this.srollLayout.node.setPosition(210, 326, 0);
        ui().ensureUiTransform(this.srollLayout.node, 850, 48);
        const resourceChildren = this.srollLayout.node.children;
        for (let i = 0; i < resourceChildren.length; i += 1) {
            const child = resourceChildren[i];
            child.active = i < 6;
            if (!child.active) {
                continue;
            }
            ui().suppressLegacyChrome(child, 1);
            ui().ensureUiTransform(child, i === 0 ? 120 : 138, 44);
            ui().drawAncientPanel(child, i === 0 ? 120 : 138, 44, 6, ui().ANCIENT_UI.panelSoft);
            const label = child.getChildByName('New Label')?.getComponent(Label);
            if (label) {
                label.useSystemFont = true;
                label.fontFamily = 'Arial';
                label.fontSize = 15;
                label.lineHeight = 20;
                label.enableWrapText = false;
                label.overflow = Label.Overflow.SHRINK;
                label.color = ui().ANCIENT_UI.text;
                ui().ensureUiTransform(label.node, i === 0 ? 108 : 126, 32);
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
            const button = ui().findButtonByHandler(this.node, handler);
            if (!button) {
                continue;
            }
            button.node.setParent(hudRoot);
            button.node.setPosition(-552, y, 0);
            ui().styleAncientButton(button.node, text, 'dark', 160, 52);
            button.node.setSiblingIndex(hudRoot.children.length - 1);
        }

        const chat = ui().findButtonByHandler(this.node, 'openChat');
        if (chat) {
            chat.node.setParent(hudRoot);
            chat.node.setPosition(-342, -319, 0);
            ui().styleAncientButton(chat.node, 'Trò chuyện', 'dark', 430, 50);
            chat.node.setSiblingIndex(hudRoot.children.length - 1);
        }

        const setting = ui().findButtonByHandler(this.node, 'onClickSetting');
        if (setting) {
            setting.node.setParent(hudRoot);
            setting.node.setPosition(555, -305, 0);
            ui().styleAncientButton(setting.node, 'Cài đặt', 'gold', 145, 72);
            setting.node.setSiblingIndex(hudRoot.children.length - 1);
        }

        const back = ui().findButtonByHandler(this.node, 'onBack');
        if (back) {
            back.node.setParent(profile);
            back.node.setPosition(97, -63, 0);
            ui().styleAncientButton(back.node, 'Đăng xuất', 'dark', 110, 32);
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
