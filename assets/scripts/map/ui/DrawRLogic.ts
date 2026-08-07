import { _decorator, Component, Layout, Prefab, Vec3, instantiate } from 'cc';
import { AudioManager } from '../../common/AudioManager';
import GeneralItemLogic, { GeneralItemType } from './GeneralItemLogic';

const { ccclass, property } = _decorator;

@ccclass('DrawRLogic')
export default class DrawRLogic extends Component {
    @property(Prefab)
    generalItemPrefab: Prefab = null;

    @property(Layout)
    tenLayout: Layout = null;

    @property(Layout)
    oneLayout: Layout = null;

    private readonly _maxSize = 10;
    private readonly _scale = 0.4;

    protected onLoad(): void {
        for (let i = 0; i < this._maxSize; i++) {
            const generalNode = instantiate(this.generalItemPrefab);
            generalNode.parent = this.tenLayout.node;
            generalNode.scale = new Vec3(this._scale, this._scale, this._scale);
            generalNode.active = false;
        }

        const generalNode = instantiate(this.generalItemPrefab);
        generalNode.parent = this.oneLayout.node;
        generalNode.scale = new Vec3(this._scale, this._scale, this._scale);
        generalNode.active = false;
    }

    public setData(data: any[]): void {
        this.tenLayout.node.active = false;
        this.oneLayout.node.active = false;

        if (data.length === 1) {
            this.oneLayout.node.active = true;
            const child = this.oneLayout.node.children[0];
            if (!child) {
                return;
            }
            child.active = true;
            const component = child.getComponent(GeneralItemLogic);
            if (component) {
                component.setData(data[0], GeneralItemType.GeneralNoThing);
            }
            return;
        }

        this.tenLayout.node.active = true;
        const children = this.tenLayout.node.children;
        for (let i = 0; i < this._maxSize; i++) {
            const child = children[i];
            if (!child) {
                continue;
            }
            if (data[i]) {
                child.active = true;
                const component = child.getComponent(GeneralItemLogic);
                if (component) {
                    component.setData(data[i], GeneralItemType.GeneralNoThing);
                }
            } else {
                child.active = false;
            }
        }
    }

    protected onClickClose(): void {
        this.node.active = false;
        AudioManager.instance.playClick();
    }
}
