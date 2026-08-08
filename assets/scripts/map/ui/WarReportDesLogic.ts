import { _decorator, Component, Label, Node, ScrollView, instantiate } from 'cc';
import { AudioManager } from '../../common/AudioManager';
import {
    ANCIENT_UI,
    createUiText,
    drawAncientPanel,
    ensureUiTransform,
    findButtonByHandler,
    localizeNode,
    styleAncientButton,
    suppressLegacyChrome,
} from '../../common/AudioManager';

const { ccclass, property } = _decorator;
import { WarReport } from './MapUIProxy';
import WarReportDesItemLogic from './WarReportDesItemLogic';

@ccclass('WarReportDesLogic')
export default class WarReportDesLogic extends Component {
    private _curData: WarReport = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(Node)
    item: Node = null;

    _lastY = 0;
    _curNum = 0;

    protected onLoad(): void {
        this.item.active = false;
        this.scrollView.node.on('scroll-to-bottom', this.scrollToBottom, this);
        this.applyModernDetail();
    }

    protected onEnable(): void {
        this.scrollView.scrollToTop();
        this.applyModernDetail();
    }

    private applyModernDetail(): void {
        localizeNode(this.node);
        suppressLegacyChrome(this.node, 3);
        this.node.setPosition(350, -8, 0);
        drawAncientPanel(this.node, 500, 520, 10);

        const title = createUiText(
            this.node,
            '__WarDetailTitle',
            'CHI TIẾT CHIẾN ĐẤU',
            20,
            ANCIENT_UI.gold,
            360,
            44,
            true,
        );
        title.node.setPosition(0, 222, 0);
        title.node.setSiblingIndex(this.node.children.length - 1);

        this.scrollView.node.setPosition(0, -12, 0);
        ensureUiTransform(this.scrollView.node, 450, 410);
        const view = this.scrollView.node.getChildByName('view') || this.scrollView.node.getChildByName('View');
        if (view) {
            ensureUiTransform(view, 450, 410);
        }
        if (this.scrollView.content) {
            ensureUiTransform(this.scrollView.content, 450, 410);
        }

        const close = findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(214, 222, 0);
            styleAncientButton(close.node, '×', 'dark', 46, 42);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    public setData(data: any): void {
        this.scrollView.content.removeAllChildren();
        this._curData = data;
        this._curNum = 0;
        this.make();
        this.scrollView.scrollToTop();
    }

    private make(): void {
        const max = Math.min(6, this._curData.rounds.length - this._curNum);
        for (let index = this._curNum; index < this._curNum + max; index += 1) {
            const round = this._curData.rounds[index];
            const item = instantiate(this.item);
            item.active = true;
            item.parent = this.scrollView.content;
            item.getComponent(WarReportDesItemLogic)
                .setData(round, this._curData, index == this._curData.rounds.length - 1);
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
}
