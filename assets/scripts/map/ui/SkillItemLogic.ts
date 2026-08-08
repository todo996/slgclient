import { _decorator, Component, Label, Node, SpriteFrame, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import SkillCommand from '../../skill/SkillCommand';
import { Skill } from '../../skill/SkillProxy';
import SkillIconLogic from './SkillIconLogic';

function ui(): any {
    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;
    if (!bridge) {
        throw new Error('Ancient UI bridge has not been initialized.');
    }
    return bridge;
}


@ccclass('SkillItemLogic')
export default class SkillItemLogic extends Component {
    @property(Label)
    nameLab: Label = null;
    @property(Label)
    limitLab: Label = null;
    @property(Node)
    icon: Node = null;
    @property([SpriteFrame])
    sps: SpriteFrame[] = [];

    _skill: Skill = null;

    protected onEnable(): void {
        this.applyModernCard();
    }

    private applyModernCard(): void {
        ui().localizeNode(this.node);
        ui().suppressLegacyChrome(this.node, 1);
        const transform = this.node.getComponent(UITransform);
        const width = transform && transform.width > 20 ? transform.width : 260;
        const height = transform && transform.height > 20 ? transform.height : 112;
        ui().drawAncientPanel(this.node, width, height, 7);
        this.nameLab.useSystemFont = true;
        this.nameLab.fontFamily = 'Times New Roman';
        this.nameLab.color = ui().ANCIENT_UI.gold;
        this.nameLab.fontSize = 20;
        this.limitLab.useSystemFont = true;
        this.limitLab.fontFamily = 'Arial';
        this.limitLab.color = ui().ANCIENT_UI.muted;
        this.limitLab.fontSize = 15;
    }

    protected updateItem(skill: Skill): void {
        const conf = SkillCommand.getInstance().proxy.getSkillCfg(skill.cfgId);
        this._skill = skill;
        this.nameLab.string = conf.name;
        this.icon.getComponent(SkillIconLogic).setData(skill, null);
        this.limitLab.string = `${this._skill.generals.length}/${conf.limit}`;
    }
}
