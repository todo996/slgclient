import {
    _decorator,
    Button,
    Color,
    Component,
    EditBox,
    Graphics,
    HorizontalTextAlignment,
    Label,
    Node,
    VerticalTextAlignment,
} from 'cc';
const {ccclass, property} = _decorator;

import UnionCommand from "./UnionCommand";
import { Union } from "./UnionProxy";
import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import { EventMgr } from '../utils/EventMgr';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import {
    createGameText,
    ensureChild,
    ensureTransform,
    styleGameButton,
    styleGameInput,
} from '../ui/components/GameSurface';
import { GameTheme } from '../ui/theme/GameTheme';

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

function styleRealButton(
    button: Button,
    text: string,
    variant: 'primary' | 'secondary' | 'jade' | 'danger',
    width: number,
    height: number = 48,
): void {
    styleGameButton(button.node, text, variant, width, height);
    for (const label of button.node.getComponentsInChildren(Label)) {
        if (label.node.name !== '__GameLabel') {
            label.node.active = false;
        }
    }
    const modern = button.node.getChildByName('__GameLabel');
    if (modern) {
        modern.active = true;
        modern.setSiblingIndex(button.node.children.length - 1);
    }
}

@ccclass('UnionMainLogic')
export default class UnionMainLogic extends Component {
    @property(Label)
    nameLab: Label | null = null;
    @property(Label)
    mengZhuLab: Label | null = null;
    @property(Label)
    noticeLab: Label | null = null;
    @property(Node)
    editNode: Node | null = null;
    @property(EditBox)
    editBox: EditBox | null = null;
    @property(Button)
    modifyBtn: Button | null = null;
    @property(Button)
    applyBtn: Button | null = null;
    @property(Node)
    applyRedDot: Node | null = null;

    onLoad () {
        this.applyLayout();
        EventMgr.on(LogicEvent.unionNotice,this.onUnionNotice,this);
        EventMgr.on(LogicEvent.unionInfo,this.onInfo, this);
        EventMgr.on(LogicEvent.updateUnionApply, this.onUnionApply, this);
    }

