import { _decorator, Component, RichText, Label, UITransform, Node } from 'cc';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { SkillEffectType } from '../../config/skill/Skill';
const { ccclass, property } = _decorator;

import GeneralCommand from "../../general/GeneralCommand";
import { GeneralConfig, GeneralData } from '../../general/GeneralProxy';
import SkillCommand from '../../skill/SkillCommand';
import { EventMgr } from '../../utils/EventMgr';
import { WarReport, WarReportRound, WarReportSkill } from "./MapUIProxy";

export class GeneralDataX {
    gdata: GeneralData;
    gcfg: GeneralConfig;
    isAttack: boolean;
}

@ccclass('WarReportDesItemLogic')
export default class WarReportDesItemLogic extends Component {

    private _reportRound: WarReportRound = null;

    @property(RichText)
    warLab: RichText = null;

    @property(Label)
    roundsLabel: Label = null;

    @property(Label)
    endLab: Label = null;

    @property(Node)
    cNode: Node = null;

    warReport: WarReport = null;

    attColor: string = "<color=#ff0000>";
    denColor: string = "<color=#00ff00>";
    skillColor: string = "<color=#FD6500>";
    lossColor: string = "<color=#F2C420>";
    endColor: string = "</color>";
    attstr: string = "Công";
    denStr: string = "Thủ";

    public setData(data: WarReportRound, warReport: WarReport, isEnd: boolean): void {
        this._reportRound = data;
        this.warReport = warReport;
        this.endLab.node.active = false;
        this.warLab.string = "";
        this.roundsLabel.string = `Hiệp ${this._reportRound.round} · Lượt ${this._reportRound.turn}`;

        const beforeSkillText = this.skillString(data.attackBefore);
        this.warLab.string = beforeSkillText;

        if (this._reportRound.attack && this._reportRound.defense) {
            if (this.warLab.string.length > 0) {
                this.warLab.string += "\n";
            }

            const attackConfig = GeneralCommand.getInstance().proxy.getGeneralCfg(this._reportRound.attack.cfgId);
            const defenseConfig = GeneralCommand.getInstance().proxy.getGeneralCfg(this._reportRound.defense.cfgId);

            if (data.isAttack) {
                const attackerName = this.nameString(true, attackConfig, this._reportRound.attack);
                const defenderName = this.nameString(false, defenseConfig, this._reportRound.defense);
                this.warLab.string += this.attackDescription(
                    this.attColor,
                    attackerName,
                    this.denColor,
                    defenderName,
                    this._reportRound.defenseLoss,
                );
            } else {
                const attackerName = this.nameString(false, defenseConfig, this._reportRound.defense);
                const defenderName = this.nameString(true, attackConfig, this._reportRound.attack);
                this.warLab.string += this.attackDescription(
                    this.denColor,
                    attackerName,
                    this.attColor,
                    defenderName,
                    this._reportRound.defenseLoss,
                );
            }
        }

        const attackAfterText = this.skillString(data.attackAfter);
        if (attackAfterText.length > 0) {
            this.warLab.string += `\n${attackAfterText}`;
        }

        const defenseAfterText = this.skillString(data.defenseAfter);
        if (defenseAfterText.length > 0) {
            this.warLab.string += `\n${defenseAfterText}`;
        }

        this.cNode.getComponent(UITransform).height = this.warLab.getComponent(UITransform).height;
        if (isEnd) {
            this.endLab.node.active = true;
            this.endLab.string = this.battleResultText();
            this.cNode.getComponent(UITransform).height =
                this.warLab.getComponent(UITransform).height
                + this.endLab.getComponent(UITransform).height
                + 20;
        }

        this.node.getComponent(UITransform).height = this.cNode.getComponent(UITransform).height + 40;
    }

    private attackDescription(
        attackerColor: string,
        attackerName: string,
        defenderColor: string,
        defenderName: string,
        loss: number,
    ): string {
        return `${attackerColor}${attackerName}${this.endColor} tấn công `
            + `${defenderColor}${defenderName}${this.endColor}, khiến `
            + `${defenderColor}${defenderName}${this.endColor} mất `
            + `${this.lossColor}${loss}${this.endColor} binh lính.`;
    }

    private battleResultText(): string {
        if (this.warReport.result === 0) {
            return "Binh lực chủ tướng phe ta đã cạn. Trận chiến thất bại.";
        }

        if (this.warReport.result === 1) {
            return "Hai bên bất phân thắng bại. Trận chiến kết thúc với kết quả hòa.";
        }

        if (this.warReport.result === 2) {
            if (this.warReport.occupy === 1) {
                return `Binh lực chủ tướng đối phương đã cạn. Phe ta chiếm lãnh địa (${this.warReport.x}, ${this.warReport.y}).`;
            }

            const destroy = Math.ceil(this.warReport.destroy_durable / 100);
            return `Binh lực chủ tướng đối phương đã cạn. Phe ta gây ${destroy} sát thương độ bền cho lãnh địa (${this.warReport.x}, ${this.warReport.y}).`;
        }

        return "Trận chiến đã kết thúc.";
    }

