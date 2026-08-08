import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import GeneralCommand from '../../general/GeneralCommand';
import { GeneralCommonConfig } from '../../general/GeneralProxy';
import {
    ANCIENT_UI,
    applyAncientScreenChrome,
    createUiText,
    drawAncientPanel,
    ensureUiChild,
    ensureUiTransform,
    findButtonByHandler,
    localizeNode,
    styleAncientButton,
} from '../../common/AudioManager';
import LoginCommand from '../../login/LoginCommand';
import { EventMgr } from '../../utils/EventMgr';
import MapUICommand from './MapUICommand';

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
        localizeNode(this.node);
        applyAncientScreenChrome(this.node, 'Chiêu mộ');

        const left = ensureUiChild(this.node, '__DrawInfoPanel');
        left.setPosition(-430, -30, 0);
        left.setSiblingIndex(this.node.children.length - 2);
        drawAncientPanel(left, 310, 500, 10);
        const leftTitle = createUiText(
            left,
            '__DrawInfoTitle',
            'CHIÊU MỘ DANH TƯỚNG',
            22,
            ANCIENT_UI.gold,
            260,
            52,
            true,
        );
        leftTitle.node.setPosition(0, 190, 0);
        const info = createUiText(
            left,
            '__DrawInfoText',
            'Dùng Vàng để chiêu mộ tướng. Kết quả được xác nhận trực tiếp từ máy chủ.',
            16,
            ANCIENT_UI.text,
            260,
            150,
        );
        info.enableWrapText = true;
        info.overflow = Label.Overflow.RESIZE_HEIGHT;
        info.node.setPosition(0, 65, 0);

        const right = ensureUiChild(this.node, '__DrawActionPanel');
        right.setPosition(430, -30, 0);
        right.setSiblingIndex(this.node.children.length - 2);
        drawAncientPanel(right, 330, 500, 10);
        const actionTitle = createUiText(
            right,
            '__DrawActionTitle',
            'CHIÊU MỘ',
            24,
            ANCIENT_UI.gold,
            220,
            46,
            true,
        );
        actionTitle.node.setPosition(0, 192, 0);

        const close = findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }

        const once = findButtonByHandler(this.node, 'drawGeneralOnce');
        if (once) {
            once.node.setParent(right);
            once.node.setPosition(0, 80, 0);
            styleAncientButton(once.node, 'Chiêu mộ 1 lần', 'jade', 240, 62);
        }

        const ten = findButtonByHandler(this.node, 'drawGeneralTen');
        if (ten) {
            ten.node.setParent(right);
            ten.node.setPosition(0, -85, 0);
            styleAncientButton(ten.node, 'Chiêu mộ 10 lần', 'gold', 240, 62);
        }

        if (this.labelOnce) {
            this.labelOnce.useSystemFont = true;
            this.labelOnce.fontFamily = 'Arial';
            this.labelOnce.fontSize = 16;
            this.labelOnce.color = ANCIENT_UI.muted;
        }
        if (this.labelTen) {
            this.labelTen.useSystemFont = true;
            this.labelTen.fontFamily = 'Arial';
            this.labelTen.fontSize = 16;
            this.labelTen.color = ANCIENT_UI.muted;
        }
        if (this.cntLab) {
            this.cntLab.useSystemFont = true;
            this.cntLab.fontFamily = 'Arial';
            this.cntLab.fontSize = 18;
            this.cntLab.color = ANCIENT_UI.gold;
            this.cntLab.node.setParent(right);
            this.cntLab.node.setPosition(0, -192, 0);
            ensureUiTransform(this.cntLab.node, 250, 34);
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
