import { _decorator, Button, Color, Component, Graphics, Prefab, Node, Layout, Label, instantiate, UITransform, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

import LoginCommand from "../../login/LoginCommand";
import ArmySelectNodeLogic from "./ArmySelectNodeLogic";
import CityArmySettingLogic from "./CityArmySettingLogic";
import FacilityListLogic from "./FacilityListLogic";
import MapUICommand from "./MapUICommand";
import Dialog, { DialogType } from "./Dialog";
import UnionCommand from "../../union/UnionCommand";
import MapCommand from "../MapCommand";
import FortressAbout from "./FortressAbout";
import CityAboutLogic from "./CityAboutLogic";
import GeneralListLogic from "./GeneralListLogic";
import TransformLogic from "./TransformLogic";
import { Tools } from "../../utils/Tools";
import GeneralInfoLogic from "./GeneralInfoLogic";
import WarReportLogic from "./WarReportLogic";
import DrawRLogic from "./DrawRLogic";
import { GeneralData } from "../../general/GeneralProxy";
import SkillLogic from "./SkillLogic";
import SkillInfoLogic from "./SkillInfoLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { Skill } from '../../skill/SkillProxy';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('MapUILogic')
export default class MapUILogic extends Component {

    @property(Node)
    contentNode:Node = null;

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

    protected _resArray: any = [];
    protected _yieldArray: any = [];

    private _referenceHud: Node = null;
    private _referenceRoleName: Label = null;
    private _referenceRoleId: Label = null;
    private _referenceResourceLabels: {[key: string]: Label} = {};

    protected onLoad(): void {
        this._resArray.push({key:"grain", name:"Lương:"});
        this._resArray.push({key:"wood", name:"Gỗ:"});
        this._resArray.push({key:"iron", name:"Sắt:"});
        this._resArray.push({key:"stone", name:"Đá:"});
        this._resArray.push({key:"gold", name:"Vàng:"});

        this._yieldArray.push({key:"wood_yield", name:"Gỗ+"});
        this._yieldArray.push({key:"iron_yield", name:"Sắt+"});
        this._yieldArray.push({key:"stone_yield", name:"Đá+"});
        this._yieldArray.push({key:"grain_yield", name:"Lương+"});

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

        this.buildReferenceMapHud();
        this.updateRoleRes();
        this.updateRole();

        let unionId = MapCommand.getInstance().cityProxy.myUnionId;
        if (unionId > 0) {
            UnionCommand.getInstance().unionApplyList(unionId);
        }
    }

    /**
     * Bỏ HUD cũ khỏi runtime và dựng hierarchy mới theo ảnh mẫu.
     * Các callback đều gọi thẳng chức năng thật đang có trong MapUILogic.
     */
    private buildReferenceMapHud(): void {
        const legacyRoots = [...this.node.children];
        const contentRoot = this.topLevelChildOf(this.contentNode);
        const oldWidget = this.widgetNode;

        for (const child of legacyRoots) {
            if (child !== contentRoot) {
                child.active = false;
            }
        }
        if (oldWidget && oldWidget !== contentRoot) {
            oldWidget.active = false;
        }
        if (this.srollLayout && this.srollLayout.node) {
            this.srollLayout.node.active = false;
        }
        if (this.nameLabel && this.nameLabel.node) {
            this.nameLabel.node.active = false;
        }
        if (this.ridLabel && this.ridLabel.node) {
            this.ridLabel.node.active = false;
        }

        const hud = new Node('ReferenceMapHud');
        hud.parent = this.node;
        hud.layer = this.node.layer;
        hud.addComponent(UITransform).setContentSize(1280, 720);
        this._referenceHud = hud;
        this.widgetNode = hud;

        // Hồ sơ người chơi góc trái trên.
        const profile = this.makePanel(hud, 'PlayerProfile', 258, 92, -501, 309, new Color(17, 13, 10, 235), new Color(171, 126, 63, 255), 2, 12);
        this.makePanel(profile, 'AvatarFrame', 66, 66, -88, 0, new Color(54, 34, 20, 255), new Color(220, 174, 91, 255), 2, 33);
        this.makeLabel(profile, 'AvatarMark', 'T', -88, 0, 28, new Color(232, 196, 124, 255), true, 58);
        this._referenceRoleName = this.makeLabel(profile, 'RoleName', '', 24, 18, 19, new Color(241, 222, 184, 255), true, 150);
        this._referenceRoleId = this.makeLabel(profile, 'RoleId', '', 24, -14, 13, new Color(160, 142, 113, 255), false, 150);
        this.makeButton(profile, 'Logout', 'Thoát', 88, -38, 68, 24, () => this.onBack(), false, 12);

        // Thanh tài nguyên theo đúng tinh thần chip đen-vàng của mẫu.
        const resources: Array<{key: string; title: string}> = [
            {key: 'decree', title: 'Lệnh'},
            {key: 'gold', title: 'Vàng'},
            {key: 'wood', title: 'Gỗ'},
            {key: 'iron', title: 'Sắt'},
            {key: 'stone', title: 'Đá'},
            {key: 'grain', title: 'Lương'},
        ];
        const startX = -260;
        resources.forEach((item, index) => {
            const chip = this.makePanel(hud, `Resource_${item.key}`, 142, 44, startX + index * 145, 326, new Color(16, 12, 9, 228), new Color(100, 73, 39, 255), 1, 7);
            this.makeLabel(chip, `${item.key}_title`, item.title, -39, 0, 13, new Color(180, 153, 105, 255), true, 58);
            this._referenceResourceLabels[item.key] = this.makeLabel(chip, `${item.key}_value`, '0', 34, 0, 15, new Color(244, 224, 180, 255), true, 72);
        });

        // Menu dọc bên trái. Chỉ đưa vào những chức năng có handler thật.
        const menu: Array<{title: string; action: () => void}> = [
            {title: 'TƯỚNG', action: () => this.onClickGeneral()},
            {title: 'CHIẾN BÁO', action: () => this.openWarReport()},
            {title: 'CHIÊU MỘ', action: () => this.openDraw()},
            {title: 'LIÊN MINH', action: () => this.openUnion()},
            {title: 'CHỢ', action: () => this.openTr()},
            {title: 'TRÒ CHUYỆN', action: () => this.openChat()},
            {title: 'THU THUẾ', action: () => this.onClickCollection()},
            {title: 'KỸ NĂNG', action: () => this.onClickSkillBtn()},
        ];
        menu.forEach((item, index) => {
            this.makeButton(hud, `Menu_${index}`, item.title, -565, 196 - index * 52, 136, 44, item.action, false, 14);
        });

        // Cụm chức năng góc phải dưới như ảnh mẫu.
        this.makeButton(hud, 'SettingButton', 'CÀI ĐẶT', 560, -311, 118, 42, () => this.onClickSetting(), false, 13);

        // contentNode chứa popup thật luôn được đặt trên HUD mới.
        if (contentRoot) {
            contentRoot.active = true;
            contentRoot.setSiblingIndex(this.node.children.length - 1);
        }
        hud.setSiblingIndex(Math.max(0, this.node.children.length - 2));
    }

    private topLevelChildOf(node: Node): Node {
        if (!node) {
            return null;
        }
        let current = node;
        while (current.parent && current.parent !== this.node) {
            current = current.parent;
        }
        return current.parent === this.node ? current : null;
    }

    private makePanel(
        parent: Node,
        name: string,
        width: number,
        height: number,
        x: number,
        y: number,
        fill: Color,
        stroke: Color,
        lineWidth: number,
        radius: number,
    ): Node {
        const node = new Node(name);
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, height);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = fill;
        graphics.strokeColor = stroke;
        graphics.lineWidth = lineWidth;
        if (radius > 0) {
            graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        } else {
            graphics.rect(-width / 2, -height / 2, width, height);
        }
        graphics.fill();
        if (lineWidth > 0 && stroke.a > 0) {
            graphics.stroke();
        }
        return node;
    }

    private makeLabel(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        fontSize: number,
        color: Color,
        bold: boolean,
        width: number,
    ): Label {
        const node = new Node(name);
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, Math.max(28, fontSize + 10));
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 5;
        label.color = color;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }

    private makeButton(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        callback: () => void,
        primary: boolean,
        fontSize: number,
    ): Node {
        const node = this.makePanel(
            parent,
            name,
            width,
            height,
            x,
            y,
            primary ? new Color(105, 67, 29, 250) : new Color(21, 16, 12, 238),
            primary ? new Color(231, 188, 99, 255) : new Color(129, 92, 48, 255),
            2,
            8,
        );
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        node.on(Button.EventType.CLICK, callback, this);
        this.makeLabel(node, `${name}_label`, text, 0, 0, fontSize, new Color(238, 218, 177, 255), true, width - 12);
        return node;
    }

    protected robLoginUI(): void {
        this.showTip("Tài khoản đã đăng nhập ở nơi khác",function () {
            EventMgr.emit(LogicEvent.enterLogin);
        });
    }

    protected showTip(text:string, close:Function):void {
        if (this._dialogNode == null){
            this._dialogNode = instantiate(this.dialog)
            this._dialogNode.parent = this.contentNode;
        }else{
            this._dialogNode.active = true;
        }
        this._dialogNode.setSiblingIndex(this.topLayer());
        this._dialogNode.getComponent(Dialog).show(text, DialogType.OnlyConfirm);
        this._dialogNode.getComponent(Dialog).setClose(close)
    }

    protected onDestroy(): void {
        this.clearAllNode();
        MapUICommand.getInstance().proxy.clearData();
        EventMgr.targetOff(this);
        console.log("MapUILogic onDestroy")
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
        this._dialogNode = null
    }

    public topLayer():number {
        return this.contentNode.children.length+1;
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

    protected onClickGeneral(){
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
        const roleRes = LoginCommand.getInstance().proxy.getRoleResData();

        // Giữ cập nhật các node legacy ở trạng thái ẩn để không thay contract hiện tại.
        if (this.srollLayout && this.srollLayout.node) {
            const children = this.srollLayout.node.children;
            let i = 0;
            if (children[i] && children[i].getChildByName("New Label")) {
                children[i].getChildByName("New Label").getComponent(Label).string = "Lệnh:" + Tools.numberToShow(roleRes["decree"]);
                i += 1;
                for (let index = 0; index < this._resArray.length; index++) {
                    const obj = this._resArray[index];
                    if (!children[i] || !children[i].getChildByName("New Label")) break;
                    const label = children[i].getChildByName("New Label").getComponent(Label);
                    if(obj.key == "gold"){
                        label.string = obj.name + Tools.numberToShow(roleRes[obj.key]);
                    }else{
                        label.string = obj.name + Tools.numberToShow(roleRes[obj.key]) + "/" + Tools.numberToShow(roleRes["depot_capacity"]);
                    }
                    i += 1;
                }
                for (let index = 0; index < this._yieldArray.length; index++) {
                    const obj = this._yieldArray[index];
                    if (!children[i] || !children[i].getChildByName("New Label")) break;
                    children[i].getChildByName("New Label").getComponent(Label).string = obj.name + Tools.numberToShow(roleRes[obj.key]);
                    i += 1;
                }
            }
        }

        const keys = ['decree', 'gold', 'wood', 'iron', 'stone', 'grain'];
        keys.forEach((key) => {
            const label = this._referenceResourceLabels[key];
            if (label) {
                label.string = Tools.numberToShow(roleRes[key] || 0);
            }
        });
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
        console.log("onOpenGeneralConvert");
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
        console.log("onOpenGeneralRoster");
        if (this._generalRosterNode == null) {
            this._generalRosterNode = instantiate(this.generalRosterPrefab);
            this._generalRosterNode.parent = this.contentNode;
        } else {
            this._generalRosterNode.active = true;
        }
        this._generalRosterNode.setSiblingIndex(this.topLayer());
    }

    onClickSkillBtn(): void{
        AudioManager.instance.playClick();
        this.onOpenSkill(0);
    }

    protected onOpenSkill(type:number=0, general:GeneralData = null, skillPos:number=-1): void {
        console.log("onOpenSkill", type, general, skillPos);
        if (this._skillNode == null) {
            this._skillNode = instantiate(this.skillPrefab);
            this._skillNode.parent = this.contentNode;
        } else {
            this._skillNode.active = true;
        }
        this._skillNode.setSiblingIndex(this.topLayer());
        this._skillNode.getComponent(SkillLogic).setData(type, general, skillPos);
    }

    protected onCloseSkill(){
        AudioManager.instance.playClick();
        if (this._skillNode) {
           this._skillNode.active = false;
        }
    }

    protected onOpenSkillInfo(cfg:Skill, type:number=0, general:GeneralData = null, skillPos:number=-1){
        console.log("onOpenSkillInfo", cfg, type, general, skillPos);
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

    protected onCollection(msg:any):void{
        this.showTip("Đã thu được "+msg.gold+" Vàng", null);
    }

    protected updateRole(): void {
        const roleData = LoginCommand.getInstance().proxy.getRoleData();
        if (this.nameLabel) {
            this.nameLabel.string = "Tên nhân vật: " + roleData.nickName;
        }
        if (this.ridLabel) {
            this.ridLabel.string = "Nhân vậtID: " + roleData.rid + "";
        }
        if (this._referenceRoleName) {
            this._referenceRoleName.string = roleData.nickName || 'Chủ công';
        }
        if (this._referenceRoleId) {
            this._referenceRoleId.string = `ID ${roleData.rid}`;
        }
    }

    protected onClickCollection():void {
        AudioManager.instance.playClick();
        if(this._collectNode == null){
            this._collectNode = instantiate(this.collectPrefab);
            this._collectNode.parent = this.contentNode;
        }
        this._collectNode.active = true;
        this._collectNode.setSiblingIndex(this.topLayer());
    }

    protected onClickSetting():void {
        AudioManager.instance.playClick();
        if(this._settingNode == null){
            this._settingNode = instantiate(this.settingPrefab);
            this._settingNode.parent = this.contentNode;
        }
        this._settingNode.active = true;
        this._settingNode.setSiblingIndex(this.topLayer());
    }

    protected beforeScrollToMap(x:number, y:number, oldx:number, oldy:number):void {
        let newPoint = new Vec2(x, y);
        let oldPoint = new Vec2(oldx, oldy);
        let dis = Vec2.squaredDistance(newPoint, oldPoint);
        console.log("beforeScrollToMap:", x, y, oldx, oldy, dis);

        if(dis < 360000){
            return;
        }

        if(this._cloudAniNode == null){
            this._cloudAniNode = instantiate(this.cloudAniPrefab);
            this._cloudAniNode.parent = this.contentNode;
        }
        this._cloudAniNode.active = true;
        this._cloudAniNode.setSiblingIndex(this.topLayer());
    }
}