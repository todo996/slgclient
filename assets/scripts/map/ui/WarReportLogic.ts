import { _decorator, Button, Color, Component, Graphics, ScrollView, Prefab, Node, Label, UITransform, instantiate } from 'cc';
const { ccclass, property } = _decorator;

import LoginCommand from "../../login/LoginCommand";
import MapUICommand from "./MapUICommand";
import { WarReport } from "./MapUIProxy";
import WarReportDesLogic from './WarReportDesLogic';
import { EventMgr } from '../../utils/EventMgr';
import ListLogic from '../../utils/ListLogic';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

type ReportFilter = 'all' | 'attack' | 'defense';

@ccclass('WarReportLogic')
export default class WarReportLogic extends Component {

    @property(ScrollView)
    scrollView:ScrollView = null;

    @property(Prefab)
    warPortDesPrefab: Prefab = null;
    private _warPortDesNode:Node = null;
    private _referenceBuilt = false;
    private _filter: ReportFilter = 'all';
    private _filterLabels: {[key: string]: Label} = {};

    protected onEnable():void{
        if (!this._referenceBuilt) {
            this.buildReferenceReportUI();
        }
        EventMgr.on(LogicEvent.upateWarReport, this.initView, this);
        EventMgr.on(LogicEvent.clickWarReport, this.openWarPortDes, this);
        EventMgr.on(LogicEvent.closeReport, this.close, this);
    }

    protected onDisable():void{
        EventMgr.targetOff(this);
    }

    private buildReferenceReportUI():void{
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceWarReportUI');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);
        this.makePanel(root, 'Backdrop', 1280, 720, 0, 0, new Color(11, 9, 8, 251), new Color(64, 43, 24, 255), 1, 0);
        this.makePanel(root, 'Header', 1240, 70, 0, 315, new Color(23, 16, 11, 252), new Color(164, 116, 56, 255), 2, 8);
        this.makeLabel(root, 'Title', 'CHIẾN BÁO', -488, 315, 30, new Color(235, 196, 116, 255), true, 220);
        this.makeLabel(root, 'Subtitle', 'Ghi chép chiến trận', -300, 315, 14, new Color(149, 130, 100, 255), false, 190);
        this.makeButton(root, 'ReadAll', 'ĐỌC TẤT CẢ', 430, 315, 134, 40, () => this.allRead(), false, 13);
        this.makeButton(root, 'Close', 'ĐÓNG', 555, 315, 92, 40, () => this.onClickClose(), false, 13);

        const listPanel = this.makePanel(root, 'ListPanel', 430, 570, -395, -4, new Color(20, 15, 11, 248), new Color(120, 84, 43, 255), 2, 9);
        const tabs = this.makePanel(listPanel, 'FilterTabs', 398, 54, 0, 245, new Color(16, 12, 9, 248), new Color(79, 55, 31, 255), 1, 7);
        const modes: Array<{mode: ReportFilter; title: string}> = [
            {mode: 'all', title: 'TẤT CẢ'},
            {mode: 'attack', title: 'TẤN CÔNG'},
            {mode: 'defense', title: 'PHÒNG THỦ'},
        ];
        modes.forEach((entry, index) => {
            const button = this.makeButton(tabs, `Filter_${entry.mode}`, entry.title, -129 + index * 129, 0, 120, 38, () => this.setFilter(entry.mode), false, 12);
            this._filterLabels[entry.mode] = button.getChildByName(`Filter_${entry.mode}_label`).getComponent(Label);
        });

        this.scrollView.node.parent = listPanel;
        this.scrollView.node.active = true;
        this.scrollView.node.setPosition(0, -31, 0);
        const listTransform = this.scrollView.node.getComponent(UITransform);
        if (listTransform) listTransform.setContentSize(398, 480);

        const detailPanel = this.makePanel(root, 'DetailPlaceholder', 760, 570, 220, -4, new Color(15, 12, 10, 244), new Color(94, 65, 35, 255), 2, 9);
        this.makeLabel(detailPanel, 'DetailTitle', 'CHI TIẾT CHIẾN ĐẤU', 0, 214, 20, new Color(190, 159, 105, 255), true, 330);
        this.makeLabel(detailPanel, 'Hint', 'Chọn một chiến báo bên trái\nđể xem diễn biến trận đánh.', 0, 12, 17, new Color(123, 108, 86, 255), false, 450);

        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== root) child.active = false;
        });
        this.refreshFilterStyle();
    }

    private setFilter(filter: ReportFilter):void{
        AudioManager.instance.playClick();
        this._filter = filter;
        this.refreshFilterStyle();
        this.initView();
    }

    private refreshFilterStyle():void{
        Object.keys(this._filterLabels).forEach(key => {
            const label = this._filterLabels[key];
            if (!label) return;
            label.color = key === this._filter ? new Color(245, 209, 132, 255) : new Color(165, 144, 108, 255);
        });
    }

    private close() {
        this.node.active = false;
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.close();
    }

    protected initView():void{
        const role = LoginCommand.getInstance().proxy.getRoleData();
        let reports:WarReport[] = MapUICommand.getInstance().proxy.getWarReport();
        if (this._filter === 'attack') {
            reports = reports.filter(report => report.attack_rid === role.rid);
        } else if (this._filter === 'defense') {
            reports = reports.filter(report => report.defense_rid === role.rid);
        }
        const comp = this.scrollView.node.getComponent(ListLogic);
        comp.setData(reports);
    }

    public updateView():void{
        this.initView();
        MapUICommand.getInstance().qryWarReport();
    }

    protected openWarPortDes(data:WarReport):void{
        if (this._warPortDesNode == null) {
            this._warPortDesNode = instantiate(this.warPortDesPrefab);
            this._warPortDesNode.parent = this.node;
        } else {
            this._warPortDesNode.active = true;
        }
        this._warPortDesNode.setSiblingIndex(this.node.children.length + 1);
        this._warPortDesNode.getComponent(WarReportDesLogic).setData(data);
    }

    protected allRead():void{
        AudioManager.instance.playClick();
        MapUICommand.getInstance().warRead(0);
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
        node.addComponent(UITransform).setContentSize(width, Math.max(30, fontSize * 2 + 4));
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
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