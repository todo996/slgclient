import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    ScrollView,
    Sprite,
    UITransform,
    instantiate,
} from 'cc';
import { AudioManager } from '../../common/AudioManager';

const { ccclass, property } = _decorator;
import { WarReport } from "./MapUIProxy";
import WarReportDesItemLogic from './WarReportDesItemLogic';
import {
    createGameText,
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

@ccclass('WarReportDesLogic')
export default class WarReportDesLogic extends Component {

    private _curData:WarReport = null;

    @property(ScrollView)
    scrollView:ScrollView = null;

    @property(Node)
    item:Node = null;

    _lastY:number = 0;
    _curNum:number = 0;

    onLoad(){
        this.item.active = false;
        this.scrollView.node.on("scroll-to-bottom", this.scrollToBottom, this);
        this.applyModernLayout();
    }

    onEnable(){
        this.applyModernLayout();
        this.scrollView.scrollToTop();
    }

    protected onDestroy(): void {
        this.scrollView.node.off("scroll-to-bottom", this.scrollToBottom, this);
    }

    private applyModernLayout(): void {
        const panel = this.node.getChildByName('New Node');
        if (panel) {
            for (const sprite of panel.getComponents(Sprite)) {
                sprite.enabled = false;
            }
        }

        const width = 1180;
        const height = 650;
        const surface = ensureChild(this.node, '__WarDetailSurface');
        surface.setPosition(0, 0, 0);
        surface.setSiblingIndex(Math.min(1, this.node.children.length - 1));
        ensureTransform(surface, width, height);
        const graphics = surface.getComponent(Graphics) || surface.addComponent(Graphics);
        graphics.clear();
        graphics.fillColor = new Color(8, 8, 7, 238);
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.fill();
        graphics.fillColor = new Color(35, 27, 20, 110);
        graphics.roundRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, 8);
        graphics.fill();
        graphics.strokeColor = new Color(182, 128, 62, 235);
        graphics.lineWidth = 2.5;
        graphics.roundRect(-width / 2, -height / 2, width, height, 12);
        graphics.stroke();

        const header = ensureChild(this.node, '__WarDetailHeader');
        header.setPosition(0, 287, 0);
        header.setSiblingIndex(this.node.children.length - 1);
        ensureTransform(header, 1110, 70);
        const hg = header.getComponent(Graphics) || header.addComponent(Graphics);
        hg.clear();
        hg.fillColor = new Color(15, 12, 10, 245);
        hg.rect(-555, -35, 1110, 70);
        hg.fill();
        hg.strokeColor = new Color(171, 119, 58, 220);
        hg.lineWidth = 1.5;
        hg.moveTo(-555, -34);
        hg.lineTo(555, -34);
        hg.stroke();

        const title = createGameText(
            header,
            '__WarDetailTitle',
            'CHI TIẾT CHIẾN BÁO',
            34,
            GameTheme.colors.gold300,
            520,
            52,
            true,
        );
        title.node.setPosition(0, 0, 0);

        const summary = createGameText(
            this.node,
            '__WarDetailSummary',
            this.reportSummary(),
            15,
            GameTheme.colors.muted,
            760,
            32,
        );
        summary.horizontalAlign = HorizontalTextAlignment.LEFT;
        summary.node.setPosition(-150, 236, 0);
        summary.node.setSiblingIndex(this.node.children.length - 1);

        const close = findButton(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-548, 287, 0);
            styleGameButton(close.node, '←', 'secondary', 72, 50);
            for (const label of close.node.getComponentsInChildren(Label)) {
                if (label.node.name !== '__GameLabel') {
                    label.node.active = false;
                }
            }
            const modern = close.node.getChildByName('__GameLabel');
            if (modern) {
                modern.active = true;
                modern.setSiblingIndex(close.node.children.length - 1);
            }
            close.node.setSiblingIndex(this.node.children.length - 1);
        }

        this.scrollView.node.setPosition(0, -47, 0);
        ensureTransform(this.scrollView.node, 1080, 520);
        const view = this.scrollView.node.getChildByName('view') || this.scrollView.node.getChildByName('View');
        if (view) {
            ensureTransform(view, 1080, 520);
        }
        if (this.scrollView.content) {
            const contentTransform = this.scrollView.content.getComponent(UITransform) || this.scrollView.content.addComponent(UITransform);
            contentTransform.width = 1040;
        }
        this.scrollView.node.setSiblingIndex(this.node.children.length - 1);
    }

    private reportSummary(): string {
        if (!this._curData) {
            return 'Diễn biến từng hiệp của trận chiến';
        }
        const result = this._curData.result === 0 ? 'Thất bại'
            : this._curData.result === 1 ? 'Hòa'
            : 'Chiến thắng';
        const rounds = this._curData.rounds ? this._curData.rounds.length : 0;
        return `Kết quả: ${result}   ·   Tọa độ: (${this._curData.x}, ${this._curData.y})   ·   ${rounds} lượt diễn biến`;
    }

    public setData(data:any):void{
        this.scrollView.content.removeAllChildren();
        this._curData = data;
        this._curNum =  0;
        this.applyModernLayout();
        this.make();
        this.scrollView.scrollToTop();
    }

    private make() {
        if (!this._curData || !this._curData.rounds) {
            return;
        }
        let max = Math.min(6, this._curData.rounds.length-this._curNum);
        if (max <= 0) {
            return;
        }

        for (let index = this._curNum; index < this._curNum + max; index++) {
            let r = this._curData.rounds[index];
            let item = instantiate(this.item);
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
}