    private getGeneralX(id: Number): GeneralDataX {
        const result = new GeneralDataX();
        const attackGenerals = this.warReport.beg_attack_general;
        for (const general of attackGenerals) {
            if (general.id === id) {
                result.gdata = general;
                result.isAttack = true;
                result.gcfg = GeneralCommand.getInstance().proxy.getGeneralCfg(result.gdata.cfgId);
                return result;
            }
        }

        const defenseGenerals = this.warReport.beg_defense_general;
        for (const general of defenseGenerals) {
            if (general.id === id) {
                result.gdata = general;
                result.isAttack = false;
                result.gcfg = GeneralCommand.getInstance().proxy.getGeneralCfg(result.gdata.cfgId);
                return result;
            }
        }

        return result;
    }

    private skillString(skills: WarReportSkill[]): string {
        const descriptions: string[] = [];

        for (const skill of skills) {
            const source = this.getGeneralX(skill.fromId);
            if (!source || !source.gdata || !source.gcfg) {
                continue;
            }

            const skillConfig = SkillCommand.getInstance().proxy.getSkillCfg(skill.cfgId);
            const sourceColor = source.isAttack ? this.attColor : this.denColor;
            let description = `${sourceColor}${this.nameString(source.isAttack, source.gcfg, source.gdata)}${this.endColor}`;
            description += ` sử dụng kỹ năng ${this.skillColor}${skillConfig.name} (cấp ${skill.lv})${this.endColor}`;

            const targets: string[] = [];
            for (const targetId of skill.toId) {
                const target = this.getGeneralX(targetId);
                if (!target || !target.gdata || !target.gcfg) {
                    continue;
                }
                const targetColor = target.isAttack ? this.attColor : this.denColor;
                targets.push(`${targetColor}${this.nameString(target.isAttack, target.gcfg, target.gdata)}${this.endColor}`);
            }

            if (targets.length > 0) {
                description += ` lên ${targets.join(", ")}`;
            }

            const effectText = this.effectString(skill);
            if (effectText.length > 0) {
                description += `${this.skillColor}: ${effectText}${this.endColor}`;
            }

            description += this.killString(skill);
            descriptions.push(description);
        }

        return descriptions.join("\n");
    }

    private effectString(skill: WarReportSkill): string {
        const effects: string[] = [];

        for (let index = 0; index < skill.includeEffect.length; index += 1) {
            const effectType = skill.includeEffect[index];
            const effectValue = skill.effectValue[index];
            const effectRound = skill.effectRound[index];
            let effect = "";

            if (effectType === SkillEffectType.Defense) {
                effect = `phòng thủ +${effectValue}`;
            } else if (effectType === SkillEffectType.Force) {
                effect = `vũ lực +${effectValue}`;
            } else if (effectType === SkillEffectType.Strategy) {
                effect = `mưu lược +${effectValue}`;
            } else if (effectType === SkillEffectType.Speed) {
                effect = `tốc độ +${effectValue}`;
            } else if (effectType === SkillEffectType.Destroy) {
                effect = `công thành +${effectValue}`;
            }

            if (effect.length > 0 && effectRound > 0) {
                effect += ` trong ${effectRound} lượt`;
            }
            if (effect.length > 0) {
                effects.push(effect);
            }
        }

        return effects.join("; ");
    }

    private killString(skill: WarReportSkill): string {
        if (!skill.kill || skill.kill.length === 0) {
            return "";
        }

        const losses: string[] = [];
        for (let index = 0; index < skill.kill.length; index += 1) {
            const target = this.getGeneralX(skill.toId[index]);
            if (!target || !target.gdata || !target.gcfg) {
                continue;
            }

            const targetColor = target.isAttack ? this.attColor : this.denColor;
            losses.push(
                `${targetColor}${this.nameString(target.isAttack, target.gcfg, target.gdata)}${this.endColor}`
                + ` mất ${this.lossColor}${skill.kill[index]}${this.endColor} binh lính`,
            );
        }

        return losses.length > 0 ? `. Gây ${losses.join("; ")}.` : "";
    }

    private nameString(isAttack: boolean, config: GeneralConfig, general: any): string {
        const generals = isAttack
            ? this.warReport.beg_attack_general
            : this.warReport.beg_defense_general;
        const position = generals.findIndex(item => item.id === general.id);
        const side = isAttack ? this.attstr : this.denStr;
        return `${side} ${config.name} (${this.positionString(position)})`;
    }

    private positionString(position: number): string {
        return position === 0 ? "Chủ tướng" : "Phó tướng";
    }

    protected clickPos(): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.closeReport);
        EventMgr.emit(LogicEvent.scrollToMap, this.warReport.x, this.warReport.y);
    }
}
