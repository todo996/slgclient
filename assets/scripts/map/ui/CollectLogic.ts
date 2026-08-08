import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    Sprite,
    UITransform,
    VerticalTextAlignment,
} from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import LoginCommand from '../../login/LoginCommand';
import DateUtil from '../../utils/DateUtil';
import { EventMgr } from '../../utils/EventMgr';
import { Tools } from '../../utils/Tools';
import MapUICommand from './MapUICommand';

@ccclass('CollectLogic')
export default class CollectLogic extends Component {
    @property(Label)
    cdLab: Label = null;

    @property(Label)
    timesLab: Label = null;

    @property(Label)
    goldLab: Label = null;

    @property(Button)
    collectBtn: Button = null;

    _data: any = null;

    protected onEnable(): void {
        this.applyTaxPresentation();
        EventMgr.on(LogicEvent.interiorOpenCollect, this.onOpenCollect, this);
        EventMgr.on(LogicEvent.interiorCollect, this.onCollect, this);

        const roleRes = LoginCommand.getInstance().proxy.getRoleResData();
        this.goldLab.string = Tools.numberToShow(roleRes.gold_yield);
        MapUICommand.getInstance().interiorOpenCollect();
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    private ensureTransform(node: Node, width: number, height: number): UITransform {
        const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
        transform.setContentSize(width, height);
        return transform;
    }

    private ensureChild(parent: Node, name: string): Node {
        let child = parent.getChildByName(name);
        if (!child) {
            child = new Node(name);
            child.setParent(parent);
        }
        return child;
    }

    private hideLegacyChrome(root: Node, depth: number = 0): void {
        if (depth > 2) {
            return;
        }
        const name = root.name.toLowerCase();
        const isArt = /(icon|pic|coin|gold|head|avatar)/.test(name);
        const isChrome = /(^bg$|background|diban|panel|frame|kuang|border|base|bottom|top|di$)/.test(name);
        if (isChrome && !isArt) {
            const sprite = root.getComponent(Sprite);
            if (sprite) {
                sprite.enabled = false;
            }
        }
        for (const child of root.children) {
            this.hideLegacyChrome(child, depth + 1);
        }
    }

    private drawPanel(node: Node, width: number, height: number): void {
        this.ensureTransform(node, width, height);
        const skin = this.ensureChild(node, '__TaxAncientSkin');
        skin.setPosition(0, 0, 0);
        skin.setSiblingIndex(0);
        this.ensureTransform(skin, width, height);

        const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(12, 10, 9, 242);
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.fill();
        graphics.strokeColor = new Color(75, 49, 28, 255);
        graphics.lineWidth = 4;
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.stroke();
        graphics.strokeColor = new Color(164, 116, 58, 235);
        graphics.lineWidth = 2;
        graphics.roundRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 8);
        graphics.stroke();
    }

    private createText(
        parent: Node,
        name: string,
        text: string,
        x: number,
        y: number,
        width: number,
        height: number,
        fontSize: number,
        color: Color,
        title: boolean = false,
    ): Label {
        const node = this.ensureChild(parent, name);
        node.setPosition(x, y, 0);
        this.ensureTransform(node, width, height);
        const label = node.getComponent(Label) || node.addComponent(Label);
        label.useSystemFont = true;
        label.fontFamily = title ? 'Times New Roman' : 'Arial';
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.ceil(fontSize * 1.25);
        label.enableWrapText = false;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = color;
        return label;
    }

    private styleValue(label: Label, x: number, y: number, width: number = 245): void {
        label.node.setPosition(x, y, 0);
        this.ensureTransform(label.node, width, 40);
        label.useSystemFont = true;
        label.fontFamily = 'Arial';
        label.fontSize = 22;
        label.lineHeight = 28;
        label.enableWrapText = false;
        label.overflow = Label.Overflow.SHRINK;
        label.horizontalAlign = HorizontalTextAlignment.RIGHT;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = new Color(231, 190, 109, 255);
        label.node.setSiblingIndex(this.node.children.length - 1);
    }

