import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    Sprite,
    VerticalTextAlignment,
} from 'cc';
const { ccclass, property } = _decorator;

import { SkillConf, SkillOutline } from "../../config/skill/Skill";
import GeneralCommand from "../../general/GeneralCommand";
import { GeneralData } from "../../general/GeneralProxy";
import SkillCommand from "../../skill/SkillCommand";
import { Skill } from "../../skill/SkillProxy";
import SkillIconLogic from "./SkillIconLogic";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { localizeNode } from '../../i18n/I18n';
import {
    createGameText,
    drawGamePanel,
    ensureChild,
    ensureTransform,
    styleGameButton,
} from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

function handlerOf(button: Button): string {
    for (const event of (button.clickEvents as any[]) || []) {
        if (event && typeof event.handler === 'string' && event.handler) {
            return event.handler;
        }
    }
    return '';
}

function findButton(root: Node, handler: string): Button | null {
    return root.getComponentsInChildren(Button)
        .find((button) => handlerOf(button) === handler) || null;
}

function styleRealButton(
    button: Button,
    text: string,
    variant: 'primary' | 'secondary' | 'jade' | 'danger',
    width: number,
): void {
    styleGameButton(button.node, text, variant, width, 54);
    for (const label of button.node.getComponentsInChildren(Label)) {
        if (label.node.name !== '__GameLabel') {
            label.node.active = false;
        }
    }
    const modern = button.node.getChildByName('__GameLabel');
    if (modern) {
        modern.active = true;
        modern.setSiblingIndex(button.node.children.length - 1);
    }
}

function styleInfoValue(label: Label, x: number, y: number, width: number = 220): void {
    label.node.setPosition(x, y, 0);
    ensureTransform(label.node, width, 38);
    label.useSystemFont = true;
    label.fontFamily = GameTheme.typography.bodyFont;
    label.fontSize = 17;
    label.lineHeight = 23;
    label.enableWrapText = false;
    label.overflow = Label.Overflow.SHRINK;
    label.horizontalAlign = HorizontalTextAlignment.LEFT;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.color = GameTheme.colors.ivory;
}

@ccclass('SkillInfoLogic')
export default class SkillInfoLogic extends Component {

    @property(Label)
    nameLab: Label = null;

    @property(Node)
    icon: Node = null;

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
    _skillPos: number = -1;

    protected onEnable(): void {
        localizeNode(this.node);
        this.applyVisualLayout();
        this.learnBtn.node.active = false;
    }

