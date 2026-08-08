import { _decorator, Button, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import {
    ANCIENT_UI,
    applyAncientScreenChrome,
    createUiText,
    drawAncientPanel,
    ensureUiChild,
    ensureUiTransform,
    findButtonByHandler,
    styleAncientButton,
} from '../../common/AudioManager';
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
        this.applyModernTax();
        EventMgr.on(LogicEvent.interiorOpenCollect, this.onOpenCollect, this);
        EventMgr.on(LogicEvent.interiorCollect, this.onCollect, this);
        const roleRes = LoginCommand.getInstance().proxy.getRoleResData();
        this.goldLab.string = Tools.numberToShow(roleRes.gold_yield);
        MapUICommand.getInstance().interiorOpenCollect();
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    private applyModernTax(): void {
        applyAncientScreenChrome(this.node, 'Thu thuế');
        const body = ensureUiChild(this.node, '__TaxBody');
        body.setPosition(0, -15, 0);
        body.setSiblingIndex(0);
        drawAncientPanel(body, 650, 470, 12);

        const status = createUiText(body, '__TaxStatus', 'THÔNG TIN THU THUẾ', 22, ANCIENT_UI.gold, 420, 48, true);
        status.node.setPosition(0, 180, 0);

        const goldCaption = createUiText(body, '__TaxGoldCaption', 'Tiền thu hiện có', 17, ANCIENT_UI.muted, 220, 36);
        goldCaption.node.setPosition(-120, 95, 0);
        const timesCaption = createUiText(body, '__TaxTimesCaption', 'Số lần thu hôm nay', 17, ANCIENT_UI.muted, 220, 36);
        timesCaption.node.setPosition(-120, 30, 0);
        const cdCaption = createUiText(body, '__TaxCdCaption', 'Thời gian hồi tiếp theo', 17, ANCIENT_UI.muted, 230, 36);
        cdCaption.node.setPosition(-115, -35, 0);

        this.goldLab.node.setParent(body);
        this.goldLab.node.setPosition(160, 95, 0);
        this.timesLab.node.setParent(body);
        this.timesLab.node.setPosition(160, 30, 0);
        this.cdLab.node.setParent(body);
        this.cdLab.node.setPosition(160, -35, 0);

        for (const label of [this.goldLab, this.timesLab, this.cdLab]) {
            label.useSystemFont = true;
            label.fontFamily = 'Arial';
            label.fontSize = 22;
            label.lineHeight = 28;
            label.color = ANCIENT_UI.gold;
            ensureUiTransform(label.node, 260, 38);
        }

        this.collectBtn.node.setParent(body);
        this.collectBtn.node.setPosition(0, -150, 0);
        styleAncientButton(this.collectBtn.node, 'THU THUẾ', 'gold', 270, 62);

        const close = findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
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
        this.schedule(this.countDown, 1);
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
