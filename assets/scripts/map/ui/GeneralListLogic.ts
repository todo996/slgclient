import { _decorator, Button, Color, Component, Graphics, ScrollView, Label, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import GeneralCommand from "../../general/GeneralCommand";
import LoginCommand from "../../login/LoginCommand";
import MapUICommand from "./MapUICommand";
import { EventMgr } from '../../utils/EventMgr';
import ListLogic from '../../utils/ListLogic';
import { AudioManager } from '../../common/AudioManager';
import { LogicEvent } from '../../common/LogicEvent';
import { Tools } from '../../utils/Tools';

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

    /** Dựng màn Tướng mới theo bố cục ảnh mẫu, giữ ScrollView/ListLogic thật. */
    private buildReferenceRosterUI(): void {
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceHeroRoster');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);

        this.makePanel(root, 'Backdrop', 1280, 720, 0, 0, new Color(10, 8, 7, 248), new Color(58, 38, 22, 255), 1, 0);

        // Header mảnh như ảnh mẫu, không dùng bảng tiêu đề cũ.
        const header = this.makePanel(root, 'HeaderBar', 1248, 64, 0, 322, new Color(20, 14, 10, 248), new Color(147, 102, 49, 255), 2, 7);
        this.makeLabel(header, 'Title', 'TƯỚNG', -518, 0, 28, new Color(239, 200, 121, 255), true, 154);
        this.makeLabel(header, 'SubTitle', 'Danh sách võ tướng', -360, 0, 13, new Color(145, 126, 96, 255), false, 160);

        // Chỉ hiển thị tài nguyên thật đang có trong role_res.
        const roleRes = LoginCommand.getInstance().proxy.getRoleResData() || {};
        const resources = [
            {title: 'Vàng', key: 'gold'},
            {title: 'Lương', key: 'grain'},
            {title: 'Đá', key: 'stone'},
        ];
        resources.forEach((item, index) => {
            const chip = this.makePanel(header, `Resource_${item.key}`, 140, 38, 130 + index * 145, 0, new Color(12, 10, 8, 230), new Color(91, 63, 34, 240), 1, 6);
            this.makeLabel(chip, `${item.key}_name`, item.title, -40, 0, 11, new Color(167, 141, 99, 255), true, 52);
            this.makeLabel(chip, `${item.key}_value`, Tools.numberToShow(roleRes[item.key] || 0), 29, 0, 14, new Color(238, 216, 170, 255), true, 74);
        });
        this.makeButton(header, 'Close', 'ĐÓNG', 554, 0, 92, 38, () => this.onClickClose(), false, 13);

        // Thanh lọc sát ngay dưới header giống mẫu.
        const filterBar = this.makePanel(root, 'FilterBar', 760, 48, -206, 257, new Color(17, 13, 10, 230), new Color(85, 59, 32, 235), 1, 7);
        const filters: Array<{mode: HeroFilterMode; title: string}> = [
            {mode: 'all', title: 'Tất cả'},
            {mode: 'rarity', title: 'Hiếm'},
            {mode: 'level', title: 'Cấp'},
            {mode: 'formation', title: 'Đội hình'},
        ];
        filters.forEach((filter, index) => {
            const button = this.makeButton(filterBar, `Filter_${filter.mode}`, filter.title, -270 + index * 180, 0, 162, 34, () => this.setFilter(filter.mode), false, 13);
            this._filterLabels[filter.mode] = button.getChildByName(`Filter_${filter.mode}_label`).getComponent(Label);
        });
        this.refreshFilterStyle();

        this.makeLabel(root, 'FilterHint', 'Chạm vào một tướng để xem chi tiết', 394, 257, 12, new Color(132, 116, 90, 255), false, 320);

        // Vùng 5 cột x 2 hàng được ListLogic thật xử lý từ prefab (columnCount=5, scale=.54).
        const gridFrame = this.makePanel(root, 'GridFrame', 1196, 500, 0, -15, new Color(13, 10, 8, 224), new Color(80, 55, 31, 220), 1, 8);
        this.makePanel(gridFrame, 'GridTopLine', 1166, 1, 0, 232, new Color(105, 72, 36, 190), new Color(0, 0, 0, 0), 0, 0);

        this.scrollView.node.parent = root;
        this.scrollView.node.active = true;
        this.scrollView.node.setPosition(0, -14, 0);
        const scrollTransform = this.scrollView.node.getComponent(UITransform);
        if (scrollTransform) scrollTransform.setContentSize(1160, 472);

        // Ép ListLogic giữ đúng grid 5 cột; không thay dữ liệu hay tạo card giả.
        const list = this.scrollView.node.getComponent(ListLogic);
        if (list) {
            list.columnCount = 5;
            list.autoColumnCount = false;
            list.spaceColumn = 18;
            list.spaceRow = 16;
        }

        // Footer theo mẫu: số lượng sở hữu bên trái, công cụ bên phải.
        const footer = this.makePanel(root, 'FooterBar', 1248, 52, 0, -329, new Color(18, 13, 10, 244), new Color(112, 77, 38, 240), 1, 6);
        this.makeLabel(footer, 'OwnedLabel', 'Đã sở hữu', -512, 0, 13, new Color(145, 125, 95, 255), false, 90);
        this.cntLab.node.parent = footer;
        this.cntLab.node.active = true;
        this.cntLab.node.setPosition(-433, 0, 0);
        this.cntLab.color = new Color(226, 202, 159, 255);
        this.cntLab.fontSize = 15;
        const cntTransform = this.cntLab.node.getComponent(UITransform);
        if (cntTransform) cntTransform.setContentSize(80, 30);
        this.makeButton(footer, 'Convert', 'CHUYỂN HÓA', 392, 0, 150, 36, () => this.onClickConvert(), false, 12);
        this.makeButton(footer, 'Roster', 'ĐỒ GIÁM', 538, 0, 118, 36, () => this.onTuJianConvert(), false, 12);

        legacyRoots.forEach((child) => {
            if (child !== root && child !== this.scrollView.node && child !== this.cntLab.node) child.active = false;
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
            label.color = active ? new Color(247, 211, 133, 255) : new Color(163, 143, 109, 255);
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
        if(data && data.length > 0) this._cunGeneral = data;
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
        const node = this.makePanel(parent, name, width, height, x, y, primary ? new Color(107, 70, 31, 255) : new Color(25, 18, 13, 248), primary ? new Color(229, 187, 102, 255) : new Color(116, 82, 43, 255), 2, 6);
        const button = node.addComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 0.96;
        node.on(Button.EventType.CLICK, callback, this);
        this.makeLabel(node, `${name}_label`, text, 0, 0, fontSize, new Color(231, 209, 168, 255), true, width - 10);
        return node;
    }
}
