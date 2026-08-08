import { Node } from 'cc';
import { applyDrawScreenLayout } from './DrawScreenPresenter';
import { applyRosterLayout } from './RosterPresenter';

function visit(root: Node, callback: (node: Node) => void): void {
    callback(root);
    for (const child of root.children) {
        visit(child, callback);
    }
}

/** Chỉ nối presenter vào component thật; không thay handler, packet hoặc gameplay. */
export function styleCoreScreensTree(root: Node): void {
    visit(root, (node) => {
        const draw = node.getComponent('DrawLogic') as any;
        if (draw && draw.labelOnce && draw.labelTen && draw.cntLab) {
            applyDrawScreenLayout(node, draw.labelOnce, draw.labelTen, draw.cntLab);
        }

        const general = node.getComponent('GeneralListLogic') as any;
        if (general && general.scrollView && general.cntLab) {
            applyRosterLayout(node, general.scrollView, general.cntLab);
        }
    });
}
