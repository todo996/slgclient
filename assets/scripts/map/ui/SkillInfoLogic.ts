import { _decorator, Button, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { SkillConf, SkillOutline } from '../../config/skill/Skill';
import GeneralCommand from '../../general/GeneralCommand';
import { GeneralData } from '../../general/GeneralProxy';
import SkillCommand from '../../skill/SkillCommand';
import { Skill } from '../../skill/SkillProxy';
import { EventMgr } from '../../utils/EventMgr';
import SkillIconLogic from './SkillIconLogic';

function ui(): any {
    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;
    if (!bridge) {
        throw new Error('Ancient UI bridge has not been initialized.');
    }
    return bridge;
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
    _type = 0;
    _skillPos = -1;

    protected onEnable(): void {
        this.learnBtn.node.active = false;
        this.applyModernSkillInfo();
    }

    private applyModernSkillInfo(): void {
        ui().applyAncientScreenChrome(this.node, 'Kỹ năng');
        const body = ui().ensureUiChild(this.node, '__SkillInfoBody');
        body.setPosition(0, -8, 0);
        body.setSiblingIndex(0);
        ui().drawAncientPanel(body, 1160, 560, 10);

        const labels = [
            this.nameLab,
            this.lvLab,
            this.triggerLab,
            this.targetLab,
            this.armLab,
            this.rateLab,
            this.curDesLab,
            this.nextDesLab,
        ];
        for (const label of labels) {
            if (!label) {
                continue;
            }
            label.useSystemFont = true;
            label.fontFamily = 'Arial';
            label.color = ui().ANCIENT_UI.text;
        }
        if (this.nameLab) {
            this.nameLab.fontFamily = 'Times New Roman';
            this.nameLab.color = ui().ANCIENT_UI.gold;
            this.nameLab.fontSize = 28;
        }
        if (this.lvLab) {
            this.lvLab.color = ui().ANCIENT_UI.goldSoft;
        }
        if (this.curDesLab) {
            this.curDesLab.color = ui().ANCIENT_UI.text;
        }
        if (this.nextDesLab) {
            this.nextDesLab.color = ui().ANCIENT_UI.success;
        }

        if (this.learnBtn) {
            ui().styleAncientButton(this.learnBtn.node, 'Học kỹ năng', 'jade', 190, 52);
        }
        if (this.lvBtn) {
            ui().styleAncientButton(this.lvBtn.node, 'Nâng cấp', 'gold', 180, 52);
        }
        if (this.giveUpBtn) {
            ui().styleAncientButton(this.giveUpBtn.node, 'Đổi kỹ năng', 'red', 190, 52);
        }
        const close = ui().findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            ui().styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    public setData(data: Skill, type: number, general: GeneralData, skillPos: number): void {
        const conf = SkillCommand.getInstance().proxy.getSkillCfg(data.cfgId);
        this.icon.getComponent(SkillIconLogic).setData(data, null);
        const outLine: SkillOutline = SkillCommand.getInstance().proxy.outLine;

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
            for (let index = 0; index < general.skills.length; index += 1) {
                const gskill = general.skills[index];
                if (gskill && gskill.cfgId == data.cfgId && gskill.lv <= conf.levels.length) {
                    isShowLv = true;
                    lv = gskill.lv;
                    break;
                }
            }
        }

        this.lvBtn.node.active = isShowLv;
        this.lvLab.string = isShowLv ? `Cấp ${lv}` : '';
        this.triggerLab.string = outLine.trigger_type.list[conf.trigger - 1].des;
        this.rateLab.string = `${conf.levels[0].probability}%`;
        this.targetLab.string = outLine.target_type.list[conf.target - 1].des;
        this.armLab.string = this.armstr(conf.arms);

        let des1 = conf.des;
        for (let index = 0; index < conf.levels[0].effect_value.length; index += 1) {
            des1 = des1.replace('%n%', `${conf.levels[0].effect_value[index]}`);
        }
        this.curDesLab.string = des1;

        let des2 = conf.des;
        if (conf.levels.length > 1) {
            for (let index = 0; index < conf.levels[1].effect_value.length; index += 1) {
                des2 = des2.replace('%n%', `${conf.levels[1].effect_value[index]}`);
            }
        }
        this.nextDesLab.string = des2;
    }

    protected armstr(arms: number[]): string {
        const parts: string[] = [];
        if (arms.indexOf(1) >= 0 || arms.indexOf(4) >= 0 || arms.indexOf(7) >= 0) {
            parts.push('Bộ');
        }
        if (arms.indexOf(2) >= 0 || arms.indexOf(5) >= 0 || arms.indexOf(8) >= 0) {
            parts.push('Cung');
        }
        if (arms.indexOf(3) >= 0 || arms.indexOf(6) >= 0 || arms.indexOf(9) >= 0) {
            parts.push('Kỵ');
        }
        return parts.join(' · ');
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
