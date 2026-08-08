import { _decorator, Component, Label, UITransform } from 'cc';
import DateUtil from '../utils/DateUtil';
import { ChatMsg } from './ChatProxy';

function ui(): any {
    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;
    if (!bridge) {
        throw new Error('Ancient UI bridge has not been initialized.');
    }
    return bridge;
}


const { ccclass, property } = _decorator;

@ccclass('ChatItemLogic')
export default class ChatItemLogic extends Component {
    @property(Label)
    nameLabel: Label = null;

    protected onLoad(): void {
        ui().localizeNode(this.node);
        ui().suppressLegacyChrome(this.node, 1);
        const transform = this.node.getComponent(UITransform);
        const width = transform && transform.width > 100 ? transform.width : 820;
        const height = transform && transform.height > 30 ? transform.height : 54;
        ui().drawAncientPanel(this.node, width, height, 6, ui().ANCIENT_UI.panelSoft);
        this.nameLabel.useSystemFont = true;
        this.nameLabel.fontFamily = 'Arial';
        this.nameLabel.fontSize = 16;
        this.nameLabel.lineHeight = 22;
        this.nameLabel.color = ui().ANCIENT_UI.text;
    }

    protected updateItem(data: ChatMsg): void {
        const time = DateUtil.converTimeStr(data.time * 1000);
        this.nameLabel.string = `${data.nick_name}  ${time}\n${data.msg}`;
    }
}
