import { _decorator, Button, Color, Component, Graphics, Label, Node, ScrollView, UITransform } from 'cc';
const {ccclass, property} = _decorator;

import { GeneralData } from "../../general/GeneralProxy";
import SkillCommand from "../../skill/SkillCommand";
import { Skill } from "../../skill/SkillProxy";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import ListLogic from '../../utils/ListLogic';
import { LogicEvent } from '../../common/LogicEvent';

@ccclass('SkillLogic')
export default class SkillLogic extends Component {

    @property(ScrollView)
    scrollView: ScrollView = null;

    _general: GeneralData = null;
    _type: number = 0;
    _skillPos : number = -1;
    private _referenceBuilt = false;

    protected onEnable():void{
        if (!this._referenceBuilt) {
            this.buildReferenceSkillUI();
        }
        EventMgr.on(LogicEvent.skillListInfo, this.onSkillList, this);
        SkillCommand.getInstance().qrySkillList();
    }

    protected onDisable():void {
        EventMgr.targetOff(this)
    }

    private buildReferenceSkillUI():void{
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceSkillUI');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);
        this.makePanel(root, 'Backdrop', 1280, 720, 0, 0, new Color(11, 9, 8, 251), new Color(64, 43, 24, 255), 1, 0);
        this.makePanel(root, 'Header', 1240, 70, 0, 315, new Color(23, 16, 11, 252), new Color(164, 116, 56, 255), 2, 8);
        this.makeLabel(root, 'Title', 'KỸ NĂNG', -488, 315, 30, new Color(235, 196, 116, 255), true, 220);
        this.makeLabel(root, 'Subtitle', 'Binh pháp · Chiến pháp · Truyền thừa', -250, 315, 14, new Color(149, 130, 100, 255), false, 330);
        this.makeButton(root, 'Close', 'ĐÓNG', 550, 315, 100, 40, () => this.onClickClose(), false, 14);

        const listPanel = this.makePanel(root, 'SkillListPanel', 430, 570, -395, -4, new Color(20, 15, 11, 248), new Color(120, 84, 43, 255), 2, 9);
        this.makeLabel(listPanel, 'ListTitle', 'DANH SÁCH KỸ NĂNG', 0, 244, 15, new Color(183, 154, 104, 255), true, 300);
        this.scrollView.node.parent = listPanel;
        this.scrollView.node.active = true;
        this.scrollView.node.setPosition(0, -28, 0);
        const scrollTransform = this.scrollView.node.getComponent(UITransform);
        if (scrollTransform) scrollTransform.setContentSize(398, 490);

        const detail = this.makePanel(root, 'SkillDetailPlaceholder', 760, 570, 220, -4, new Color(15, 12, 10, 244), new Color(94, 65, 35, 255), 2, 9);
        this.makeLabel(detail, 'DetailTitle', 'CHI TIẾT KỸ NĂNG', 0, 214, 20, new Color(190, 159, 105, 255), true, 330);
        this.makeLabel(detail, 'Hint', 'Chọn một kỹ năng bên trái\nđể xem hiệu quả và thao tác.', 0, 12, 17, new Color(123, 108, 86, 255), false, 450);

        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== root) child.active = false;
        });
    }

    protected onSkillList(){
        const skills = SkillCommand.getInstance().proxy.skills;
        const skillConfs = SkillCommand.getInstance().proxy.skillConfs;
        const arr = [];
        for (let i = 0; i < skillConfs.length; i++) {
            let found = false;
            const cfg = skillConfs[i];
            const dSkill = new Skill();
            dSkill.cfgId = cfg.cfgId;
            dSkill.generals = [];
            for (let j = 0; j < skills.length; j++) {
                const skill = skills[j];
                if (skill.cfgId == cfg.cfgId){
                    found = true;
                    arr.push(skill);
                    break;
                }
            }
            if(!found){
                arr.push(dSkill);
            }
        }
        const comp = this.scrollView.node.getComponent(ListLogic);
        comp.setData(arr);
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected onClickItem(data: Skill, target): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.openSkillInfo, data, this._type, this._general, this._skillPos);
    }

    /** type:0 xem thường, type:1 học, type:2 xem kỹ năng võ tướng */
    public setData(type:number, general:GeneralData, skillPos: number) {
        this._type = type;
        this._general = general;
        this._skillPos = skillPos;
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
        node.addComponent(UITransform).setContentSize(width, Math.max(30, fontSize * 2 + 4));
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
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