    private styleCollectButton(): void {
        const node = this.collectBtn.node;
        node.setPosition(0, -145, 0);
        this.ensureTransform(node, 280, 64);
        for (const sprite of node.getComponents(Sprite)) {
            sprite.enabled = false;
        }

        const skin = this.ensureChild(node, '__TaxButtonSkin');
        skin.setPosition(0, 0, 0);
        skin.setSiblingIndex(0);
        this.ensureTransform(skin, 280, 64);
        const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(126, 82, 29, 255);
        graphics.roundRect(-140, -32, 280, 64, 8);
        graphics.fill();
        graphics.strokeColor = new Color(231, 190, 109, 255);
        graphics.lineWidth = 2;
        graphics.roundRect(-138, -30, 276, 60, 7);
        graphics.stroke();

        for (const label of node.getComponentsInChildren(Label)) {
            label.node.active = false;
        }
        const caption = this.createText(
            node,
            '__TaxButtonCaption',
            'THU THUẾ',
            0,
            0,
            230,
            48,
            25,
            new Color(255, 239, 194, 255),
            true,
        );
        caption.node.active = true;
        caption.node.setSiblingIndex(node.children.length - 1);
        this.collectBtn.transition = Button.Transition.SCALE;
        this.collectBtn.zoomScale = 0.97;
        this.collectBtn.duration = 0.08;
    }

    private applyTaxPresentation(): void {
        this.hideLegacyChrome(this.node);

        const body = this.ensureChild(this.node, '__TaxModernBody');
        body.setPosition(0, -8, 0);
        body.setSiblingIndex(0);
        this.drawPanel(body, 650, 485);

        this.createText(
            body,
            '__TaxTitle',
            'Có thể thu thuế ngay',
            0,
            175,
            510,
            56,
            34,
            new Color(231, 190, 109, 255),
            true,
        );
        this.createText(body, '__TaxGoldCaption', 'Tiền thu hiện có:', -125, 90, 250, 38, 18, new Color(210, 195, 166, 255));
        this.createText(body, '__TaxTimesCaption', 'Số lần thu hôm nay:', -125, 25, 250, 38, 18, new Color(210, 195, 166, 255));
        this.createText(body, '__TaxCdCaption', 'Thời gian hồi tiếp theo:', -125, -40, 270, 38, 18, new Color(210, 195, 166, 255));

        this.goldLab.node.setParent(body);
        this.timesLab.node.setParent(body);
        this.cdLab.node.setParent(body);
        this.collectBtn.node.setParent(body);

        this.styleValue(this.goldLab, 155, 90);
        this.styleValue(this.timesLab, 155, 25);
        this.styleValue(this.cdLab, 155, -40);
        this.styleCollectButton();

        this.createText(
            body,
            '__TaxHint',
            'Thuế được máy chủ xác nhận và cập nhật trực tiếp vào tài nguyên.',
            0,
            -205,
            520,
            34,
            15,
            new Color(177, 163, 139, 255),
        );
    }

    protected onOpenCollect(msg: any): void {
        this._data = msg;
        this.startCountDown();
    }

    protected onCollect(msg: any): void {
        this._data = msg;
        this.startCountDown();
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected onClickCollect(): void {
        AudioManager.instance.playClick();
        MapUICommand.getInstance().interiorCollect();
    }

    protected startCountDown(): void {
        this.stopCountDown();
        this.schedule(this.countDown, 1.0);
        this.countDown();
    }

    public countDown(): void {
        if (!this._data) {
            return;
        }
        this.timesLab.string = `${this._data.cur_times}/${this._data.limit}`;
        const diff = DateUtil.leftTime(this._data.next_time);
        if (diff > 0) {
            this.cdLab.string = DateUtil.leftTimeStr(this._data.next_time);
            this.collectBtn.node.active = false;
        } else {
            this.cdLab.string = 'Có thể thu thuế ngay';
            this.collectBtn.node.active = true;
        }
    }

    public stopCountDown(): void {
        this.unschedule(this.countDown);
    }
}
