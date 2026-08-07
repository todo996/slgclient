import {
    _decorator,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    RichText,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { SkillEffectType } from '../../config/skill/Skill';
const { ccclass, property } = _decorator;

import GeneralCommand from "../../general/GeneralCommand";
import { GeneralConfig, GeneralData } from '../../general/GeneralProxy';
import SkillCommand from '../../skill/SkillCommand';
import { EventMgr } from '../../utils/EventMgr';
import { WarReport, WarReportRound, WarReportSkill } from "./MapUIProxy";
import { ensureChild, ensureTransform } from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

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

    attColor: string = "<color=#e46e5d>";
    denColor: string = "<color=#67b895>";
    skillColor: string = "<color=#e3a84f>";
    lossColor: string = "<color=#f2c45e>";
    endColor: string = "</color>";
    attstr: string = "Công";
    denStr: string = "Thủ";

    protected onLoad(): void {
        this.applyTypography();
    }

    private applyTypography(): void {
        if (this.roundsLabel) {
            this.roundsLabel.useSystemFont = true;
            this.roundsLabel.fontFamily = GameTheme.typography.titleFont;
            this.roundsLabel.fontSize = 20;
            this.roundsLabel.lineHeight = 26;
            this.roundsLabel.enableWrapText = false;
            this.roundsLabel.overflow = Label.Overflow.SHRINK;
            this.roundsLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.roundsLabel.verticalAlign = VerticalTextAlignment.CENTER;
            this.roundsLabel.color = GameTheme.colors.gold300;
            ensureTransform(this.roundsLabel.node, 900, 36);
        }

        if (this.warLab) {
            this.warLab.fontFamily = GameTheme.typography.bodyFont;
            this.warLab.fontSize = 16;
            this.warLab.lineHeight = 25;
            this.warLab.maxWidth = 920;
            ensureTransform(this.warLab.node, 920, this.warLab.node.getComponent(UITransform)?.height || 80);
        }

        if (this.endLab) {
            this.endLab.useSystemFont = true;
            this.endLab.fontFamily = GameTheme.typography.bodyFont;
            this.endLab.fontSize = 16;
            this.endLab.lineHeight = 23;
            this.endLab.enableWrapText = true;
            this.endLab.overflow = Label.Overflow.SHRINK;
            this.endLab.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.endLab.verticalAlign = VerticalTextAlignment.CENTER;
            this.endLab.color = GameTheme.colors.gold300;
            ensureTransform(this.endLab.node, 900, 54);
        }
        if (this.cNode) {
            const content = this.cNode.getComponent(UITransform) || this.cNode.addComponent(UITransform);
            content.width = 960;
        }
    }

    private refreshCard(isEnd: boolean): void {
        const contentTransform = this.cNode.getComponent(UITransform) || this.cNode.addComponent(UITransform);
        const warTransform = this.warLab.getComponent(UITransform);
        const endTransform = this.endLab.getComponent(UITransform);
        const warHeight = Math.max(58, warTransform ? warTransform.height : 58);
        const endHeight = isEnd ? Math.max(54, endTransform ? endTransform.height : 54) : 0;
        const contentHeight = warHeight + endHeight + (isEnd ? 42 : 20);
        contentTransform.height = contentHeight;

        const rootTransform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        rootTransform.setContentSize(1000, contentHeight + 58);

        const surface = ensureChild(this.node, '__RoundCardSurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, 990, rootTransform.height - 8);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        const width = 990;
        const height = rootTransform.height - 8;
        graphics.fillColor = new Color(20, 17, 14, 244);
        graphics.roundRect(-width / 2, -height / 2, width, height, 11);
        graphics.fill();
        graphics.fillColor = new Color(57, 39, 24, 55);
        graphics.roundRect(-width / 2 + 7, -height / 2 + 7, width - 14, height - 14, 8);
        graphics.fill();
        graphics.strokeColor = new Color(137, 96, 49, 205);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-width / 2, -height / 2, width, height, 11);
        graphics.stroke();

        const accent = ensureChild(this.node, '__RoundAccent');
        accent.setSiblingIndex(1);
        accent.setPosition(-476, 0, 0);
        ensureTransform(accent, 4, height - 24);
        const ag = accent.getComponent(Graphics) || accent.addComponent(Graphics);
        ag.clear();
        ag.fillColor = new Color(190, 139, 69, 230);
        ag.roundRect(-2, -(height - 24) / 2, 4, height - 24, 2);
        ag.fill();
    }

    public setData(data: WarReportRound, warReport: WarReport, isEnd: boolean): void {
        this._reportRound = data;
        this.warReport = warReport;
        this.applyTypography();
        this.endLab.node.active = false;
        this.warLab.string = "";
        this.roundsLabel.string = `HIỆP ${this._reportRound.round} · LƯỢT ${this._reportRound.turn}`;

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

        if (isEnd) {
            this.endLab.node.active = true;
            this.endLab.string = "KẾT QUẢ · " + this.battleResultText();
        }
        this.refreshCard(isEnd);
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