    private applyVisualLayout(): void {
        const panel = this.node.getChildByName('New Node') || this.node.children.find((child) => child.name !== 'mask');
        if (panel) {
            for (const sprite of panel.getComponents(Sprite)) {
                sprite.enabled = false;
            }
            drawGamePanel(panel, 980, 640, 14);
        }

        const header = ensureChild(this.node, '__SkillInfoHeader');
        header.setPosition(0, 302, 0);
        ensureTransform(header, 930, 74);
        const hg = header.getComponent(Graphics) || header.addComponent(Graphics);
        hg.clear();
        hg.fillColor = new Color(12, 10, 9, 240);
        hg.rect(-465, -37, 930, 74);
        hg.fill();
        hg.strokeColor = new Color(176, 124, 59, 225);
        hg.lineWidth = 2;
        hg.moveTo(-465, -35);
        hg.lineTo(465, -35);
        hg.stroke();

        if (this.nameLab) {
            this.nameLab.node.setParent(header);
            this.nameLab.node.setPosition(36, 0, 0);
            ensureTransform(this.nameLab.node, 560, 54);
            this.nameLab.useSystemFont = true;
            this.nameLab.fontFamily = GameTheme.typography.titleFont;
            this.nameLab.fontSize = 32;
            this.nameLab.lineHeight = 40;
            this.nameLab.enableWrapText = false;
            this.nameLab.overflow = Label.Overflow.SHRINK;
            this.nameLab.horizontalAlign = HorizontalTextAlignment.CENTER;
            this.nameLab.verticalAlign = VerticalTextAlignment.CENTER;
            this.nameLab.color = GameTheme.colors.gold300;
        }

        const close = findButton(this.node, 'onClickClose');
        if (close) {
            close.node.setParent(this.node);
            close.node.active = true;
            close.node.setPosition(-474, 302, 0);
            styleRealButton(close, '←', 'secondary', 72);
        }

        if (this.icon) {
            this.icon.setPosition(-350, 151, 0);
            this.icon.setSiblingIndex(this.node.children.length - 1);
        }

        const stats = ensureChild(this.node, '__SkillStats');
        stats.setPosition(91, 151, 0);
        ensureTransform(stats, 590, 170);
        const sg = stats.getComponent(Graphics) || stats.addComponent(Graphics);
        sg.clear();
        sg.fillColor = new Color(27, 22, 18, 240);
        sg.roundRect(-295, -85, 590, 170, 12);
        sg.fill();
        sg.strokeColor = new Color(146, 101, 49, 210);
        sg.lineWidth = 1.5;
        sg.roundRect(-295, -85, 590, 170, 12);
        sg.stroke();

        const captions = [
            ['__TriggerCaption', 'Kích hoạt', -255, 50],
            ['__RateCaption', 'Tỷ lệ', 35, 50],
            ['__TargetCaption', 'Mục tiêu', -255, -22],
            ['__ArmCaption', 'Binh chủng', 35, -22],
        ] as const;
        for (const [name, text, x, y] of captions) {
            const label = createGameText(stats, name, text, 14, GameTheme.colors.muted, 105, 28);
            label.horizontalAlign = HorizontalTextAlignment.LEFT;
            label.node.setPosition(x, y, 0);
        }

        for (const label of [this.triggerLab, this.rateLab, this.targetLab, this.armLab]) {
            if (label) {
                label.node.setParent(stats);
            }
        }
        styleInfoValue(this.triggerLab, -130, 50, 160);
        styleInfoValue(this.rateLab, 155, 50, 120);
        styleInfoValue(this.targetLab, -130, -22, 160);
        styleInfoValue(this.armLab, 155, -22, 120);

        if (this.lvLab) {
            this.lvLab.node.setPosition(-350, 76, 0);
            ensureTransform(this.lvLab.node, 180, 36);
            this.lvLab.useSystemFont = true;
            this.lvLab.fontFamily = GameTheme.typography.bodyFont;
            this.lvLab.fontSize = 17;
            this.lvLab.lineHeight = 23;
            this.lvLab.color = GameTheme.colors.gold300;
        }

        const description = ensureChild(this.node, '__SkillDescriptions');
        description.setPosition(0, -72, 0);
        ensureTransform(description, 850, 240);
        const dg = description.getComponent(Graphics) || description.addComponent(Graphics);
        dg.clear();
        dg.fillColor = new Color(22, 18, 15, 238);
        dg.roundRect(-425, -120, 850, 240, 12);
        dg.fill();
        dg.strokeColor = new Color(133, 93, 47, 195);
        dg.lineWidth = 1.5;
        dg.roundRect(-425, -120, 850, 240, 12);
        dg.stroke();

        const currentCaption = createGameText(description, '__CurrentCaption', 'Hiệu quả hiện tại', 15, GameTheme.colors.gold300, 190, 30);
        currentCaption.horizontalAlign = HorizontalTextAlignment.LEFT;
        currentCaption.node.setPosition(-310, 88, 0);
        const nextCaption = createGameText(description, '__NextCaption', 'Cấp tiếp theo', 15, GameTheme.colors.gold300, 190, 30);
        nextCaption.horizontalAlign = HorizontalTextAlignment.LEFT;
        nextCaption.node.setPosition(-310, -18, 0);

        for (const [label, y] of [[this.curDesLab, 45], [this.nextDesLab, -61]] as Array<[Label, number]>) {
            label.node.setParent(description);
            label.node.setPosition(0, y, 0);
            ensureTransform(label.node, 770, 72);
            label.useSystemFont = true;
            label.fontFamily = GameTheme.typography.bodyFont;
            label.fontSize = 16;
            label.lineHeight = 22;
            label.enableWrapText = true;
            label.overflow = Label.Overflow.SHRINK;
            label.horizontalAlign = HorizontalTextAlignment.LEFT;
            label.verticalAlign = VerticalTextAlignment.CENTER;
            label.color = GameTheme.colors.ivory;
        }

        this.learnBtn.node.setParent(this.node);
        this.learnBtn.node.setPosition(0, -260, 0);
        styleRealButton(this.learnBtn, 'HỌC KỸ NĂNG', 'primary', 260);

        this.lvBtn.node.setParent(this.node);
        this.lvBtn.node.setPosition(-145, -260, 0);
        styleRealButton(this.lvBtn, 'NÂNG CẤP', 'jade', 240);

        this.giveUpBtn.node.setParent(this.node);
        this.giveUpBtn.node.setPosition(145, -260, 0);
        styleRealButton(this.giveUpBtn, 'QUÊN KỸ NĂNG', 'danger', 240);
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    public setData(data: Skill, type: number, general: GeneralData, skillPos: number): void {
        var conf = SkillCommand.getInstance().proxy.getSkillCfg(data.cfgId);
        this.icon.getComponent(SkillIconLogic).setData(data, null);
        var outLine: SkillOutline = SkillCommand.getInstance().proxy.outLine;

        this._cfg = conf;
        this._data = data;
        this._type = type;
        this._general = general;
        this._skillPos = skillPos;

        this.learnBtn.node.active = type == 1;
        this.giveUpBtn.node.active = type == 2;

        this.nameLab.string = conf.name;

        let isShowLv = false;
        let lv = 0;
        if (type == 2) {
            for (let index = 0; index < general.skills.length; index++) {
                const gskill = general.skills[index];
                if (gskill && gskill.cfgId == data.cfgId && gskill.lv <= conf.levels.length) {
                    isShowLv = true;
                    lv = gskill.lv;
                    break;
                }
            }
        }

        this.lvBtn.node.active = isShowLv;
        if (isShowLv) {
            this.lvLab.string = "Cấp: " + lv;
        } else {
            this.lvLab.string = "";
        }

        this.triggerLab.string = outLine.trigger_type.list[conf.trigger - 1].des;
        this.rateLab.string = conf.levels[0].probability + "%";
        this.targetLab.string = outLine.target_type.list[conf.target - 1].des;
        this.armLab.string = this.armstr(conf.arms);

        var des1 = conf.des;
        for (let index = 0; index < conf.levels[0].effect_value.length; index++) {
            var str = conf.levels[0].effect_value[index] + "";
            des1 = des1.replace("%n%", str);
        }
        this.curDesLab.string = des1;

        var des2 = conf.des;
        for (let index = 0; index < conf.levels[1].effect_value.length; index++) {
            var str = conf.levels[1].effect_value[index] + "";
            des2 = des2.replace("%n%", str);
        }
        this.nextDesLab.string = des2;
    }

    protected armstr(arms: number[]): string {
        var str = "";
        if (arms.indexOf(1) >= 0 || arms.indexOf(4) >= 0 || arms.indexOf(7) >= 0) {
            str += "Bộ";
        }
        if (arms.indexOf(2) >= 0 || arms.indexOf(5) >= 0 || arms.indexOf(8) >= 0) {
            str += " Cung";
        }
        if (arms.indexOf(3) >= 0 || arms.indexOf(6) >= 0 || arms.indexOf(9) >= 0) {
            str += " Kỵ";
        }
        return str.trim();
    }

    protected onClickLearn(): void {
        AudioManager.instance.playClick();
        if (this._general) {
            GeneralCommand.getInstance().upSkill(this._general.id, this._cfg.cfgId, this._skillPos);
            this.node.active = false;
            EventMgr.emit(LogicEvent.closeSkill);
        }
    }

    protected onClickLv(): void {
        AudioManager.instance.playClick();
        if (this._general) {
            GeneralCommand.getInstance().lvSkill(this._general.id, this._skillPos);
            this.node.active = false;
            EventMgr.emit(LogicEvent.closeSkill);
        }
    }

    protected onClickForget(): void {
        AudioManager.instance.playClick();
        if (this._general) {
            GeneralCommand.getInstance().downSkill(this._general.id, this._cfg.cfgId, this._skillPos);
            this.node.active = false;
            EventMgr.emit(LogicEvent.closeSkill);
        }
    }
}
