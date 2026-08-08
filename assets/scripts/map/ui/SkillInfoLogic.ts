import { _decorator, Button, Color, Component, Graphics, Label, Node, UITransform } from 'cc';
const {ccclass, property} = _decorator;

import { SkillConf, SkillOutline } from "../../config/skill/Skill";
import GeneralCommand from "../../general/GeneralCommand";
import { GeneralData } from "../../general/GeneralProxy";
import SkillCommand from "../../skill/SkillCommand";
import { Skill } from "../../skill/SkillProxy";
import SkillIconLogic from "./SkillIconLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('SkillInfoLogic')
export default class SkillInfoLogic extends Component {

    @property(Label)
    nameLab: Label = null;

    @property(Node)
    icon:Node = null;

    @property(Label)
    lvLab: Label = null;

    @property(Label)
    triggerLab: Label = null;

    @property(Label)
    targetLab: Label = null;

    @property(Label)
    armLab: Label = null;

    @property(Label)
    rateLab: Label = null;

    @property(Label)
    curDesLab: Label = null;

    @property(Label)
    nextDesLab: Label = null;

    @property(Button)
    learnBtn: Button = null;

    @property(Button)
    lvBtn: Button = null;

    @property(Button)
    giveUpBtn: Button = null;

    _data: Skill = null;
    _cfg: SkillConf = null;
    _general: GeneralData = null;
    _type: number = 0;
    _skillPos : number = -1;

    private _referenceBuilt = false;
    private _learnAction: Node = null;
    private _levelAction: Node = null;
    private _forgetAction: Node = null;

    protected onLoad():void {
        this.buildReferenceSkillDetail();
    }

    protected onEnable() {
        if (this.learnBtn) this.learnBtn.node.active = false;
    }

