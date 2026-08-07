import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
import { AudioManager } from '../common/AudioManager';
const { ccclass, property } = _decorator;
import UnionCommand from "./UnionCommand";
import { Apply } from "./UnionProxy";
import { ensureChild, ensureTransform, styleGameButton } from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';

@ccclass('UnionApplyItemLogic')
export default class UnionApplyItemLogic extends Component {
    @property(Label)
    nameLabel: Label | null = null;
    protected _applyData:Apply = null;

    protected onLoad(): void {
        this.applyLayout();
    }

    private eventDecision(button: Button): number {
        for (const event of (button.clickEvents as any[]) || []) {
            if (event && event.handler === 'verify') {
                return Number(event.customEventData || 0);
            }
        }
        return 0;
    }

    private applyLayout(): void {
        const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        const width = transform.width > 0 ? transform.width : 980;
        const height = transform.height > 0 ? transform.height : 82;

        const surface = ensureChild(this.node, '__UnionApplySurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(20, 17, 14, 240);
        graphics.roundRect(-width / 2, -height / 2, width, height, 10);
        graphics.fill();
        graphics.strokeColor = new Color(151, 104, 51, 205);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-width / 2, -height / 2, width, height, 10);
        graphics.stroke();

        if (this.nameLabel) {
            this.nameLabel.node.setPosition(-width * 0.29, 0, 0);
            ensureTransform(this.nameLabel.node, width * 0.46, 42);
            this.nameLabel.useSystemFont = true;
            this.nameLabel.fontFamily = GameTheme.typography.titleFont;
            this.nameLabel.fontSize = 20;
            this.nameLabel.lineHeight = 26;
            this.nameLabel.enableWrapText = false;
            this.nameLabel.overflow = Label.Overflow.SHRINK;
            this.nameLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.nameLabel.verticalAlign = VerticalTextAlignment.CENTER;
            this.nameLabel.color = GameTheme.colors.gold300;
            this.nameLabel.node.setSiblingIndex(this.node.children.length - 1);
        }

        const verifyButtons = this.node.getComponentsInChildren(Button).filter((button) => {
            return ((button.clickEvents as any[]) || []).some((event) => event && event.handler === 'verify');
        });
        let fallbackIndex = 0;
        for (const button of verifyButtons) {
            const decision = this.eventDecision(button);
            const isApprove = decision === 2;
            const isReject = decision === 1;
            const text = isApprove ? 'CHẤP NHẬN' : isReject ? 'TỪ CHỐI' : (fallbackIndex++ === 0 ? 'TỪ CHỐI' : 'CHẤP NHẬN');
            const variant = text === 'CHẤP NHẬN' ? 'jade' : 'danger';
            const x = text === 'CHẤP NHẬN' ? width * 0.34 : width * 0.12;
            button.node.setPosition(x, 0, 0);
            styleGameButton(button.node, text, variant, 170, 44);
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
    }

    protected updateItem(data:Apply):void{
        this._applyData = data;
        this.nameLabel.string = this._applyData.nick_name;
    }

    protected verify(event:any,decide:number = 0):void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionVerify(this._applyData.id,Number(decide));
    }
}
