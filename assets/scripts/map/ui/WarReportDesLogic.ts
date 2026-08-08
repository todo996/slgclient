import { _decorator, Button, Color, Component, Graphics, Label, ScrollView, Node, UITransform, instantiate } from 'cc';
import { AudioManager } from '../../common/AudioManager';
import LoginCommand from '../../login/LoginCommand';
import DateUtil from '../../utils/DateUtil';

const { ccclass, property } = _decorator;
import { WarReport } from "./MapUIProxy";
import WarReportDesItemLogic from './WarReportDesItemLogic';

@ccclass('WarReportDesLogic')
export default class WarReportDesLogic extends Component {

    private _curData:WarReport = null;

    @property(ScrollView)
    scrollView:ScrollView = null;

    @property(Node)
    item:Node = null;

    _lastY:number = 0;
    _curNum:number = 0;
    private _referenceBuilt = false;
    private _typeLabel: Label = null;
    private _resultLabel: Label = null;
    private _timeLabel: Label = null;
    private _positionLabel: Label = null;

    onLoad(){
        this.item.active = false;
        this.buildReferenceDetail();
        this.scrollView.node.on("scroll-to-bottom", this.scrollToBottom, this);
    }

    onEnable(){
        this.scrollView.scrollToTop();
    }

    private buildReferenceDetail():void{
        if (this._referenceBuilt) return;
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceReportDetail');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.setPosition(220, -4, 0);
        root.addComponent(UITransform).setContentSize(760, 570);
        this.makePanel(root, 'Backdrop', 760, 570, 0, 0, new Color(17, 13, 10, 253), new Color(157, 109, 54, 255), 3, 9);
        this.makePanel(root, 'Summary', 720, 112, 0, 208, new Color(25, 18, 13, 250), new Color(96, 66, 36, 255), 1, 7);
        this.makeLabel(root, 'Title', 'CHI TIẾT CHIẾN ĐẤU', -213, 246, 20, new Color(231, 192, 115, 255), true, 280);
        this._typeLabel = this.makeLabel(root, 'BattleType', '', -246, 203, 14, new Color(173, 147, 103, 255), true, 210);
        this._resultLabel = this.makeLabel(root, 'BattleResult', '', 2, 203, 18, new Color(237, 207, 142, 255), true, 180);
        this._positionLabel = this.makeLabel(root, 'BattlePosition', '', 231, 217, 14, new Color(174, 151, 113, 255), false, 210);
        this._timeLabel = this.makeLabel(root, 'BattleTime', '', 231, 190, 12, new Color(126, 111, 87, 255), false, 210);
        this.makeButton(root, 'CloseDetail', 'ĐÓNG CHI TIẾT', 260, -246, 160, 38, () => this.onClickClose(), false, 12);

        this.makeLabel(root, 'RoundTitle', 'DIỄN BIẾN TRẬN ĐẤU', -235, 137, 14, new Color(163, 139, 100, 255), true, 250);
        this.scrollView.node.parent = root;
        this.scrollView.node.active = true;
        this.scrollView.node.setPosition(0, -55, 0);
        const scrollTransform = this.scrollView.node.getComponent(UITransform);
        if (scrollTransform) scrollTransform.setContentSize(710, 365);

        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== root && child !== this.item) child.active = false;
        });
    }

    public setData(data:any):void{
        this.scrollView.content.removeAllChildren();
        this._curData = data;
        this._curNum = 0;
        this.refreshSummary();
        this.make();
        this.scrollView.scrollToTop();
    }

    private refreshSummary():void{
        if (!this._curData) return;
        const role = LoginCommand.getInstance().proxy.getRoleData();
        const isAttacker = role.rid === this._curData.attack_rid;
        if (this._typeLabel) this._typeLabel.string = isAttacker ? 'TẤN CÔNG' : 'PHÒNG THỦ';

        let result = 'HÒA';
        if (this._curData.result !== 1) {
            const attackerWon = this._curData.result !== 0;
            const meWon = isAttacker ? attackerWon : !attackerWon;
            result = meWon ? 'CHIẾN THẮNG' : 'THẤT BẠI';
        }
        if (this._resultLabel) {
            this._resultLabel.string = result;
            this._resultLabel.color = result === 'CHIẾN THẮNG' ? new Color(224, 187, 103, 255) : result === 'THẤT BẠI' ? new Color(190, 101, 72, 255) : new Color(179, 159, 119, 255);
        }
        if (this._positionLabel) this._positionLabel.string = `Tọa độ (${this._curData.x}, ${this._curData.y})`;
        if (this._timeLabel) this._timeLabel.string = DateUtil.converTimeStr(this._curData.ctime, "YYYY-MM-DD hh:mm:ss");
    }

    private make() {
        if (!this._curData || !this._curData.rounds) return;
        const max = Math.min(6, this._curData.rounds.length-this._curNum);
        for (let index = this._curNum; index < this._curNum + max; index++) {
            const r = this._curData.rounds[index];
            const item = instantiate(this.item);
            item.active = true;
            item.parent = this.scrollView.content;
            item.getComponent(WarReportDesItemLogic).setData(r, this._curData, index == this._curData.rounds.length-1);
        }
        this._curNum += max;
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected scrollToBottom(): void {
        this.make();
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
        node.addComponent(UITransform).setContentSize(width, fontSize + 14);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 5;
        label.color = tint;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }

    private makeButton(parent: Node, name: string, text: string, x: number, y: number, width: number, height: number, callback: () => void, primary: boolean, fontSize: number): Node {
        const node = this.makePanel(parent, name, width, height, x, y, primary ? new Color(105, 68, 29, 255) : new Color(28, 20, 14, 248), primary ? new Color(231, 187, 97, 255) : new Color(119, 84, 43, 255), 2, 7);
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        node.on(Button.EventType.CLICK, callback, this);
        this.makeLabel(node, `${name}_label`, text, 0, 0, fontSize, new Color(232, 210, 170, 255), true, width - 10);
        return node;
    }
}