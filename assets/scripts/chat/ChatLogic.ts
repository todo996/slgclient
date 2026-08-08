import { _decorator, Button, Color, Component, EditBox, Graphics, Label, Node, ScrollView, Sprite, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import ChatCommand from "./ChatCommand";
import { ChatMsg } from "./ChatProxy";
import ListLogic from '../utils/ListLogic';
import { EventMgr } from '../utils/EventMgr';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';

@ccclass('ChatLogic')
export default class ChatLogic extends Component {

    @property(EditBox)
    editConent: EditBox = null;

    @property(ScrollView)
    chatView:ScrollView = null;

    _type:number = 0;
    private _referenceBuilt = false;
    private _worldTab: Node = null;
    private _unionTab: Node = null;
    private _worldLabel: Label = null;
    private _unionLabel: Label = null;

    protected onLoad():void{
        this.buildReferenceChatUI();
        EventMgr.on(LogicEvent.updateChatHistory, this.updateChat, this);
        EventMgr.on(LogicEvent.unionChange, this.updateChat, this);
    }

    protected onDisable():void{
        EventMgr.targetOff(this);
    }

    protected onEnable():void{
        this.updateUnion();
        this.updateView();
        this.refreshTabs();
    }

    /**
     * Dựng màn trò chuyện mới theo ảnh mẫu.
     * ScrollView và EditBox thật được chuyển sang hierarchy mới nên command mạng giữ nguyên.
     */
    private buildReferenceChatUI():void{
        if (this._referenceBuilt) return;
        this._referenceBuilt = true;
        const legacyRoots = [...this.node.children];

        const root = new Node('ReferenceChatUI');
        root.parent = this.node;
        root.layer = this.node.layer;
        root.addComponent(UITransform).setContentSize(1280, 720);

        this.makePanel(root, 'Backdrop', 1280, 720, 0, 0, new Color(10, 8, 7, 250), new Color(66, 43, 24, 255), 1, 0);
        this.makePanel(root, 'Header', 1240, 70, 0, 315, new Color(23, 16, 11, 252), new Color(164, 116, 56, 255), 2, 8);
        this.makeLabel(root, 'Title', 'TRÒ CHUYỆN', -470, 315, 30, new Color(235, 196, 116, 255), true, 260);
        this.makeLabel(root, 'Subtitle', 'Kết nối cùng chư hầu bốn phương', -250, 315, 14, new Color(149, 130, 100, 255), false, 260);
        this.makeButton(root, 'Close', 'ĐÓNG', 550, 315, 100, 40, () => this.onClickClose(), false, 14);

        const channels = this.makePanel(root, 'Channels', 220, 570, -510, -2, new Color(21, 15, 11, 248), new Color(125, 87, 43, 255), 2, 9);
        this.makeLabel(channels, 'ChannelTitle', 'KÊNH', 0, 236, 15, new Color(154, 134, 101, 255), true, 180);
        this._worldTab = this.makeButton(channels, 'WorldTab', 'THẾ GIỚI', 0, 178, 178, 46, () => this.onClickWorld(), false, 15);
        this._worldLabel = this._worldTab.getChildByName('WorldTab_label').getComponent(Label);
        this._unionTab = this.makeButton(channels, 'UnionTab', 'LIÊN MINH', 0, 120, 178, 46, () => this.onClickUnion(), false, 15);
        this._unionLabel = this._unionTab.getChildByName('UnionTab_label').getComponent(Label);
        this.makePanel(channels, 'ChannelDivider', 172, 2, 0, 72, new Color(89, 62, 34, 255), new Color(0, 0, 0, 0), 0, 0);
        this.makeLabel(channels, 'ChannelNote', 'Tin nhắn được đồng bộ\ntừ máy chủ', 0, 25, 12, new Color(120, 105, 82, 255), false, 178);

        const conversation = this.makePanel(root, 'Conversation', 930, 570, 108, -2, new Color(15, 12, 10, 244), new Color(103, 72, 39, 255), 2, 9);
        this.makePanel(conversation, 'MessageHeader', 900, 48, 0, 246, new Color(25, 18, 13, 248), new Color(87, 60, 33, 255), 1, 6);
        this.makeLabel(conversation, 'MessageTitle', 'TIN NHẮN', -330, 246, 14, new Color(183, 154, 104, 255), true, 180);

        // Danh sách chat thật.
        this.chatView.node.parent = conversation;
        this.chatView.node.active = true;
        this.chatView.node.setPosition(0, 26, 0);
        const chatTransform = this.chatView.node.getComponent(UITransform);
        if (chatTransform) chatTransform.setContentSize(880, 390);

        // Thanh nhập thật, chỉ thay visual frame.
        const composer = this.makePanel(conversation, 'Composer', 900, 82, 0, -226, new Color(20, 15, 11, 250), new Color(106, 75, 40, 255), 1, 7);
        const inputFrame = this.makePanel(composer, 'InputFrame', 690, 52, -83, 0, new Color(10, 9, 8, 250), new Color(111, 80, 45, 255), 1, 6);
        this.editConent.node.parent = inputFrame;
        this.editConent.node.active = true;
        this.editConent.node.setPosition(0, 0, 0);
        const inputTransform = this.editConent.node.getComponent(UITransform);
        if (inputTransform) inputTransform.setContentSize(666, 46);
        const inputSprite = this.editConent.node.getComponent(Sprite);
        if (inputSprite) inputSprite.enabled = false;
        this.editConent.placeholder = 'Nhập nội dung trò chuyện...';
        this.editConent.fontSize = 17;
        this.editConent.placeholderFontSize = 16;
        if (this.editConent.textLabel) this.editConent.textLabel.color = new Color(239, 225, 198, 255);
        if (this.editConent.placeholderLabel) this.editConent.placeholderLabel.color = new Color(126, 108, 82, 255);
        this.makeButton(composer, 'Send', 'GỬI', 363, 0, 154, 52, () => this.onClickChat(), true, 17);

        legacyRoots.forEach(child => {
            if (child.parent === this.node && child !== root) child.active = false;
        });
        this.refreshTabs();
    }

    protected updateUnion():void{
        const city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        if (city.unionId > 0){
            ChatCommand.getInstance().join(1, city.unionId);
        }else{
            ChatCommand.getInstance().exit(1, 0);
        }
    }

    protected updateChat(data:any[]){
        if(this._type == 0){
            const comp = this.chatView.node.getComponent(ListLogic);
            const list:ChatMsg[] = ChatCommand.getInstance().proxy.getWorldChatList();
            comp.setData(list);
        }else if (this._type == 1){
            const comp = this.chatView.node.getComponent(ListLogic);
            const list:ChatMsg[] = ChatCommand.getInstance().proxy.getUnionChatList();
            comp.setData(list);
        }
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }

    public updateView():void{
        ChatCommand.getInstance().chatHistory(this._type);
    }

    protected onClickChat(): void {
        AudioManager.instance.playClick();
        const content = this.editConent.string.trim();
        if(content == ""){
            EventMgr.emit(LogicEvent.showToast, "Nội dung trò chuyện không được để trống");
            return;
        }

        if (this._type == 0){
            ChatCommand.getInstance().chat(content, this._type);
        }else if (this._type == 1){
            const city:MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
            if (city.unionId > 0){
                ChatCommand.getInstance().chat(content, this._type);
            }else{
                EventMgr.emit(LogicEvent.showToast, "Bạn chưa tham gia liên minh.");
                return;
            }
        }
        this.editConent.string = "";
    }

    protected onClickWorld(): void {
        AudioManager.instance.playClick();
        this._type = 0;
        this.refreshTabs();
        this.updateView();
    }

    protected onClickUnion(): void {
        AudioManager.instance.playClick();
        this._type = 1;
        this.refreshTabs();
        this.updateView();
    }

    private refreshTabs():void{
        if (this._worldLabel) {
            this._worldLabel.color = this._type === 0 ? new Color(245, 209, 132, 255) : new Color(170, 148, 111, 255);
        }
        if (this._unionLabel) {
            this._unionLabel.color = this._type === 1 ? new Color(245, 209, 132, 255) : new Color(170, 148, 111, 255);
        }
        if (this._worldTab) this.tintButton(this._worldTab, this._type === 0);
        if (this._unionTab) this.tintButton(this._unionTab, this._type === 1);
    }

    private tintButton(node: Node, active: boolean):void{
        const graphics = node.getComponent(Graphics);
        if (!graphics) return;
        graphics.clear();
        const transform = node.getComponent(UITransform);
        const size = transform.contentSize;
        graphics.fillColor = active ? new Color(78, 49, 23, 255) : new Color(28, 20, 14, 248);
        graphics.strokeColor = active ? new Color(225, 174, 83, 255) : new Color(119, 84, 43, 255);
        graphics.lineWidth = 2;
        graphics.roundRect(-size.width / 2, -size.height / 2, size.width, size.height, 7);
        graphics.fill();
        graphics.stroke();
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