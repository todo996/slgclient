import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
const { ccclass, property } = _decorator;
import UnionCommand from "./UnionCommand";
import { Union } from "./UnionProxy";
import { EventMgr } from '../utils/EventMgr';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { ensureChild, ensureTransform, styleGameButton } from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';

@ccclass('UnionItemLogic')
export default class UnionItemLogic extends Component {
    @property(Label)
    nameLabel: Label | null = null;
    @property(Node)
    joinButtonNode: Node | null = null;
    protected _unionData:Union = null;

    protected onLoad():void{
        this.applyLayout();
        this.joinButtonNode.active = false;
    }

    private applyLayout(): void {
        const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        const width = transform.width > 0 ? transform.width : 980;
        const height = transform.height > 0 ? transform.height : 82;

        const surface = ensureChild(this.node, '__UnionItemSurface');
        surface.setSiblingIndex(0);
        surface.setPosition(0, 0, 0);
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(20, 17, 14, 240);
        graphics.roundRect(-width / 2, -height / 2, width, height, 10);
        graphics.fill();
        graphics.fillColor = new Color(68, 46, 27, 62);
        graphics.roundRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 7);
        graphics.fill();
        graphics.strokeColor = new Color(151, 104, 51, 205);
        graphics.lineWidth = 1.5;
        graphics.roundRect(-width / 2, -height / 2, width, height, 10);
        graphics.stroke();

        if (this.nameLabel) {
            this.nameLabel.node.setPosition(-width * 0.28, 0, 0);
            ensureTransform(this.nameLabel.node, width * 0.5, Math.max(38, height - 16));
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

        if (this.joinButtonNode) {
            this.joinButtonNode.setPosition(width * 0.36, 0, 0);
            const button = this.joinButtonNode.getComponent(Button) || this.joinButtonNode.addComponent(Button);
            styleGameButton(this.joinButtonNode, 'XIN GIA NHẬP', 'jade', 180, 44);
            for (const label of this.joinButtonNode.getComponentsInChildren(Label)) {
                if (label.node.name !== '__GameLabel') {
                    label.node.active = false;
                }
            }
            const modern = this.joinButtonNode.getChildByName('__GameLabel');
            if (modern) {
                modern.active = true;
                modern.setSiblingIndex(this.joinButtonNode.children.length - 1);
            }
            button.interactable = true;
        }
    }

    protected updateItem(data:Union):void{
        this._unionData = data;
        this.nameLabel.string = this._unionData.name;
        this.joinButtonNode.active = this.isCanJoin();
    }

    protected isCanJoin():boolean{
        return !UnionCommand.getInstance().proxy.isMeInUnion();
    }

    protected join():void{
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionJoin(this._unionData.id)
    }

    protected click():void{
        AudioManager.instance.playClick();
        var isCanjoin:boolean = this.isCanJoin();
        if(!isCanjoin){
            EventMgr.emit(LogicEvent.openMyUnion,this._unionData)
        }
    }
}
