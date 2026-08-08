import { _decorator, Component, Label, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../common/AudioManager';
import { LogicEvent } from '../common/LogicEvent';
import { EventMgr } from '../utils/EventMgr';
import UnionCommand from './UnionCommand';
import { Union } from './UnionProxy';

function ui(): any {
    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;
    if (!bridge) {
        throw new Error('Ancient UI bridge has not been initialized.');
    }
    return bridge;
}


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
        ui().localizeNode(this.node);
        ui().suppressLegacyChrome(this.node, 1);
        const transform = this.node.getComponent(UITransform);
        const width = transform && transform.width > 100 ? transform.width : 720;
        const height = transform && transform.height > 30 ? transform.height : 76;
        ui().drawAncientPanel(this.node, width, height, 6, ui().ANCIENT_UI.panelSoft);
        this.nameLabel.useSystemFont = true;
        this.nameLabel.fontFamily = 'Times New Roman';
        this.nameLabel.fontSize = 20;
        this.nameLabel.color = ui().ANCIENT_UI.gold;
        const joinButton = ui().findButtonByHandler(this.node, 'join');
        if (joinButton) {
            ui().styleAncientButton(joinButton.node, 'Gia nhập', 'jade', 130, 42);
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
