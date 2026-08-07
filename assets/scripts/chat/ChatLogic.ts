import {
    _decorator,
    Button,
    Color,
    Component,
    EditBox,
    Graphics,
    Label,
    Node,
    ScrollView,
    Sprite,
    UITransform,
} from 'cc';
const { ccclass, property } = _decorator;

import { MapCityData } from "../map/MapCityProxy";
import MapCommand from "../map/MapCommand";
import ChatCommand from "./ChatCommand";
import { ChatMsg } from "./ChatProxy";
import ListLogic from '../utils/ListLogic';
import { EventMgr } from '../utils/EventMgr';
import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { localizeNode } from '../i18n/I18n';
import {
    createGameText,
    drawGamePanel,
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
    height: number,
): void {
    styleGameButton(button.node, text, variant, width, height);
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

function applyChatLayout(root: Node, editBox: EditBox, chatView: ScrollView, channel: number): void {
    const panel = root.getChildByName('New Node');
    if (panel) {
        for (const sprite of panel.getComponents(Sprite)) {
            sprite.enabled = false;
        }
        drawGamePanel(panel, 1180, 650, 10);
    }

    const header = ensureChild(root, '__ChatHeader');
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
        '__ChatTitle',
        'TRÒ CHUYỆN',
        40,
        GameTheme.colors.gold300,
        420,
        58,
        true,
    );
    title.node.setPosition(0, 0, 0);

    const close = findButton(root, 'onClickClose');
    if (close) {
        close.node.setParent(root);
        close.node.active = true;
        close.node.setPosition(-574, 318, 0);
        styleRealButton(close, '←', 'secondary', 72, 52);
    }

    const world = findButton(root, 'onClickWorld');
    if (world) {
        world.node.setParent(root);
        world.node.active = true;
        world.node.setPosition(-130, 257, 0);
        styleRealButton(world, 'THẾ GIỚI', channel === 0 ? 'jade' : 'secondary', 220, 48);
    }

    const union = findButton(root, 'onClickUnion');
    if (union) {
        union.node.setParent(root);
        union.node.active = true;
        union.node.setPosition(130, 257, 0);
        styleRealButton(union, 'LIÊN MINH', channel === 1 ? 'jade' : 'secondary', 220, 48);
    }

    chatView.node.setPosition(0, -7, 0);
    ensureTransform(chatView.node, 1050, 440);
    const view = chatView.node.getChildByName('view');
    if (view) {
        ensureTransform(view, 1050, 440);
    }
    if (chatView.content) {
        const contentTransform = chatView.content.getComponent(UITransform) || chatView.content.addComponent(UITransform);
        contentTransform.width = 1050;
    }
    const list = chatView.node.getComponent(ListLogic) as any;
    if (list) {
        list.columnCount = 1;
        list.autoColumnCount = false;
        list.isHorizontal = false;
        list.spaceRow = 8;
    }

    editBox.node.setParent(root);
    editBox.node.setPosition(-85, -294, 0);
    styleGameInput(editBox, 'Nhập nội dung trò chuyện', 'none', 820, 54);

    const send = findButton(root, 'onClickChat');
    if (send) {
        send.node.setParent(root);
        send.node.active = true;
        send.node.setPosition(435, -294, 0);
        styleRealButton(send, 'GỬI', 'primary', 170, 54);
    }
}

@ccclass('ChatLogic')
export default class ChatLogic extends Component {

    @property(EditBox)
    editConent: EditBox = null;

    @property(ScrollView)
    chatView: ScrollView = null;

    _type: number = 0;

    protected onLoad(): void {
        localizeNode(this.node);
        applyChatLayout(this.node, this.editConent, this.chatView, this._type);
        EventMgr.on(LogicEvent.updateChatHistory, this.updateChat, this);
        EventMgr.on(LogicEvent.unionChange, this.updateChat, this);
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    protected onEnable(): void {
        localizeNode(this.node);
        applyChatLayout(this.node, this.editConent, this.chatView, this._type);
        this.updateUnion();
        this.updateView();
    }

    protected updateUnion(): void {
        let city: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        if (city.unionId > 0) {
            ChatCommand.getInstance().join(1, city.unionId);
        } else {
            ChatCommand.getInstance().exit(1, 0);
        }
    }

    protected updateChat(data: any[]) {
        if (this._type == 0) {
            var comp = this.chatView.node.getComponent(ListLogic);
            var list: ChatMsg[] = ChatCommand.getInstance().proxy.getWorldChatList();
            comp.setData(list);
        } else if (this._type == 1) {
            var comp = this.chatView.node.getComponent(ListLogic);
            var list: ChatMsg[] = ChatCommand.getInstance().proxy.getUnionChatList();
            comp.setData(list);
        }
    }

    protected onClickClose(): void {
        AudioManager.instance.playClick();
        this.node.active = false;
    }

    public updateView(): void {
        ChatCommand.getInstance().chatHistory(this._type);
    }

    protected onClickChat(): void {
        AudioManager.instance.playClick();
        if (this.editConent.string == "") {
            EventMgr.emit(LogicEvent.showToast, "Nội dung trò chuyện không được để trống");
            return;
        }

        if (this._type == 0) {
            ChatCommand.getInstance().chat(this.editConent.string, this._type);
        } else if (this._type == 1) {
            let city: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
            if (city.unionId > 0) {
                ChatCommand.getInstance().chat(this.editConent.string, this._type);
            }
        }
        this.editConent.string = "";
    }

    protected onClickWorld(): void {
        AudioManager.instance.playClick();
        this._type = 0;
        applyChatLayout(this.node, this.editConent, this.chatView, this._type);
        this.updateView();
    }

    protected onClickUnion(): void {
        AudioManager.instance.playClick();
        this._type = 1;
        applyChatLayout(this.node, this.editConent, this.chatView, this._type);
        this.updateView();
    }
}
