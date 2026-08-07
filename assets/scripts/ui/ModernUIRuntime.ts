import { _decorator, Component, Node } from 'cc';
import { localizeNode } from '../i18n/I18n';
import { styleModernCityPanel, styleModernMapScene } from './components/MapHudSurface';
import { styleRightSelectorTree } from './screens/RightSelectorPresenter';
import { styleSkillTree } from './screens/SkillPresenter';

const { ccclass } = _decorator;

/**
 * Theo dõi cây Map UI để mọi popup được instantiate sau khi vào game vẫn được
 * Việt hoá và nhận design system mới. Chỉ tác động lên node UI, không thay dữ liệu,
 * SpriteFrame tướng, TiledMap hoặc handler gameplay.
 */
@ccclass('ModernUIRuntime')
export default class ModernUIRuntime extends Component {
    private readonly _seen = new Set<Node>();

    protected onLoad(): void {
        this.markSubtree(this.node);
        styleModernMapScene(this.node);
        styleRightSelectorTree(this.node);
        styleSkillTree(this.node);
        this.schedule(this.scanForNewUi, 0.2);
    }

    protected onDestroy(): void {
        this.unschedule(this.scanForNewUi);
        this._seen.clear();
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
                styleModernCityPanel(child);
                styleModernMapScene(child);
                styleRightSelectorTree(child);
                styleSkillTree(child);
                this.markSubtree(child);
                continue;
            }
            this.scanNode(child);
        }
    }
}
