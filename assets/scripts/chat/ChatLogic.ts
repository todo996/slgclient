import { _decorator, Component, EditBox, ScrollView, UITransform } from 'cc';
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
import { styleModernCityPanel } from '../ui/components/MapHudSurface';
import { styleGameInput } from '../ui/components/GameSurface';

@ccclass('ChatLogic')
export default class ChatLogic extends Component {

    @property(EditBox)
    editConent: EditBox = null;

    @property(ScrollView)
    chatView: ScrollView = null;

    _type: number = 0;

    protected onLoad(): void {
        localizeNode(this.node);
        styleModernCityPanel(this.node);
        if (this.editConent) {
            const transform = this.editConent.node.getComponent(UITransform);
            const width = transform?.contentSize.width || 420;
            const height = transform?.contentSize.height || 52;
            styleGameInput(this.editConent, 'Nhập nội dung trò chuyện', 'none', width, height);
        }
        EventMgr.on(LogicEvent.updateChatHistory, this.updateChat, this);
        EventMgr.on(LogicEvent.unionChange, this.updateChat, this);
    }

    protected onDisable(): void {
        EventMgr.targetOff(this);
    }

    protected onEnable(): void {
        localizeNode(this.node);
        styleModernCityPanel(this.node);
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
        this.updateView();
    }

    protected onClickUnion(): void {
        AudioManager.instance.playClick();
        this._type = 1;
        this.updateView();
    }
}
