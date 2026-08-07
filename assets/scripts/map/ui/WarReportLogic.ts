import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    Prefab,
    ScrollView,
    Sprite,
    UITransform,
    instantiate,
} from 'cc';
const { ccclass, property } = _decorator;

import MapUICommand from "./MapUICommand";
import { WarReport } from "./MapUIProxy";
import WarReportDesLogic from './WarReportDesLogic';
import { EventMgr } from '../../utils/EventMgr';
import ListLogic from '../../utils/ListLogic';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { localizeNode } from '../../i18n/I18n';
import { styleModernCityPanel } from '../../ui/components/MapHudSurface';
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

function styleRealButton(button: Button, text: string, width: number, height: number): void {
    styleGameButton(button.node, text, 'secondary', width, height);
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

function applyWarReportLayout(root: Node, scrollView: ScrollView): void {
    const panel = root.getChildByName('New Node');
    if (panel) {
        for (const sprite of panel.getComponents(Sprite)) {
            sprite.enabled = false;
        }
        drawGamePanel(panel, 1180, 650, 10);
    }

    const header = ensureChild(root, '__WarReportHeader');
    header.setPosition(0, 318, 0);
    ensureTransform(header, 1130, 76);
    const headerGraphics = header.getComponent(Graphics) || header.addComponent(Graphics);
    headerGraphics.clear();
    headerGraphics.fillColor = new Color(12, 10, 9, 238);
    headerGraphics.rect(-565, -38, 1130, 76);
    headerGraphics.fill();
    headerGraphics.strokeColor = new Color(176, 124, 59, 225);
    headerGraphics.lineWidth = 2;
    headerGraphics.moveTo(-565, -36);
    headerGraphics.lineTo(565, -36);
    headerGraphics.stroke();

    const title = createGameText(
        header,
        '__WarReportTitle',
        'CHIẾN BÁO',
        40,
        GameTheme.colors.gold300,
        420,
        58,
        true,
    );
    title.node.setPosition(0, 0, 0);

    const hint = createGameText(
        root,
        '__WarReportHint',
        'Lịch sử giao tranh gần đây',
        16,
        GameTheme.colors.muted,
        360,
        34,
    );
    hint.horizontalAlign = HorizontalTextAlignment.LEFT;
    hint.node.setPosition(-375, 266, 0);

    scrollView.node.setPosition(0, -18, 0);
    ensureTransform(scrollView.node, 1090, 500);
    const view = scrollView.node.getChildByName('view');
    if (view) {
        ensureTransform(view, 1090, 500);
    }
    if (scrollView.content) {
        const contentTransform = scrollView.content.getComponent(UITransform) || scrollView.content.addComponent(UITransform);
        contentTransform.width = 1090;
    }

    const list = scrollView.node.getComponent(ListLogic) as any;
    if (list) {
        list.columnCount = 1;
        list.autoColumnCount = false;
        list.isHorizontal = false;
        list.spaceRow = 12;
        list.spaceColumn = 0;
    }

    const close = findButton(root, 'onClickClose');
    if (close) {
        close.node.setParent(root);
        close.node.active = true;
        close.node.setPosition(-574, 318, 0);
        styleRealButton(close, '←', 72, 52);
    }

    const readAll = findButton(root, 'allRead');
    if (readAll) {
        readAll.node.setParent(root);
        readAll.node.active = true;
        readAll.node.setPosition(476, 265, 0);
        styleRealButton(readAll, 'Đánh dấu đã đọc', 220, 46);
    }
}

@ccclass('WarReportLogic')
export default class WarReportLogic extends Component {

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Prefab)
    warPortDesPrefab: Prefab = null;
    private _warPortDesNode: Node = null;

    protected onEnable(): void {
        localizeNode(this.node);
        applyWarReportLayout(this.node, this.scrollView);
        EventMgr.on(LogicEvent.upateWarReport, this.initView, this);
        EventMgr.on(LogicEvent.clickWarReport, this.openWarPortDes, this);
        EventMgr.on(LogicEvent.closeReport, this.close, this);
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    private close(): void {
        this.node.active = false;
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.close();
    }

    protected initView(): void {
        var report: WarReport[] = MapUICommand.getInstance().proxy.getWarReport();
        var comp = this.scrollView.node.getComponent(ListLogic);
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

        localizeNode(this._warPortDesNode);
        styleModernCityPanel(this._warPortDesNode);
        this._warPortDesNode.getComponent(WarReportDesLogic).setData(data);
    }

    protected allRead(): void {
        AudioManager.instance.playClick();
        MapUICommand.getInstance().warRead(0);
    }
}