    private buildReferenceSkillDetail():void{
        if (this._referenceBuilt) return;
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceSkillDetail');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.setPosition(220, -4, 0);
        root.addComponent(UITransform).setContentSize(760, 570);
        this.makePanel(root, 'Backdrop', 760, 570, 0, 0, new Color(17, 13, 10, 253), new Color(157, 109, 54, 255), 3, 9);
        this.makeLabel(root, 'Title', 'CHI TIẾT KỸ NĂNG', -210, 245, 20, new Color(231, 192, 115, 255), true, 300);
        this.makeButton(root, 'Close', 'ĐÓNG', 310, 246, 92, 36, () => this.onClickClose(), false, 12);

        const iconFrame = this.makePanel(root, 'IconFrame', 136, 136, -270, 142, new Color(12, 10, 8, 255), new Color(184, 132, 64, 255), 3, 9);
        this.icon.parent = iconFrame;
        this.icon.active = true;
        this.icon.setPosition(0, 0, 0);
        const iconTransform = this.icon.getComponent(UITransform);
        if (iconTransform) iconTransform.setContentSize(122, 122);

        this.nameLab.node.parent = root;
        this.nameLab.node.active = true;
        this.nameLab.node.setPosition(5, 183, 0);
        this.styleLabel(this.nameLab, 27, new Color(238, 202, 126, 255), true, 390);

        this.lvLab.node.parent = root;
        this.lvLab.node.active = true;
        this.lvLab.node.setPosition(5, 144, 0);
        this.styleLabel(this.lvLab, 15, new Color(180, 155, 111, 255), true, 390);

        const stats = this.makePanel(root, 'Stats', 470, 92, 105, 77, new Color(24, 18, 13, 247), new Color(88, 61, 34, 255), 1, 7);
        this.moveAndStyle(this.triggerLab, stats, -150, 20, 13, 145);
        this.moveAndStyle(this.rateLab, stats, 0, 20, 13, 125);
        this.moveAndStyle(this.targetLab, stats, 150, 20, 13, 145);
        this.moveAndStyle(this.armLab, stats, 0, -22, 13, 390);

        const description = this.makePanel(root, 'Description', 700, 220, 0, -78, new Color(14, 11, 9, 246), new Color(91, 63, 35, 255), 1, 7);
        this.makeLabel(description, 'CurrentTitle', 'HIỆU QUẢ HIỆN TẠI', -215, 78, 12, new Color(153, 132, 97, 255), true, 220);
        this.curDesLab.node.parent = description;
        this.curDesLab.node.active = true;
        this.curDesLab.node.setPosition(0, 30, 0);
        this.styleParagraph(this.curDesLab, 15, new Color(225, 207, 173, 255), 650, 72);
        this.makeLabel(description, 'NextTitle', 'CẤP TIẾP THEO', -230, -30, 12, new Color(153, 132, 97, 255), true, 190);
        this.nextDesLab.node.parent = description;
        this.nextDesLab.node.active = true;
        this.nextDesLab.node.setPosition(0, -72, 0);
        this.styleParagraph(this.nextDesLab, 14, new Color(186, 164, 126, 255), 650, 68);

        this._learnAction = this.makeButton(root, 'Learn', 'HỌC KỸ NĂNG', -190, -245, 180, 44, () => this.onClickLearn(), true, 14);
        this._levelAction = this.makeButton(root, 'Level', 'NÂNG CẤP', 0, -245, 170, 44, () => this.onClickLv(), true, 14);
        this._forgetAction = this.makeButton(root, 'Forget', 'QUÊN KỸ NĂNG', 190, -245, 180, 44, () => this.onClickForget(), false, 13);
        this._learnAction.active = this._levelAction.active = this._forgetAction.active = false;

        if (this.learnBtn) this.learnBtn.node.active = false;
        if (this.lvBtn) this.lvBtn.node.active = false;
        if (this.giveUpBtn) this.giveUpBtn.node.active = false;
        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== root) child.active = false;
        });
    }

    private moveAndStyle(label: Label, parent: Node, x: number, y: number, fontSize: number, width: number):void{
        label.node.parent = parent;
        label.node.active = true;
        label.node.setPosition(x, y, 0);
        this.styleLabel(label, fontSize, new Color(206, 183, 143, 255), true, width);
    }

    private styleLabel(label: Label, fontSize: number, tint: Color, bold: boolean, width: number):void{
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 5;
        label.color = tint;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        const transform = label.node.getComponent(UITransform);
        if (transform) transform.setContentSize(width, fontSize + 14);
    }

    private styleParagraph(label: Label, fontSize: number, tint: Color, width: number, height: number):void{
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 7;
        label.color = tint;
        label.isBold = false;
        label.horizontalAlign = Label.HorizontalAlign.LEFT;
        label.verticalAlign = Label.VerticalAlign.TOP;
        label.overflow = Label.Overflow.CLAMP;
        label.enableWrapText = true;
        const transform = label.node.getComponent(UITransform);
        if (transform) transform.setContentSize(width, height);
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    public setData(data: Skill, type:number, general:GeneralData, skillPos: number) {
        const conf = SkillCommand.getInstance().proxy.getSkillCfg(data.cfgId);
        this.icon.getComponent(SkillIconLogic).setData(data, null);
        const outLine: SkillOutline = SkillCommand.getInstance().proxy.outLine;

        this._cfg = conf;
        this._data = data;
        this._type = type;
        this._general = general;
        this._skillPos = skillPos;

        let isShowLv = false;
        let lv = 0;
        if(type == 2 && general){
            for (let index = 0; index < general.skills.length; index++) {
                const gskill = general.skills[index];
                if (gskill && gskill.cfgId == data.cfgId && gskill.lv <= conf.levels.length){
                    isShowLv = true;
                    lv = gskill.lv;
                    break;
                }
            }
        }

        this._learnAction.active = type == 1;
        this._forgetAction.active = type == 2;
        this._levelAction.active = isShowLv;
        this.nameLab.string = conf.name;
        this.lvLab.string = isShowLv ? "Cấp " + lv : "";

        this.triggerLab.string = outLine.trigger_type.list[conf.trigger-1].des;
        this.rateLab.string = conf.levels[0].probability + "%";
        this.targetLab.string = outLine.target_type.list[conf.target-1].des;
        this.armLab.string = this.armstr(conf.arms);

        let des1 = conf.des;
        for (let index = 0; index < conf.levels[0].effect_value.length; index++) {
            des1 = des1.replace("%n%", conf.levels[0].effect_value[index] + "");
        }
        this.curDesLab.string = des1;

        const nextLevel = conf.levels[Math.min(1, conf.levels.length - 1)];
        let des2 = conf.des;
        for (let index = 0; index < nextLevel.effect_value.length; index++) {
            des2 = des2.replace("%n%", nextLevel.effect_value[index] + "");
        }
        this.nextDesLab.string = des2;
    }

    protected armstr(arms:number []): string{
        const names = [];
        if(arms.indexOf(1)>=0 || arms.indexOf(4)>=0 || arms.indexOf(7)>=0) names.push("Bộ");
        if(arms.indexOf(2)>=0 || arms.indexOf(5)>=0 || arms.indexOf(8)>=0) names.push("Cung");
        if(arms.indexOf(3)>=0 || arms.indexOf(6)>=0 || arms.indexOf(9)>=0) names.push("Kỵ");
        return names.join(" · ");
    }

    protected onClickLearn():void {
        AudioManager.instance.playClick();
        if(this._general){
            GeneralCommand.getInstance().upSkill(this._general.id, this._cfg.cfgId, this._skillPos);
            this.node.active = false;
            EventMgr.emit(LogicEvent.closeSkill);
        }
    }

    protected onClickLv():void {
        AudioManager.instance.playClick();
        if(this._general){
            GeneralCommand.getInstance().lvSkill(this._general.id, this._skillPos);
            this.node.active = false;
            EventMgr.emit(LogicEvent.closeSkill);
        }
    }

    protected onClickForget():void {
        AudioManager.instance.playClick();
        if(this._general){
            GeneralCommand.getInstance().downSkill(this._general.id, this._cfg.cfgId, this._skillPos);
            this.node.active = false;
            EventMgr.emit(LogicEvent.closeSkill);
        }
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
        node.addComponent(UITransform).setContentSize(width, fontSize + 14);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 5;
        label.color = tint;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }

    private makeButton(parent: Node, name: string, text: string, x: number, y: number, width: number, height: number, callback: () => void, primary: boolean, fontSize: number): Node {
        const node = this.makePanel(parent, name, width, height, x, y, primary ? new Color(105, 68, 29, 255) : new Color(28, 20, 14, 248), primary ? new Color(231, 187, 97, 255) : new Color(119, 84, 43, 255), 2, 7);
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        node.on(Button.EventType.CLICK, callback, this);
        this.makeLabel(node, `${name}_label`, text, 0, 0, fontSize, new Color(232, 210, 170, 255), true, width - 10);
        return node;
    }
}