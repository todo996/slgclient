import { _decorator, Component, ScrollView } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { GeneralData } from '../../general/GeneralProxy';
import {
    applyAncientScreenChrome,
    ensureUiTransform,
    findButtonByHandler,
    styleAncientButton,
} from '../../i18n/I18n';
import SkillCommand from '../../skill/SkillCommand';
import { Skill } from '../../skill/SkillProxy';
import { EventMgr } from '../../utils/EventMgr';
import ListLogic from '../../utils/ListLogic';

@ccclass('SkillLogic')
export default class SkillLogic extends Component {
    @property(ScrollView)
    scrollView: ScrollView = null;

    _general: GeneralData = null;
    _type = 0;
    _skillPos = -1;

    protected onEnable(): void {
        this.applyModernSkillList();
        EventMgr.on(LogicEvent.skillListInfo, this.onSkillList, this);
        SkillCommand.getInstance().qrySkillList();
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    private applyModernSkillList(): void {
        applyAncientScreenChrome(this.node, 'Kỹ năng');
        this.scrollView.node.setPosition(0, -10, 0);
        ensureUiTransform(this.scrollView.node, 1120, 520);
        const view = this.scrollView.node.getChildByName('view') || this.scrollView.node.getChildByName('View');
        if (view) {
            ensureUiTransform(view, 1120, 520);
        }
        if (this.scrollView.content) {
            ensureUiTransform(this.scrollView.content, 1120, 520);
        }

        const close = findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    protected onSkillList(): void {
        const skills = SkillCommand.getInstance().proxy.skills;
        const skillConfs = SkillCommand.getInstance().proxy.skillConfs;
        const arr: Skill[] = [];
        for (let i = 0; i < skillConfs.length; i += 1) {
            let found = false;
            const cfg = skillConfs[i];
            const dSkill = new Skill();
            dSkill.cfgId = cfg.cfgId;
            dSkill.generals = [];

            for (let j = 0; j < skills.length; j += 1) {
                const skill = skills[j];
                if (skill.cfgId == cfg.cfgId) {
                    found = true;
                    arr.push(skill);
                    break;
                }
            }
            if (!found) {
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

    protected onClickItem(data: Skill, target: any): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.openSkillInfo, data, this._type, this._general, this._skillPos);
    }

    public setData(type: number, general: GeneralData, skillPos: number): void {
        this._type = type;
        this._general = general;
        this._skillPos = skillPos;
    }
}
