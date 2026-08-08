import { _decorator, Component, Label, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import {
    ANCIENT_UI,
    drawAncientPanel,
    findButtonByHandler,
    localizeNode,
    styleAncientButton,
    suppressLegacyChrome,
} from '../common/AudioManager';
import { EventMgr } from '../utils/EventMgr';
import UnionCommand from './UnionCommand';
import { Union } from './UnionProxy';

@ccclass('UnionItemLogic')
export default class UnionItemLogic extends Component {
    @property(Label)
    nameLabel: Label = null;
    @property(Node)
    joinButtonNode: Node = null;

    protected _unionData: Union = null;

    protected onLoad(): void {
        this.joinButtonNode.active = false;
        this.applyModernItem();
    }

    private applyModernItem(): void {
        localizeNode(this.node);
        suppressLegacyChrome(this.node, 1);
        const transform = this.node.getComponent(UITransform);
        const width = transform && transform.width > 100 ? transform.width : 720;
        const height = transform && transform.height > 30 ? transform.height : 76;
        drawAncientPanel(this.node, width, height, 6, ANCIENT_UI.panelSoft);
        this.nameLabel.useSystemFont = true;
        this.nameLabel.fontFamily = 'Times New Roman';
        this.nameLabel.fontSize = 20;
        this.nameLabel.color = ANCIENT_UI.gold;
        const joinButton = findButtonByHandler(this.node, 'join');
        if (joinButton) {
            styleAncientButton(joinButton.node, 'Gia nhập', 'jade', 130, 42);
        }
    }

    protected updateItem(data: Union): void {
        this._unionData = data;
        this.nameLabel.string = this._unionData.name;
        this.joinButtonNode.active = this.isCanJoin();
    }

    protected isCanJoin(): boolean {
        return !UnionCommand.getInstance().proxy.isMeInUnion();
    }

    protected join(): void {
        AudioManager.instance.playClick();
        UnionCommand.getInstance().unionJoin(this._unionData.id);
    }

    protected click(): void {
        AudioManager.instance.playClick();
        if (!this.isCanJoin()) {
            EventMgr.emit(LogicEvent.openMyUnion, this._unionData);
        }
    }
}
