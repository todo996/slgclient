import { _decorator, Button, Color, Component, Graphics, ScrollView, Label, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import GeneralCommand from "../../general/GeneralCommand";
import MapUICommand from "./MapUICommand";
import { EventMgr } from '../../utils/EventMgr';
import ListLogic from '../../utils/ListLogic';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';

type HeroFilterMode = 'all' | 'rarity' | 'level' | 'formation';

@ccclass('GeneralListLogic')
export default class GeneralListLogic extends Component {

    @property(ScrollView)
    scrollView:ScrollView = null;

    @property(Label)
    cntLab:Label = null;

    private _cunGeneral:number[] = [];
    private _type:number = 0;
    private _position:number = 0;
    private _filterMode: HeroFilterMode = 'all';
    private _referenceBuilt = false;
    private _filterLabels: {[key: string]: Label} = {};

    protected onEnable():void{
        if (!this._referenceBuilt) {
            this.buildReferenceRosterUI();
        }
        EventMgr.on(LogicEvent.updateMyGenerals, this.initGeneralCfg, this);
        EventMgr.on(LogicEvent.generalConvert, this.initGeneralCfg, this);
        EventMgr.on(LogicEvent.chosedGeneral, this.onClickClose, this);
    }

    protected onDisable():void{
        EventMgr.targetOff(this);
    }

    /**
     * Thay toàn bộ khung danh sách Tướng cũ bằng hierarchy mới.
     * ScrollView thật được chuyển sang khung mới nên ListLogic và dữ liệu server không đổi.
     */
    private buildReferenceRosterUI(): void {
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceHeroRoster');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);

        this.makePanel(root, 'Backdrop', 1280, 720, 0, 0, new Color(13, 10, 8, 248), new Color(74, 49, 27, 255), 1, 0);
        this.makePanel(root, 'HeaderBar', 1240, 76, 0, 310, new Color(23, 17, 12, 250), new Color(151, 109, 54, 255), 2, 8);
        this.makeLabel(root, 'Title', 'TƯỚNG', -520, 310, 32, new Color(233, 194, 116, 255), true, 170);
        this.makeLabel(root, 'SubTitle', 'Danh sách võ tướng', -345, 310, 15, new Color(153, 132, 99, 255), false, 180);
        this.makeButton(root, 'Close', 'ĐÓNG', 550, 310, 100, 42, () => this.onClickClose(), false, 14);

        const filterBar = this.makePanel(root, 'FilterBar', 760, 54, -175, 248, new Color(20, 15, 11, 238), new Color(92, 66, 36, 255), 1, 8);
        const filters: Array<{mode: HeroFilterMode; title: string}> = [
            {mode: 'all', title: 'TẤT CẢ'},
            {mode: 'rarity', title: 'HIẾM'},
            {mode: 'level', title: 'CẤP'},
            {mode: 'formation', title: 'ĐỘI HÌNH'},
        ];
        filters.forEach((filter, index) => {
            const button = this.makeButton(filterBar, `Filter_${filter.mode}`, filter.title, -270 + index * 180, 0, 164, 38, () => this.setFilter(filter.mode), false, 14);
            this._filterLabels[filter.mode] = button.getChildByName(`Filter_${filter.mode}_label`).getComponent(Label);
        });
        this.refreshFilterStyle();

        // ScrollView thật, ListLogic thật, prefab card thật.
        this.scrollView.node.parent = root;
        this.scrollView.node.active = true;
        this.scrollView.node.setPosition(0, -38, 0);
        const scrollTransform = this.scrollView.node.getComponent(UITransform);
        if (scrollTransform) {
            scrollTransform.setContentSize(1120, 535);
        }

        // Bộ đếm thật ở góc dưới giống cấu trúc ảnh mẫu.
        this.cntLab.node.parent = root;
        this.cntLab.node.active = true;
        this.cntLab.node.setPosition(444, -326, 0);
        this.cntLab.color = new Color(220, 198, 158, 255);
        this.cntLab.fontSize = 16;

        this.makeLabel(root, 'OwnedLabel', 'Đã sở hữu', 350, -326, 15, new Color(145, 125, 95, 255), false, 90);
        this.makeButton(root, 'Convert', 'CHUYỂN HÓA', -170, -326, 156, 42, () => this.onClickConvert(), false, 13);
        this.makeButton(root, 'Roster', 'ĐỒ GIÁM', 8, -326, 150, 42, () => this.onTuJianConvert(), false, 13);

        // Tắt hoàn toàn panel/nút/khung cũ sau khi hai node dữ liệu thật đã được chuyển ra.
        legacyRoots.forEach((child) => {
            if (child !== root && child !== this.scrollView.node && child !== this.cntLab.node) {
                child.active = false;
            }
        });
    }

    private setFilter(mode: HeroFilterMode): void {
        AudioManager.instance.playClick();
        this._filterMode = mode;
        this.refreshFilterStyle();
        this.initGeneralCfg();
    }

    private refreshFilterStyle(): void {
        Object.keys(this._filterLabels).forEach((key) => {
            const label = this._filterLabels[key];
            if (!label) return;
            const active = key === this._filterMode;
            label.color = active ? new Color(244, 211, 137, 255) : new Color(172, 151, 116, 255);
        });
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }

    protected onClickConvert(): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.openGeneralConvert);
        this.node.active = false;
    }

    protected onTuJianConvert(): void {
        AudioManager.instance.playClick();
        EventMgr.emit(LogicEvent.openGeneralRoster);
        this.node.active = false;
    }

    protected initGeneralCfg():void{
        const basic = MapUICommand.getInstance().proxy.getBasicGeneral();
        const cnt = GeneralCommand.getInstance().proxy.getMyActiveGeneralCnt();
        this.cntLab.string = `${cnt}/${basic.limit}`;

        const list:any[] = GeneralCommand.getInstance().proxy.getUseGenerals();
        let listTemp = list.concat();

        listTemp.forEach(item => {
            item.type = this._type;
            item.position = this._position;
        });

        for(let i = 0; i < listTemp.length; i++){
            if(this._cunGeneral.indexOf(listTemp[i].id) >= 0 ){
                listTemp.splice(i,1);
                i--;
            }
        }

        if (this._filterMode === 'level') {
            listTemp.sort((a, b) => (b.level || 0) - (a.level || 0));
        } else if (this._filterMode === 'rarity') {
            listTemp.sort((a, b) => {
                const bCfg = GeneralCommand.getInstance().proxy.getGeneralCfg(b.cfgId);
                const aCfg = GeneralCommand.getInstance().proxy.getGeneralCfg(a.cfgId);
                return ((bCfg && bCfg.star) || 0) - ((aCfg && aCfg.star) || 0);
            });
        } else if (this._filterMode === 'formation') {
            listTemp = listTemp.filter(item => (item.order || 0) > 0);
        }

        const comp = this.scrollView.node.getComponent(ListLogic);
        comp.setData(listTemp);
    }

    public setData(data:number[],type:number = 0,position:number = 0):void{
        this._cunGeneral = [];
        if(data && data.length > 0){
            this._cunGeneral = data;
        }

        this._type = type;
        this._position = position;

        this.initGeneralCfg();
        GeneralCommand.getInstance().qryMyGenerals();
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

    private makeLabel(parent: Node, name: string, text: string, x: number, y: number, fontSize: number, color: Color, bold: boolean, width: number): Label {
        const node = new Node(name);
        node.parent = parent;
        node.layer = this.node.layer;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, Math.max(28, fontSize + 10));
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 5;
        label.color = color;
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }

    private makeButton(parent: Node, name: string, text: string, x: number, y: number, width: number, height: number, callback: () => void, primary: boolean, fontSize: number): Node {
        const node = this.makePanel(parent, name, width, height, x, y, primary ? new Color(107, 70, 31, 255) : new Color(28, 20, 14, 248), primary ? new Color(229, 187, 102, 255) : new Color(119, 85, 44, 255), 2, 7);
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        node.on(Button.EventType.CLICK, callback, this);
        this.makeLabel(node, `${name}_label`, text, 0, 0, fontSize, new Color(230, 208, 168, 255), true, width - 10);
        return node;
    }
}