import { _decorator, Component, Label, Node, Prefab, ScrollView, instantiate } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { EventMgr } from '../../utils/EventMgr';
import ListLogic from '../../utils/ListLogic';
import MapUICommand from './MapUICommand';
import { WarReport } from './MapUIProxy';
import WarReportDesLogic from './WarReportDesLogic';

function ui(): any {
    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;
    if (!bridge) {
        throw new Error('Ancient UI bridge has not been initialized.');
    }
    return bridge;
}


@ccclass('WarReportLogic')
export default class WarReportLogic extends Component {
    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Prefab)
    warPortDesPrefab: Prefab = null;
    private _warPortDesNode: Node = null;

    protected onEnable(): void {
        this.applyModernReport();
        EventMgr.on(LogicEvent.upateWarReport, this.initView, this);
        EventMgr.on(LogicEvent.clickWarReport, this.openWarPortDes, this);
        EventMgr.on(LogicEvent.closeReport, this.close, this);
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    private applyModernReport(): void {
        ui().applyAncientScreenChrome(this.node, 'Chiến báo');

        this.scrollView.node.setPosition(-285, -8, 0);
        ui().ensureUiTransform(this.scrollView.node, 610, 500);
        const view = this.scrollView.node.getChildByName('view') || this.scrollView.node.getChildByName('View');
        if (view) {
            ui().ensureUiTransform(view, 610, 500);
        }
        if (this.scrollView.content) {
            ui().ensureUiTransform(this.scrollView.content, 610, 500);
        }

        const detail = ui().ensureUiChild(this.node, '__ReportDetailPlaceholder');
        detail.setPosition(350, -8, 0);
        detail.setSiblingIndex(this.node.children.length - 2);
        ui().drawAncientPanel(detail, 470, 500, 10);
        const detailTitle = ui().createUiText(
            detail,
            '__ReportDetailTitle',
            'CHI TIẾT CHIẾN BÁO',
            21,
            ui().ANCIENT_UI.gold,
            360,
            48,
            true,
        );
        detailTitle.node.setPosition(0, 190, 0);
        const detailHint = ui().createUiText(
            detail,
            '__ReportDetailHint',
            'Chọn một chiến báo ở danh sách bên trái để xem dữ liệu trận đánh từ máy chủ.',
            16,
            ui().ANCIENT_UI.muted,
            360,
            110,
        );
        detailHint.enableWrapText = true;
        detailHint.overflow = Label.Overflow.RESIZE_HEIGHT;
        detailHint.node.setPosition(0, 20, 0);

        const close = ui().findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            ui().styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
        const allReadButton = ui().findButtonByHandler(this.node, 'allRead');
        if (allReadButton) {
            allReadButton.node.setPosition(485, 320, 0);
            ui().styleAncientButton(allReadButton.node, 'Đánh dấu đã đọc', 'gold', 210, 48);
            allReadButton.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    private close(): void {
        this.node.active = false;
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.close();
    }

    protected initView(): void {
        const report: WarReport[] = MapUICommand.getInstance().proxy.getWarReport();
        const comp = this.scrollView.node.getComponent(ListLogic);
        comp.setData(report);
    }

    public updateView(): void {
        this.initView();
        MapUICommand.getInstance().qryWarReport();
    }

    protected openWarPortDes(data: WarReport): void {
        if (this._warPortDesNode == null) {
            this._warPortDesNode = instantiate(this.warPortDesPrefab);
            this._warPortDesNode.parent = this.node;
        } else {
            this._warPortDesNode.active = true;
        }
        this._warPortDesNode.setSiblingIndex(this.node.children.length - 1);
        this._warPortDesNode.getComponent(WarReportDesLogic).setData(data);
    }

    protected allRead(): void {
        AudioManager.instance.playClick();
        MapUICommand.getInstance().warRead(0);
    }
}
