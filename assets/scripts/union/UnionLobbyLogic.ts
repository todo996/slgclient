import { _decorator, Component, Label, ScrollView } from 'cc';
const { ccclass, property } = _decorator;

import { LogicEvent } from '../common/LogicEvent';
import {
    ANCIENT_UI,
    createUiText,
    drawAncientPanel,
    ensureUiChild,
    ensureUiTransform,
    localizeNode,
    suppressLegacyChrome,
} from '../i18n/I18n';
import { EventMgr } from '../utils/EventMgr';
import ListLogic from '../utils/ListLogic';
import UnionCommand from './UnionCommand';
import { Union } from './UnionProxy';

@ccclass('UnionLobbyLogic')
export default class UnionLobbyLogic extends Component {
    @property(ScrollView)
    scrollView: ScrollView = null;

    protected onLoad(): void {
        this.applyModernLobby();
        EventMgr.on(LogicEvent.updateUnionList, this.updateUnion, this);
    }

    protected onDestroy(): void {
        EventMgr.targetOff(this);
    }

    private applyModernLobby(): void {
        localizeNode(this.node);
        suppressLegacyChrome(this.node, 2);
        const info = ensureUiChild(this.node, '__UnionInfoPanel');
        info.setPosition(-420, -5, 0);
        info.setSiblingIndex(0);
        drawAncientPanel(info, 300, 485, 9);
        const title = createUiText(info, '__UnionInfoTitle', 'SỨC MẠNH ĐOÀN KẾT', 19, ANCIENT_UI.gold, 250, 44, true);
        title.node.setPosition(0, 190, 0);
        const text = createUiText(
            info,
            '__UnionInfoText',
            'Danh sách liên minh được tải trực tiếp từ máy chủ. Chọn một liên minh để xem hoặc gia nhập khi đủ điều kiện.',
            16,
            ANCIENT_UI.text,
            245,
            180,
        );
        text.enableWrapText = true;
        text.overflow = Label.Overflow.RESIZE_HEIGHT;
        text.node.setPosition(0, 45, 0);

        this.scrollView.node.setPosition(165, -5, 0);
        ensureUiTransform(this.scrollView.node, 780, 485);
        const view = this.scrollView.node.getChildByName('view') || this.scrollView.node.getChildByName('View');
        if (view) {
            ensureUiTransform(view, 780, 485);
        }
        if (this.scrollView.content) {
            ensureUiTransform(this.scrollView.content, 780, 485);
        }
    }

    protected updateUnion(data: any[]): void {
        const comp = this.scrollView.node.getComponent(ListLogic);
        const list: Union[] = UnionCommand.getInstance().proxy.getUnionList();
        comp.setData(list);
    }

    protected onEnable(): void {
        this.applyModernLobby();
        UnionCommand.getInstance().unionList();
    }
}
