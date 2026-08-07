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
    VerticalTextAlignment,
} from 'cc';
const {ccclass, property} = _decorator;

import LoginCommand from "../../login/LoginCommand";
import DateUtil from "../../utils/DateUtil";
import { Tools } from "../../utils/Tools";
import MapUICommand from "./MapUICommand";
import { EventMgr } from '../../utils/EventMgr';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { localizeNode } from '../../i18n/I18n';
import {
    createGameText,
    drawGamePanel,
    ensureChild,
    ensureTransform,
    styleGameButton,
} from '../../ui/components/GameSurface';
import { GameTheme } from '../../ui/theme/GameTheme';

function handlerOf(button: Button): string {
    for (const event of (button.clickEvents as any[]) || []) {
        if (event && typeof event.handler === 'string' && event.handler) {
            return event.handler;
        }
    }
    return '';
}

function findButton(root: Node, handler: string): Button | null {
    return root.getComponentsInChildren(Button)
        .find((button) => handlerOf(button) === handler) || null;
}

function styleRealButton(
    button: Button,
    text: string,
    variant: 'primary' | 'secondary' | 'jade' | 'danger',
    width: number,
    height: number,
): void {
    styleGameButton(button.node, text, variant, width, height);
    for (const label of button.node.getComponentsInChildren(Label)) {
        if (label.node.name !== '__GameLabel') {
            label.node.active = false;
        }
    }
    const modernLabel = button.node.getChildByName('__GameLabel');
    if (modernLabel) {
        modernLabel.active = true;
        modernLabel.setSiblingIndex(button.node.children.length - 1);
    }
}

function styleValueLabel(label: Label, parent: Node, x: number, y: number, width: number): void {
    label.node.setParent(parent);
    label.node.active = true;
    label.node.setPosition(x, y, 0);
    ensureTransform(label.node, width, 48);
    label.useSystemFont = true;
    label.fontFamily = GameTheme.typography.bodyFont;
    label.fontSize = 22;
    label.lineHeight = 30;
    label.enableWrapText = false;
    label.overflow = Label.Overflow.SHRINK;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.color = GameTheme.colors.gold300;
    label.node.setSiblingIndex(parent.children.length - 1);
}

