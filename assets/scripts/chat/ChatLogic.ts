import { _decorator, Component, EditBox, ScrollView } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import {
    ANCIENT_UI,
    applyAncientScreenChrome,
    createUiText,
    drawAncientPanel,
    ensureUiChild,
    ensureUiTransform,
    findButtonByHandler,
    styleAncientButton,
    styleAncientEditBox,
} from '../i18n/I18n';
import MapCommand from '../map/MapCommand';
import { MapCityData } from '../map/MapCityProxy';
import { EventMgr } from '../utils/EventMgr';
import ListLogic from '../utils/ListLogic';
import ChatCommand from './ChatCommand';
import { ChatMsg } from './ChatProxy';

@ccclass('ChatLogic')
export default class ChatLogic extends Component {
    @property(EditBox)
    editConent: EditBox = null;

    @property(ScrollView)
    chatView: ScrollView = null;

    _type = 0;

    protected onLoad(): void {
        EventMgr.on(LogicEvent.updateChatHistory, this.updateChat, this);
        EventMgr.on(LogicEvent.unionChange, this.updateChat, this);
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    protected onEnable(): void {
        this.applyModernChat();
        this.updateUnion();
        this.updateView();
    }

    private applyModernChat(): void {
        applyAncientScreenChrome(this.node, 'Trò chuyện');

        const channels = ensureUiChild(this.node, '__ChatChannels');
        channels.setPosition(-495, -12, 0);
        channels.setSiblingIndex(this.node.children.length - 2);
        drawAncientPanel(channels, 220, 500, 9);
        const caption = createUiText(
            channels,
            '__ChannelCaption',
            'KÊNH TRÒ CHUYỆN',
            17,
            ANCIENT_UI.gold,
            190,
            38,
            true,
        );
        caption.node.setPosition(0, 205, 0);

        const world = findButtonByHandler(this.node, 'onClickWorld');
        if (world) {
            world.node.setParent(channels);
            world.node.setPosition(0, 135, 0);
            styleAncientButton(world.node, 'Thế giới', this._type === 0 ? 'gold' : 'dark', 184, 54);
        }
        const union = findButtonByHandler(this.node, 'onClickUnion');
        if (union) {
            union.node.setParent(channels);
            union.node.setPosition(0, 68, 0);
            styleAncientButton(union.node, 'Liên minh', this._type === 1 ? 'gold' : 'dark', 184, 54);
        }

        this.chatView.node.setPosition(95, 12, 0);
        ensureUiTransform(this.chatView.node, 920, 455);
        const view = this.chatView.node.getChildByName('view') || this.chatView.node.getChildByName('View');
        if (view) {
            ensureUiTransform(view, 920, 455);
        }
        if (this.chatView.content) {
            ensureUiTransform(this.chatView.content, 920, 455);
        }

        this.editConent.node.setParent(this.node);
        this.editConent.node.setPosition(45, -292, 0);
        styleAncientEditBox(this.editConent, 'Nhập nội dung...', 790, 56);
        this.editConent.node.setSiblingIndex(this.node.children.length - 1);

        const send = findButtonByHandler(this.node, 'onClickChat');
        if (send) {
            send.node.setParent(this.node);
            send.node.setPosition(520, -292, 0);
            styleAncientButton(send.node, 'Gửi', 'gold', 150, 56);
            send.node.setSiblingIndex(this.node.children.length - 1);
        }

        const close = findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setParent(this.node);
            close.node.setPosition(-574, 320, 0);
            styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    protected updateUnion(): void {
        const city: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
        if (city.unionId > 0) {
            ChatCommand.getInstance().join(1, city.unionId);
        } else {
            ChatCommand.getInstance().exit(1, 0);
        }
    }

    protected updateChat(data: any[]): void {
        const comp = this.chatView.node.getComponent(ListLogic);
        if (this._type == 0) {
            const list: ChatMsg[] = ChatCommand.getInstance().proxy.getWorldChatList();
            comp.setData(list);
        } else if (this._type == 1) {
            const list: ChatMsg[] = ChatCommand.getInstance().proxy.getUnionChatList();
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
        if (this.editConent.string == '') {
            EventMgr.emit(LogicEvent.showToast, 'Nội dung trò chuyện không được để trống');
            return;
        }

        if (this._type == 0) {
            ChatCommand.getInstance().chat(this.editConent.string, this._type);
        } else if (this._type == 1) {
            const city: MapCityData = MapCommand.getInstance().cityProxy.getMyMainCity();
            if (city.unionId > 0) {
                ChatCommand.getInstance().chat(this.editConent.string, this._type);
            }
        }
        this.editConent.string = '';
    }

    protected onClickWorld(): void {
        AudioManager.instance.playClick();
        this._type = 0;
        this.applyModernChat();
        this.updateView();
    }

    protected onClickUnion(): void {
        AudioManager.instance.playClick();
        this._type = 1;
        this.applyModernChat();
        this.updateView();
    }
}
