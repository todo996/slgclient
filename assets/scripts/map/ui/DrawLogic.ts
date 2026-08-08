import { _decorator, Button, Color, Component, Graphics, Label, Node, Sprite, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import GeneralCommand from "../../general/GeneralCommand";
import { GeneralCommonConfig } from "../../general/GeneralProxy";
import LoginCommand from "../../login/LoginCommand";
import MapUICommand from "./MapUICommand";
import GeneralHeadLogic from "./GeneralHeadLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('DrawLogic')
export default class DrawLogic extends Component {

    @property(Label)
    labelOnce: Label = null;

    @property(Label)
    labelTen: Label = null;

    @property(Label)
    cntLab: Label = null;

    private _referenceBuilt = false;

    protected onEnable():void{
        if (!this._referenceBuilt) {
            this.buildReferenceDrawUI();
        }
        EventMgr.on(LogicEvent.upateMyRoleRes, this.updateRoleRes, this);
        EventMgr.on(LogicEvent.updateMyGenerals, this.updateRoleRes, this);
        this.updateRoleRes();
    }

    protected onDisable():void{
        EventMgr.targetOff(this);
    }

    /** Chiêu mộ mới theo bố cục ảnh mẫu, dùng ảnh tướng thật trong resources. */
    private buildReferenceDrawUI(): void {
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceDrawUI');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);

        this.makePanel(root, 'Backdrop', 1280, 720, 0, 0, new Color(12, 9, 7, 250), new Color(70, 45, 25, 255), 1, 0);
        this.makePanel(root, 'TopBand', 1240, 70, 0, 315, new Color(24, 17, 12, 250), new Color(164, 116, 56, 255), 2, 8);
        this.makeLabel(root, 'Title', 'CHIÊU MỘ DANH TƯỚNG', -430, 315, 30, new Color(235, 196, 116, 255), true, 390);
        this.makeButton(root, 'Close', 'ĐÓNG', 550, 315, 100, 40, () => this.onClickClose(), false, 14);

        const eventPanel = this.makePanel(root, 'EventPanel', 292, 570, -470, -2, new Color(23, 16, 11, 246), new Color(139, 96, 48, 255), 2, 10);
        this.makeLabel(eventPanel, 'EventKicker', 'CHIÊU MỘ DANH TƯỚNG', 0, 220, 14, new Color(174, 145, 100, 255), true, 250);
        this.makeLabel(eventPanel, 'EventName', 'KẾT NGHĨA\nTAM ANH', 0, 151, 31, new Color(239, 199, 119, 255), true, 250);
        this.makePanel(eventPanel, 'EventDivider', 220, 2, 0, 88, new Color(151, 105, 51, 255), new Color(0, 0, 0, 0), 0, 0);
        this.makeLabel(eventPanel, 'EventBody', 'Quan Vũ · Lưu Bị · Trương Phi\nDanh tướng Thục hội tụ', 0, 38, 15, new Color(196, 177, 145, 255), false, 245);
        this.makeLabel(eventPanel, 'OwnedText', 'SỐ TƯỚNG ĐÃ SỞ HỮU', 0, -140, 13, new Color(144, 124, 94, 255), true, 230);

        this.cntLab.node.parent = eventPanel;
        this.cntLab.node.active = true;
        this.cntLab.node.setPosition(0, -178, 0);
        this.styleLabel(this.cntLab, 22, new Color(239, 210, 147, 255), true, 230);

        // Artwork thật: GeneralHeadLogic nạp đúng ảnh card của ba tướng từ resources.
        const artStage = this.makePanel(root, 'ArtStage', 620, 570, -10, -2, new Color(16, 12, 9, 238), new Color(91, 62, 33, 255), 1, 10);
        this.makeHeroPortrait(artStage, 100026, 'QUAN VŨ', -190, 0, 0.92);
        this.makeHeroPortrait(artStage, 100016, 'LƯU BỊ', 0, 18, 1.03);
        this.makeHeroPortrait(artStage, 100022, 'TRƯƠNG PHI', 190, 0, 0.92);

        const actionPanel = this.makePanel(root, 'ActionPanel', 286, 570, 478, -2, new Color(23, 16, 11, 246), new Color(139, 96, 48, 255), 2, 10);
        this.makeLabel(actionPanel, 'ActionTitle', 'CHIÊU MỘ', 0, 221, 24, new Color(232, 194, 118, 255), true, 240);
        this.makeLabel(actionPanel, 'CurrencyTitle', 'Dùng Vàng', 0, 178, 14, new Color(155, 135, 104, 255), false, 220);

        this.labelOnce.node.parent = actionPanel;
        this.labelOnce.node.active = true;
        this.labelOnce.node.setPosition(0, 88, 0);
        this.styleLabel(this.labelOnce, 15, new Color(215, 193, 153, 255), true, 240);
        this.makeButton(actionPanel, 'DrawOnce', 'CHIÊU MỘ ×1', 0, 35, 230, 58, () => this.drawGeneralOnce(), true, 18);

        this.labelTen.node.parent = actionPanel;
        this.labelTen.node.active = true;
        this.labelTen.node.setPosition(0, -73, 0);
        this.styleLabel(this.labelTen, 15, new Color(215, 193, 153, 255), true, 240);
        this.makeButton(actionPanel, 'DrawTen', 'CHIÊU MỘ ×10', 0, -126, 230, 58, () => this.drawGeneralTen(), true, 18);
        this.makeLabel(actionPanel, 'RealActionNote', 'Kết quả lấy trực tiếp từ máy chủ', 0, -212, 12, new Color(128, 112, 87, 255), false, 240);

        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== root) child.active = false;
        });
    }

    private makeHeroPortrait(parent: Node, cfgId: number, title: string, x: number, y: number, scale: number): void {
        const holder = this.makePanel(parent, `Hero_${cfgId}`, 190, 430, x, y, new Color(9, 8, 7, 255), new Color(151, 105, 51, 255), 2, 8);
        const portrait = new Node(`Portrait_${cfgId}`);
        portrait.parent = holder;
        portrait.layer = this.node.layer;
        portrait.setPosition(0, 25, 0);
        portrait.setScale(scale, scale, 1);
        portrait.addComponent(UITransform).setContentSize(180, 356);
        portrait.addComponent(Sprite);
        portrait.addComponent(GeneralHeadLogic).setHeadId(cfgId);
        this.makePanel(holder, 'NameBand', 178, 46, 0, -187, new Color(27, 18, 12, 248), new Color(112, 76, 38, 255), 1, 5);
        this.makeLabel(holder, 'HeroName', title, 0, -187, 17, new Color(239, 205, 135, 255), true, 170);
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected updateRoleRes():void{
        const commonCfg: GeneralCommonConfig = GeneralCommand.getInstance().proxy.getCommonCfg();
        const roleResData = LoginCommand.getInstance().proxy.getRoleResData();
        this.labelOnce.string = "Chi phí: "+commonCfg.draw_general_cost +" / Vàng " + roleResData.gold;
        this.labelTen.string = "Chi phí: "+commonCfg.draw_general_cost * 10 +" / Vàng " + roleResData.gold;

        const basic = MapUICommand.getInstance().proxy.getBasicGeneral();
        const cnt = GeneralCommand.getInstance().proxy.getMyActiveGeneralCnt();
        this.cntLab.string = cnt + " / " + basic.limit;
    }

    protected drawGeneralOnce():void{
        AudioManager.instance.playClick();
        GeneralCommand.getInstance().drawGenerals();
        EventMgr.emit(LogicEvent.showWaiting);
    }

    protected drawGeneralTen():void{
        AudioManager.instance.playClick();
        GeneralCommand.getInstance().drawGenerals(10);
        EventMgr.emit(LogicEvent.showWaiting);
    }

    private styleLabel(label: Label, fontSize: number, tint: Color, bold: boolean, width: number): void {
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = tint;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        const transform = label.node.getComponent(UITransform);
        if (transform) transform.setContentSize(width, fontSize + 16);
    }

    private makePanel(parent: Node, name: string, width: number, height: number, x: number, y: number, fill: Color, stroke: Color, lineWidth: number, radius: number): Node {
        const node = new Node(name);
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, height);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = fill;
        graphics.strokeColor = stroke;
        graphics.lineWidth = lineWidth;
        if (radius > 0) graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        else graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fill();
        if (lineWidth > 0 && stroke.a > 0) graphics.stroke();
        return node;
    }

    private makeLabel(parent: Node, name: string, text: string, x: number, y: number, fontSize: number, tint: Color, bold: boolean, width: number): Label {
        const node = new Node(name);
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, Math.max(30, fontSize * 2 + 8));
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 7;
        label.color = tint;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }

    private makeButton(parent: Node, name: string, text: string, x: number, y: number, width: number, height: number, callback: () => void, primary: boolean, fontSize: number): Node {
        const node = this.makePanel(parent, name, width, height, x, y, primary ? new Color(107, 68, 28, 255) : new Color(28, 20, 14, 248), primary ? new Color(231, 187, 97, 255) : new Color(119, 84, 43, 255), 2, 7);
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        node.on(Button.EventType.CLICK, callback, this);
        this.makeLabel(node, `${name}_label`, text, 0, 0, fontSize, new Color(241, 217, 169, 255), true, width - 10);
        return node;
    }
}