import { _decorator, Color, Component, Graphics, Label, Node, ScrollView, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import UnionCommand from "./UnionCommand";
import { Union } from "./UnionProxy";
import { EventMgr } from '../utils/EventMgr';
import ListLogic from '../utils/ListLogic';
import { LogicEvent } from '../common/LogicEvent';

@ccclass('UnionLobbyLogic')
export default class UnionLobbyLogic extends Component {
    @property(ScrollView)
    scrollView:ScrollView | null = null;
    private _referenceBuilt = false;

    protected onLoad():void{
        this.buildReferenceLobby();
        EventMgr.on(LogicEvent.updateUnionList,this.updateUnion,this);
    }

    private buildReferenceLobby():void{
        if (this._referenceBuilt) return;
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];
        const root = new Node('ReferenceUnionLobby');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1140, 480);

        const hero = this.makePanel(root, 'Hero', 1080, 132, 0, 156, new Color(28, 18, 12, 248), new Color(130, 88, 43, 255), 2, 9);
        this.makeLabel(hero, 'Title', 'BẠN CHƯA THAM GIA LIÊN MINH', 0, 28, 25, new Color(235, 196, 116, 255), true, 600);
        this.makeLabel(hero, 'SubTitle', 'Gia nhập một thế lực hoặc tạo liên minh mới để cùng chinh chiến.', 0, -20, 14, new Color(164, 143, 108, 255), false, 700);

        this.makeLabel(root, 'ListTitle', 'LIÊN MINH ĐỀ XUẤT', -380, 72, 14, new Color(177, 150, 105, 255), true, 260);
        const listPanel = this.makePanel(root, 'ListPanel', 1080, 292, 0, -88, new Color(15, 12, 10, 246), new Color(91, 63, 35, 255), 1, 8);
        this.scrollView.node.parent = listPanel;
        this.scrollView.node.active = true;
        this.scrollView.node.setPosition(0, 0, 0);
        const transform = this.scrollView.node.getComponent(UITransform);
        if (transform) transform.setContentSize(1040, 264);

        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== root) child.active = false;
        });
    }

    protected onDestroy():void{
        EventMgr.targetOff(this);
    }

    protected updateUnion(data:any[]){
        const comp = this.scrollView.node.getComponent(ListLogic);
        const list:Union[] = UnionCommand.getInstance().proxy.getUnionList();
        comp.setData(list);
    }

    protected onEnable():void{
        UnionCommand.getInstance().unionList();
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
}