    private applyLayout(): void {
        const identity = ensureChild(this.node, '__UnionIdentityCard');
        identity.setPosition(0, 174, 0);
        ensureTransform(identity, 880, 126);
        const ig = identity.getComponent(Graphics) || identity.addComponent(Graphics);
        ig.clear();
        ig.fillColor = new Color(29, 23, 18, 238);
        ig.roundRect(-440, -63, 880, 126, 12);
        ig.fill();
        ig.strokeColor = new Color(157, 108, 52, 210);
        ig.lineWidth = 1.5;
        ig.roundRect(-440, -63, 880, 126, 12);
        ig.stroke();

        if (this.nameLab) {
            this.nameLab.node.setParent(identity);
            this.nameLab.node.setPosition(-385, 24, 0);
            ensureTransform(this.nameLab.node, 760, 44);
            this.nameLab.useSystemFont = true;
            this.nameLab.fontFamily = GameTheme.typography.titleFont;
            this.nameLab.fontSize = 27;
            this.nameLab.lineHeight = 34;
            this.nameLab.enableWrapText = false;
            this.nameLab.overflow = Label.Overflow.SHRINK;
            this.nameLab.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.nameLab.verticalAlign = VerticalTextAlignment.CENTER;
            this.nameLab.color = GameTheme.colors.gold300;
        }
        if (this.mengZhuLab) {
            this.mengZhuLab.node.setParent(identity);
            this.mengZhuLab.node.setPosition(-385, -28, 0);
            ensureTransform(this.mengZhuLab.node, 760, 36);
            this.mengZhuLab.useSystemFont = true;
            this.mengZhuLab.fontFamily = GameTheme.typography.bodyFont;
            this.mengZhuLab.fontSize = 17;
            this.mengZhuLab.lineHeight = 23;
            this.mengZhuLab.enableWrapText = false;
            this.mengZhuLab.overflow = Label.Overflow.SHRINK;
            this.mengZhuLab.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.mengZhuLab.verticalAlign = VerticalTextAlignment.CENTER;
            this.mengZhuLab.color = GameTheme.colors.ivory;
        }

        const noticeCard = ensureChild(this.node, '__UnionNoticeCard');
        noticeCard.setPosition(0, -20, 0);
        ensureTransform(noticeCard, 880, 230);
        const ng = noticeCard.getComponent(Graphics) || noticeCard.addComponent(Graphics);
        ng.clear();
        ng.fillColor = new Color(22, 18, 15, 238);
        ng.roundRect(-440, -115, 880, 230, 12);
        ng.fill();
        ng.strokeColor = new Color(139, 96, 48, 195);
        ng.lineWidth = 1.5;
        ng.roundRect(-440, -115, 880, 230, 12);
        ng.stroke();

        const noticeTitle = createGameText(
            noticeCard,
            '__NoticeTitle',
            'THÔNG BÁO LIÊN MINH',
            18,
            GameTheme.colors.gold300,
            280,
            36,
            true,
        );
        noticeTitle.horizontalAlign = HorizontalTextAlignment.LEFT;
        noticeTitle.node.setPosition(-286, 84, 0);

        if (this.noticeLab) {
            this.noticeLab.node.setParent(noticeCard);
            this.noticeLab.node.setPosition(0, -6, 0);
            ensureTransform(this.noticeLab.node, 800, 135);
            this.noticeLab.useSystemFont = true;
            this.noticeLab.fontFamily = GameTheme.typography.bodyFont;
            this.noticeLab.fontSize = 17;
            this.noticeLab.lineHeight = 24;
            this.noticeLab.enableWrapText = true;
            this.noticeLab.overflow = Label.Overflow.SHRINK;
            this.noticeLab.horizontalAlign = HorizontalTextAlignment.LEFT;
            this.noticeLab.verticalAlign = VerticalTextAlignment.TOP;
            this.noticeLab.color = GameTheme.colors.ivory;
        }

        if (this.editNode) {
            this.editNode.setParent(noticeCard);
            this.editNode.setPosition(0, -10, 0);
        }
        if (this.editBox) {
            styleGameInput(this.editBox, 'Nhập thông báo liên minh', 'none', 700, 66);
        }

        if (this.modifyBtn) {
            this.modifyBtn.node.setPosition(255, -174, 0);
            styleRealButton(this.modifyBtn, 'SỬA THÔNG BÁO', 'secondary', 210);
        }
        if (this.applyBtn) {
            this.applyBtn.node.setPosition(465, -174, 0);
            styleRealButton(this.applyBtn, 'DUYỆT ĐƠN', 'jade', 170);
        }

        const submit = findButton(this.node, 'onEditSubmit');
        if (submit) {
            submit.node.setPosition(-95, -84, 0);
            styleRealButton(submit, 'LƯU', 'primary', 150, 44);
        }
        const cancel = findButton(this.node, 'onCancel');
        if (cancel) {
            cancel.node.setPosition(95, -84, 0);
            styleRealButton(cancel, 'HỦY', 'secondary', 150, 44);
        }
    }

    protected onDestroy():void{
        EventMgr.targetOff(this);
    }

    onEnable() {
        this.applyLayout();
        let city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        UnionCommand.getInstance().unionInfo(city.unionId);
        this.updateRedDot()
    }

    updateRedDot(){
        let city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        let cnt = UnionCommand.getInstance().proxy.getApplyCnt(city.unionId);
        this.applyRedDot.active = cnt > 0;
    }

    onInfo(){
        let city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        let unionData:Union = UnionCommand.getInstance().proxy.getUnion(city.unionId);
        this.nameLab.string = "Liên minh: " + unionData.name;
        if (unionData.notice == ""){
            this.noticeLab.string = "Chưa có thông báo";
        }else{
            this.noticeLab.string = unionData.notice;
        }
        this.mengZhuLab.string = "Minh chủ: " + unionData.getChairman().name
        this.editNode.active = false;

        let ok = unionData.isMajor(city.rid);
        this.modifyBtn.node.active = ok;
        this.applyBtn.node.active = ok;
    }

    onUnionNotice(data){
        if (data.text == ""){
            this.noticeLab.string = "Chưa có thông báo";
        }else{
            this.noticeLab.string = data.text;
        }
    }

    onUnionApply(){
        this.updateRedDot();
    }

    onEditSubmit(){
        AudioManager.instance.playClick();
        this.noticeLab.node.active = true;
        this.editNode.active = false;
        this.modifyBtn.node.active = true;

        var str = this.editBox.string
        UnionCommand.getInstance().modNotice(str);
    }

    onModify(){
        AudioManager.instance.playClick();
        this.noticeLab.node.active = false;
        this.editNode.active = true;
        this.modifyBtn.node.active = false;
    }

    onCancel(){
        AudioManager.instance.playClick();
        this.noticeLab.node.active = true;
        this.editNode.active = false;
        this.modifyBtn.node.active = true;
    }
}
