import {
    _decorator,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    SpriteFrame,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
const {ccclass, property} = _decorator;
import SkillCommand from "../../skill/SkillCommand";
import { Skill } from "../../skill/SkillProxy";
import SkillIconLogic from "./SkillIconLogic";
import { ensureChild, ensureTransform } from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

@ccclass('SkillItemLogic')
export default class SkillItemLogic extends Component {

    @property(Label)
    nameLab: Label = null;

    @property(Label)
    limitLab: Label = null;

    @property(Node)
    icon:Node = null;

    @property([SpriteFrame])
    sps:SpriteFrame[] = [];

    _skill: Skill = null;

    protected onLoad():void{
        this.applyVisualLayout();
    }

    protected onEnable():void{
        this.applyVisualLayout();
    }

    private applyVisualLayout(): void {
        const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        const width = Math.max(210, transform.width || 210);
        const height = Math.max(150, transform.height || 150);

        const surface = ensureChild(this.node, '__SkillCardSurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(18, 15, 12, 244);
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.fill();
        graphics.fillColor = new Color(72, 49, 27, 76);
        graphics.roundRect(-width / 2 + 7, -height / 2 + 7, width - 14, height - 14, 8);
        graphics.fill();
        graphics.strokeColor = new Color(176, 124, 59, 225);
        graphics.lineWidth = 2;
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.stroke();

        if (this.icon) {
            this.icon.setPosition(-width * 0.28, 7, 0);
            this.icon.setSiblingIndex(this.node.children.length - 1);
        }

        if (this.nameLab) {
            ensureTransform(this.nameLab.node, width * 0.56, 58);
            this.nameLab.node.setPosition(width * 0.16, 20, 0);
            this.nameLab.useSystemFont = true;
            this.nameLab.fontFamily = GameTheme.typography.titleFont;
            this.nameLab.fontSize = 19;
            this.nameLab.lineHeight = 24;
            this.nameLab.enableWrapText = true;
            this.nameLab.overflow = Label.Overflow.SHRINK;
            this.nameLab.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.nameLab.verticalAlign = VerticalTextAlignment.CENTER;
            this.nameLab.color = GameTheme.colors.gold300;
            this.nameLab.node.setSiblingIndex(this.node.children.length - 1);
        }

        if (this.limitLab) {
            ensureTransform(this.limitLab.node, width * 0.56, 34);
            this.limitLab.node.setPosition(width * 0.16, -37, 0);
            this.limitLab.useSystemFont = true;
            this.limitLab.fontFamily = GameTheme.typography.bodyFont;
            this.limitLab.fontSize = 15;
            this.limitLab.lineHeight = 20;
            this.limitLab.enableWrapText = false;
            this.limitLab.overflow = Label.Overflow.SHRINK;
            this.limitLab.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.limitLab.verticalAlign = VerticalTextAlignment.CENTER;
            this.limitLab.color = GameTheme.colors.muted;
            this.limitLab.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    protected updateItem(skill:Skill):void{
        var conf = SkillCommand.getInstance().proxy.getSkillCfg(skill.cfgId);
        this._skill = skill;
        this.nameLab.string = conf.name;

        this.icon.getComponent(SkillIconLogic).setData(skill, null);
        this.limitLab.string = "Đã dùng: " + this._skill.generals.length + "/" + conf.limit;
    }
}
