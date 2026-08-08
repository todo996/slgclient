import { _decorator, Component, Node } from 'cc';
import { localizeNode } from '../i18n/I18n';
import { styleModernCityPanel, styleModernMapScene } from './components/MapHudSurface';
import { styleCoreScreensTree } from './screens/CoreScreensPresenter';
import { styleRightSelectorTree } from './screens/RightSelectorPresenter';
import { styleSkillTree } from './screens/SkillPresenter';

const { ccclass } = _decorator;

/** Runtime UI thuần hiển thị. Không sửa Command/Proxy, packet, SpriteFrame tướng hoặc TiledMap. */
@ccclass('ModernUIRuntime')
export default class ModernUIRuntime extends Component {
    private readonly _seen = new Set<Node>();

    protected onLoad(): void {
        localizeNode(this.node);
        this.applyPresentation(this.node);
        this.markSubtree(this.node);
        this.schedule(this.scanForNewUi, 0.2);
    }

    protected onDestroy(): void {
        this.unschedule(this.scanForNewUi);
        this._seen.clear();
    }

    private applyPresentation(root: Node): void {
        styleModernMapScene(root);
        styleModernCityPanel(root);
        styleCoreScreensTree(root);
        styleRightSelectorTree(root);
        styleSkillTree(root);
    }

    private markSubtree(root: Node): void {
        this._seen.add(root);
        for (const child of root.children) {
            this.markSubtree(child);
        }
    }

    private scanForNewUi = (): void => {
        this.scanNode(this.node);
    };

    private scanNode(root: Node): void {
        const children = [...root.children];
        for (const child of children) {
            if (!this._seen.has(child)) {
                localizeNode(child);
                this.applyPresentation(child);
                this.markSubtree(child);
                continue;
            }
            this.scanNode(child);
        }
    }
}
