import { _decorator, Component, Layout, Prefab, Vec3, instantiate } from 'cc';
const { ccclass, property } = _decorator;

import { AudioManager } from '../../common/AudioManager';
import {
    applyAncientScreenChrome,
    ensureUiTransform,
    findButtonByHandler,
    styleAncientButton,
} from '../../common/AudioManager';
import GeneralItemLogic, { GeneralItemType } from './GeneralItemLogic';

@ccclass('DrawRLogic')
export default class DrawRLogic extends Component {
    @property(Prefab)
    generalItemPrefab: Prefab = null;
    @property(Layout)
    tenLayout: Layout = null;
    @property(Layout)
    oneLayout: Layout = null;

    private _maxSize = 10;
    private _scale = 0.4;

    protected onLoad(): void {
        this.applyModernResult();
        for (let i = 0; i < this._maxSize; i += 1) {
            const generalNode = instantiate(this.generalItemPrefab);
            generalNode.parent = this.tenLayout.node;
            generalNode.scale = new Vec3(this._scale, this._scale, this._scale);
            generalNode.active = false;
        }
        const generalNode = instantiate(this.generalItemPrefab);
        generalNode.parent = this.oneLayout.node;
        generalNode.scale = new Vec3(0.72, 0.72, 0.72);
        generalNode.active = false;
    }

    private applyModernResult(): void {
        applyAncientScreenChrome(this.node, 'Kết quả chiêu mộ');
        this.tenLayout.node.setPosition(0, -15, 0);
        ensureUiTransform(this.tenLayout.node, 1050, 500);
        this.oneLayout.node.setPosition(0, -20, 0);
        ensureUiTransform(this.oneLayout.node, 520, 500);
        const close = findButtonByHandler(this.node, 'onClickClose');
        if (close) {
            close.node.setPosition(-574, 320, 0);
            styleAncientButton(close.node, '←', 'dark', 72, 52);
            close.node.setSiblingIndex(this.node.children.length - 1);
        }
    }

    public setData(data: any): void {
        this.tenLayout.node.active = this.oneLayout.node.active = false;
        if (data.length == 1) {
            this.oneLayout.node.active = true;
            const children = this.oneLayout.node.children;
            const comp = children[0].getComponent(GeneralItemLogic);
            children[0].active = true;
            if (comp) {
                comp.setData(data[0], GeneralItemType.GeneralNoThing);
            }
        } else {
            this.tenLayout.node.active = true;
            const children = this.tenLayout.node.children;
            for (let i = 0; i < this._maxSize; i += 1) {
                const child = children[i];
                if (data[i]) {
                    child.active = true;
                    const comp = child.getComponent(GeneralItemLogic);
                    if (comp) {
                        comp.setData(data[i], GeneralItemType.GeneralNoThing);
                    }
                } else {
                    child.active = false;
                }
            }
        }
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }
}