function applyCollectLayout(
    root: Node,
    cdLab: Label,
    timesLab: Label,
    goldLab: Label,
    collectBtn: Button,
): void {
    const panel = root.getChildByName('New Node') || root.children.find((child) => child.name !== 'mask');
    if (panel) {
        for (const sprite of panel.getComponents(Sprite)) {
            sprite.enabled = false;
        }
        drawGamePanel(panel, 900, 590, 16);
    }

    const header = ensureChild(root, '__CollectHeader');
    header.setPosition(0, 272, 0);
    ensureTransform(header, 850, 76);
    const headerGraphics = header.getComponent(Graphics) || header.addComponent(Graphics);
    headerGraphics.clear();
    headerGraphics.fillColor = new Color(12, 10, 9, 238);
    headerGraphics.rect(-425, -38, 850, 76);
    headerGraphics.fill();
    headerGraphics.strokeColor = new Color(176, 124, 59, 225);
    headerGraphics.lineWidth = 2;
    headerGraphics.moveTo(-425, -36);
    headerGraphics.lineTo(425, -36);
    headerGraphics.stroke();

    const title = createGameText(
        header,
        '__CollectTitle',
        'THU THUẾ',
        40,
        GameTheme.colors.gold300,
        420,
        58,
        true,
    );
    title.node.setPosition(0, 0, 0);

    const treasury = ensureChild(root, '__TreasuryCard');
    treasury.setPosition(0, 32, 0);
    ensureTransform(treasury, 650, 330);
    const cardGraphics = treasury.getComponent(Graphics) || treasury.addComponent(Graphics);
    cardGraphics.clear();
    cardGraphics.fillColor = new Color(30, 24, 19, 242);
    cardGraphics.roundRect(-325, -165, 650, 330, 18);
    cardGraphics.fill();
    cardGraphics.fillColor = new Color(92, 62, 27, 70);
    cardGraphics.roundRect(-314, -154, 628, 308, 13);
    cardGraphics.fill();
    cardGraphics.strokeColor = new Color(190, 139, 69, 235);
    cardGraphics.lineWidth = 2.5;
    cardGraphics.roundRect(-325, -165, 650, 330, 18);
    cardGraphics.stroke();

    const seal = ensureChild(treasury, '__TaxSeal');
    seal.setPosition(0, 82, 0);
    ensureTransform(seal, 104, 104);
    const sealGraphics = seal.getComponent(Graphics) || seal.addComponent(Graphics);
    sealGraphics.clear();
    sealGraphics.fillColor = new Color(88, 29, 20, 235);
    sealGraphics.circle(0, 0, 49);
    sealGraphics.fill();
    sealGraphics.strokeColor = new Color(226, 172, 82, 245);
    sealGraphics.lineWidth = 3;
    sealGraphics.circle(0, 0, 49);
    sealGraphics.stroke();
    const sealText = createGameText(seal, '__TaxSealText', 'THUẾ', 26, GameTheme.colors.gold300, 86, 50, true);
    sealText.node.setPosition(0, 0, 0);

    const goldCaption = createGameText(
        treasury,
        '__GoldYieldCaption',
        'Lợi tức vàng',
        17,
        GameTheme.colors.muted,
        220,
        32,
    );
    goldCaption.node.setPosition(0, 18, 0);
    styleValueLabel(goldLab, treasury, 0, -18, 270);

    const timesCaption = createGameText(
        treasury,
        '__TimesCaption',
        'Số lượt hôm nay',
        16,
        GameTheme.colors.muted,
        200,
        30,
    );
    timesCaption.node.setPosition(-145, -82, 0);
    styleValueLabel(timesLab, treasury, -145, -112, 190);

    const cdCaption = createGameText(
        treasury,
        '__CooldownCaption',
        'Thời gian còn lại',
        16,
        GameTheme.colors.muted,
        210,
        30,
    );
    cdCaption.node.setPosition(145, -82, 0);
    styleValueLabel(cdLab, treasury, 145, -112, 250);

    collectBtn.node.setParent(root);
    collectBtn.node.setPosition(0, -234, 0);
    styleRealButton(collectBtn, 'THU THUẾ', 'primary', 310, 64);

    const close = findButton(root, 'onClickClose');
    if (close) {
        close.node.setParent(root);
        close.node.active = true;
        close.node.setPosition(-414, 272, 0);
        styleRealButton(close, '←', 'secondary', 72, 52);
    }
}

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

    protected onEnable():void{
        localizeNode(this.node);
        applyCollectLayout(this.node, this.cdLab, this.timesLab, this.goldLab, this.collectBtn);
        EventMgr.on(LogicEvent.interiorOpenCollect, this.onOpenCollect, this);
        EventMgr.on(LogicEvent.interiorCollect, this.onCollect, this);

        var roleRes = LoginCommand.getInstance().proxy.getRoleResData();
        this.goldLab.string = Tools.numberToShow(roleRes.gold_yield);

        MapUICommand.getInstance().interiorOpenCollect();
    }

    protected onDisable():void{
        EventMgr.targetOff(this);
    }

    protected onOpenCollect(msg:any):void{
        this._data = msg;
        this.startCountDown();
    }

    protected onCollect(msg:any):void{
        this._data = msg;
        this.startCountDown();
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected onClickCollect(): void{
        AudioManager.instance.playClick();
        MapUICommand.getInstance().interiorCollect();
    }

    protected startCountDown(){
        this.stopCountDown();
        this.schedule(this.countDown, 1.0);
        this.countDown();
    }

    public countDown() {
        this.timesLab.string = this._data.cur_times + "/" + this._data.limit;
        var diff = DateUtil.leftTime(this._data.next_time);
        if (diff>0){
            this.cdLab.string = DateUtil.leftTimeStr(this._data.next_time);
            this.collectBtn.node.active = false;
        }else{
            this.cdLab.string = "Có thể thu thuế ngay";
            this.collectBtn.node.active = true;
        }
    }

    public stopCountDown() {
        this.unschedule(this.countDown);
    }
}
