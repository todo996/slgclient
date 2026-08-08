import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import GeneralCommand from '../../general/GeneralCommand';
import { GeneralCommonConfig } from '../../general/GeneralProxy';
import LoginCommand from '../../login/LoginCommand';
import { EventMgr } from '../../utils/EventMgr';
import MapUICommand from './MapUICommand';

function ui(): any {
    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;
    if (!bridge) {
        throw new Error('Ancient UI bridge has not been initialized.');
    }
    return bridge;
}


@ccclass('DrawLogic')
export default class DrawLogic extends Component {
    @property(Label)
    labelOnce: Label = null;
    @property(Label)
    labelTen: Label = null;
    @property(Label)
    cntLab: Label = null;

    protected onEnable(): void {
        this.applyModernDraw();
        EventMgr.on(LogicEvent.upateMyRoleRes, this.updateRoleRes, this);
        EventMgr.on(LogicEvent.updateMyGenerals, this.updateRoleRes, this);
        this.updateRoleRes();
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    private applyModernDraw(): void {
        ui().localizeNode(this.node);
        ui().applyAncientScreenChrome(this.node, 'Chiêu mộ');

        const left = ui().ensureUiChild(this.node, '__DrawInfoPanel');
        left.setPosition(-430, -30, 0);
        left.setSiblingIndex(this.node.children.length - 2);
        ui().drawAncientPanel(left, 310, 500, 10);
        const leftTitle = ui().createUiText(
            left,
            '__DrawInfoTitle',
            'CHIÊU MỘ DANH TƯỚNG',
            22,
            ui().ANCIENT_UI.gold,
            260,
            52,
            true,
        );
        leftTitle.node.setPosition(0, 190, 0);
        const info = ui().createUiText(
            left,
            '__DrawInfoText',
            'Dùng Vàng để chiêu mộ tướng. Kết quả được xác nhận trực tiếp từ máy chủ.',
            16,
            ui().ANCIENT_UI.text,
            260,
            150,
        );
        info.enableWrapText = true;
        info.overflow = Label.Overflow.RESIZE_HEIGHT;
        info.node.setPosition(0, 65, 0);

        const right = ui().ensureUiChild(this.node, '__DrawActionPanel');
        right.setPosition(430, -30, 0);
        right.setSiblingIndex(this.node.children.length - 2);
        ui().drawAncientPanel(right, 330, 500, 10);
        const actionTitle = ui().createUiText(
            right,
            '__DrawActionTitle',
            'CHIÊU MỘ',
            24,
            ui().ANCIENT_UI.gold,
            220,
            46,
            true,
        );
        actionTitle.node.setPosition(0, 192, 0);

        const close = ui().findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            ui().styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }

        const once = ui().findButtonByHandler(this.node, 'drawGeneralOnce');
        if (once) {
            once.node.setParent(right);
            once.node.setPosition(0, 80, 0);
            ui().styleAncientButton(once.node, 'Chiêu mộ 1 lần', 'jade', 240, 62);
        }

        const ten = ui().findButtonByHandler(this.node, 'drawGeneralTen');
        if (ten) {
            ten.node.setParent(right);
            ten.node.setPosition(0, -85, 0);
            ui().styleAncientButton(ten.node, 'Chiêu mộ 10 lần', 'gold', 240, 62);
        }

        if (this.labelOnce) {
            this.labelOnce.useSystemFont = true;
            this.labelOnce.fontFamily = 'Arial';
            this.labelOnce.fontSize = 16;
            this.labelOnce.color = ui().ANCIENT_UI.muted;
        }
        if (this.labelTen) {
            this.labelTen.useSystemFont = true;
            this.labelTen.fontFamily = 'Arial';
            this.labelTen.fontSize = 16;
            this.labelTen.color = ui().ANCIENT_UI.muted;
        }
        if (this.cntLab) {
            this.cntLab.useSystemFont = true;
            this.cntLab.fontFamily = 'Arial';
            this.cntLab.fontSize = 18;
            this.cntLab.color = ui().ANCIENT_UI.gold;
            this.cntLab.node.setParent(right);
            this.cntLab.node.setPosition(0, -192, 0);
            ui().ensureUiTransform(this.cntLab.node, 250, 34);
        }
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }

    protected updateRoleRes(): void {
        const commonCfg: GeneralCommonConfig = GeneralCommand.getInstance().proxy.getCommonCfg();
        const roleResData = LoginCommand.getInstance().proxy.getRoleResData();
        this.labelOnce.string = `Tiêu hao: ${commonCfg.draw_general_cost} / ${roleResData.gold}`;
        this.labelTen.string = `Tiêu hao: ${commonCfg.draw_general_cost * 10} / ${roleResData.gold}`;

        const basic = MapUICommand.getInstance().proxy.getBasicGeneral();
        const cnt = GeneralCommand.getInstance().proxy.getMyActiveGeneralCnt();
        this.cntLab.string = `Tướng đã sở hữu: ${cnt}/${basic.limit}`;
    }

    protected drawGeneralOnce(): void {
        AudioManager.instance.playClick();
        GeneralCommand.getInstance().drawGenerals();
        EventMgr.emit(LogicEvent.showWaiting);
    }

    protected drawGeneralTen(): void {
        AudioManager.instance.playClick();
        GeneralCommand.getInstance().drawGenerals(10);
        EventMgr.emit(LogicEvent.showWaiting);
    }
}
