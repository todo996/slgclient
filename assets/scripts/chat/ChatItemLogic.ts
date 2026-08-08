import { _decorator, Component, Label, UITransform } from 'cc';
import {
    ANCIENT_UI,
    drawAncientPanel,
    localizeNode,
    suppressLegacyChrome,
} from '../i18n/I18n';
import DateUtil from '../utils/DateUtil';
import { ChatMsg } from './ChatProxy';

const { ccclass, property } = _decorator;

@ccclass('ChatItemLogic')
export default class ChatItemLogic extends Component {
    @property(Label)
    nameLabel: Label = null;

    protected onLoad(): void {
        localizeNode(this.node);
        suppressLegacyChrome(this.node, 1);
        const transform = this.node.getComponent(UITransform);
        const width = transform && transform.width > 100 ? transform.width : 820;
        const height = transform && transform.height > 30 ? transform.height : 54;
        drawAncientPanel(this.node, width, height, 6, ANCIENT_UI.panelSoft);
        this.nameLabel.useSystemFont = true;
        this.nameLabel.fontFamily = 'Arial';
        this.nameLabel.fontSize = 16;
        this.nameLabel.lineHeight = 22;
        this.nameLabel.color = ANCIENT_UI.text;
    }

    protected updateItem(data: ChatMsg): void {
        const time = DateUtil.converTimeStr(data.time * 1000);
        this.nameLabel.string = `${data.nick_name}  ${time}\n${data.msg}`;
    }
}
