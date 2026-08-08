import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const sourceCommit = 'a4b69bb7bd15211a1f4f3b2dfd5f257042b4a0bc';
const files = [
  'assets/scripts/map/ui/MapUILogic.ts',
  'assets/scripts/map/ui/GeneralListLogic.ts',
  'assets/scripts/map/ui/GeneralItemLogic.ts',
  'assets/scripts/map/ui/DrawLogic.ts',
  'assets/scripts/map/ui/WarReportLogic.ts',
  'assets/scripts/map/ui/WarReportItemLogic.ts',
  'assets/scripts/map/ui/WarReportDesLogic.ts',
  'assets/scripts/map/ui/DrawRLogic.ts',
  'assets/scripts/map/ui/GeneralInfoLogic.ts',
  'assets/scripts/map/ui/SkillLogic.ts',
  'assets/scripts/map/ui/SkillItemLogic.ts',
  'assets/scripts/map/ui/SkillInfoLogic.ts',
  'assets/scripts/map/ui/TransformLogic.ts',
  'assets/scripts/chat/ChatLogic.ts',
  'assets/scripts/chat/ChatItemLogic.ts',
  'assets/scripts/union/UnionLogic.ts',
  'assets/scripts/union/UnionLobbyLogic.ts',
  'assets/scripts/union/UnionItemLogic.ts',
];

const helperNames = [
  'ANCIENT_UI', 'addAncientScreenTitle', 'applyAncientScreenChrome', 'createUiText',
  'drawAncientPanel', 'ensureUiChild', 'ensureUiTransform', 'findButtonByHandler',
  'getButtonHandler', 'hideDirectUiSprites', 'localizeNode', 'styleAncientButton',
  'styleAncientEditBox', 'suppressLegacyChrome',
];
const helperSet = new Set(helperNames);

function gitShow(path) {
  return execFileSync('git', ['show', `${sourceCommit}:${path}`], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}

function stripUiImports(source) {
  return source.replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]*i18n\/I18n)['"];/g, (whole, body, modulePath) => {
    const names = body.split(',').map((v) => v.trim()).filter(Boolean);
    const kept = names.filter((name) => !helperSet.has(name));
    return kept.length ? `import { ${kept.join(', ')} } from '${modulePath}';` : '';
  });
}

function bridgeController(source) {
  source = stripUiImports(source);
  for (const name of helperNames) {
    source = source.replace(new RegExp(`\\b${name}\\b`, 'g'), `ui().${name}`);
  }
  const imports = [...source.matchAll(/import[\s\S]*?from\s*['"][^'"]+['"];/g)];
  if (!imports.length) throw new Error('No imports found');
  const last = imports[imports.length - 1];
  const insertion = last.index + last[0].length;
  const accessor = `\n\nfunction ui(): any {\n    const bridge = (globalThis as any).__SLG_ANCIENT_UI__;\n    if (!bridge) {\n        throw new Error('Ancient UI bridge has not been initialized.');\n    }\n    return bridge;\n}\n`;
  return source.slice(0, insertion) + accessor + source.slice(insertion);
}

for (const file of files) {
  const restored = gitShow(file);
  const migrated = bridgeController(restored);
  fs.writeFileSync(file, migrated);
  console.log(`Bridged ${file}`);
}

const bridgeMethod = `
    private installAncientUiBridge(): void {
        const target = globalThis as any;
        if (target.__SLG_ANCIENT_UI__) {
            return;
        }

        const colors = {
            gold: new Color(231, 190, 109, 255),
            goldSoft: new Color(196, 168, 115, 235),
            text: new Color(239, 225, 198, 255),
            muted: new Color(177, 163, 139, 255),
            panel: new Color(17, 14, 12, 242),
            panelSoft: new Color(31, 25, 20, 236),
            border: new Color(152, 107, 54, 235),
            jade: new Color(38, 76, 63, 255),
            red: new Color(117, 47, 39, 255),
            success: new Color(111, 183, 97, 255),
        };

        const ensureUiTransform = (node: Node, width: number, height: number): UITransform => {
            const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
            transform.setContentSize(width, height);
            return transform;
        };
        const ensureUiChild = (parent: Node, name: string): Node => {
            let node = parent.getChildByName(name);
            if (!node) {
                node = new Node(name);
                node.setParent(parent);
            }
            return node;
        };
        const hideDirectUiSprites = (node: Node): void => {
            for (const sprite of node.getComponents(Sprite)) sprite.enabled = false;
        };
        const suppressLegacyChrome = (root: Node, maxDepth: number = 2): void => {
            const visit = (node: Node, depth: number): void => {
                if (depth > maxDepth) return;
                const name = node.name.toLowerCase();
                const protectedArt = /(icon|pic|head|avatar|portrait|general|skill|map|army|star)/.test(name);
                const chrome = /(^bg$|background|diban|panel|frame|kuang|border|base|bottom|top|di$)/.test(name);
                if (chrome && !protectedArt) hideDirectUiSprites(node);
                for (const child of node.children) visit(child, depth + 1);
            };
            visit(root, 0);
        };
        const drawAncientPanel = (node: Node, width: number, height: number, radius: number = 12, fill: Color = colors.panel): void => {
            ensureUiTransform(node, width, height);
            const skin = ensureUiChild(node, '__AncientPanelSkin');
            skin.setPosition(0, 0, 0);
            skin.setSiblingIndex(0);
            ensureUiTransform(skin, width, height);
            const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics);
            graphics.clear();
            graphics.fillColor = new Color(0, 0, 0, 105);
            graphics.roundRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, radius + 2); graphics.fill();
            graphics.fillColor = fill;
            graphics.roundRect(-width / 2, -height / 2, width, height, radius); graphics.fill();
            graphics.strokeColor = new Color(72, 48, 28, 255); graphics.lineWidth = 4;
            graphics.roundRect(-width / 2, -height / 2, width, height, radius); graphics.stroke();
            graphics.strokeColor = colors.border; graphics.lineWidth = 1.6;
            graphics.roundRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, Math.max(4, radius - 4)); graphics.stroke();
        };
        const createUiText = (parent: Node, name: string, text: string, fontSize: number, color: Color, width: number, height: number, titleFont: boolean = false): Label => {
            const node = ensureUiChild(parent, name);
            ensureUiTransform(node, width, height);
            const label = node.getComponent(Label) || node.addComponent(Label);
            label.useSystemFont = true;
            label.fontFamily = titleFont ? 'Times New Roman' : 'Arial';
            label.string = text; label.fontSize = fontSize; label.lineHeight = Math.ceil(fontSize * 1.25);
            label.enableWrapText = false; label.overflow = Label.Overflow.SHRINK;
            label.horizontalAlign = HorizontalTextAlignment.CENTER; label.verticalAlign = VerticalTextAlignment.CENTER; label.color = color;
            return label;
        };
        const getButtonHandler = (button: Button): string => {
            for (const event of (button.clickEvents as any[]) || []) {
                if (event && typeof event.handler === 'string' && event.handler) return event.handler;
            }
            return '';
        };
        const findButtonByHandler = (root: Node, handler: string): Button | null => root.getComponentsInChildren(Button).find((button) => getButtonHandler(button) === handler) || null;
        const styleAncientButton = (buttonNode: Node, text: string, variant: 'gold' | 'dark' | 'jade' | 'red' = 'dark', width: number = 180, height: number = 50): Button => {
            ensureUiTransform(buttonNode, width, height); hideDirectUiSprites(buttonNode);
            const background = buttonNode.getChildByName('Background'); if (background) hideDirectUiSprites(background);
            const skin = ensureUiChild(buttonNode, '__AncientButtonSkin'); skin.setPosition(0, 0, 0); skin.setSiblingIndex(0); ensureUiTransform(skin, width, height);
            const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics); graphics.clear();
            let fill = colors.panelSoft;
            if (variant === 'gold') fill = new Color(120, 78, 28, 255); else if (variant === 'jade') fill = colors.jade; else if (variant === 'red') fill = colors.red;
            graphics.fillColor = fill; graphics.roundRect(-width / 2, -height / 2, width, height, 7); graphics.fill();
            graphics.strokeColor = variant === 'gold' ? colors.gold : colors.border; graphics.lineWidth = 2;
            graphics.roundRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 6); graphics.stroke();
            for (const label of buttonNode.getComponentsInChildren(Label)) if (label.node.name !== '__AncientButtonLabel') label.node.active = false;
            const label = createUiText(buttonNode, '__AncientButtonLabel', text, variant === 'gold' ? 21 : 18, variant === 'gold' ? new Color(255, 239, 194, 255) : colors.text, width - 20, height - 8, true);
            label.node.active = true; label.node.setPosition(0, 0, 0); label.node.setSiblingIndex(buttonNode.children.length - 1);
            const button = buttonNode.getComponent(Button) || buttonNode.addComponent(Button);
            button.transition = Button.Transition.SCALE; button.zoomScale = 0.97; button.duration = 0.08;
            return button;
        };
        const styleAncientEditBox = (editBox: EditBox, placeholder: string, width: number, height: number): void => {
            const node = editBox.node; ensureUiTransform(node, width, height); hideDirectUiSprites(node);
            const skin = ensureUiChild(node, '__AncientInputSkin'); skin.setSiblingIndex(0); ensureUiTransform(skin, width, height);
            const graphics = skin.getComponent(Graphics) || skin.addComponent(Graphics); graphics.clear(); graphics.fillColor = new Color(18, 16, 14, 238);
            graphics.roundRect(-width / 2, -height / 2, width, height, 7); graphics.fill(); graphics.strokeColor = new Color(127, 105, 77, 220); graphics.lineWidth = 1.4;
            graphics.roundRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 7); graphics.stroke();
            editBox.placeholder = placeholder;
            if (editBox.placeholderLabel) { editBox.placeholderLabel.useSystemFont = true; editBox.placeholderLabel.fontFamily = 'Arial'; editBox.placeholderLabel.color = new Color(151, 139, 120, 255); }
            if (editBox.textLabel) { editBox.textLabel.useSystemFont = true; editBox.textLabel.fontFamily = 'Arial'; editBox.textLabel.color = colors.text; }
        };
        const addAncientScreenTitle = (root: Node, title: string): void => {
            const header = ensureUiChild(root, '__AncientScreenHeader'); header.setPosition(0, 320, 0); header.setSiblingIndex(root.children.length - 1); ensureUiTransform(header, 1120, 70);
            const graphics = header.getComponent(Graphics) || header.addComponent(Graphics); graphics.clear(); graphics.strokeColor = colors.border; graphics.lineWidth = 1.5;
            graphics.moveTo(-500, -24); graphics.lineTo(-150, -24); graphics.moveTo(150, -24); graphics.lineTo(500, -24); graphics.stroke();
            const label = createUiText(header, '__AncientScreenTitle', title, 39, colors.gold, 360, 58, true); label.node.setPosition(0, -2, 0); label.node.setSiblingIndex(header.children.length - 1);
        };
        const applyAncientScreenChrome = (root: Node, title: string): void => {
            localizeNode(root); suppressLegacyChrome(root, 2);
            const backdrop = ensureUiChild(root, '__AncientScreenBackdrop'); backdrop.setSiblingIndex(0); ensureUiTransform(backdrop, 1280, 720);
            const graphics = backdrop.getComponent(Graphics) || backdrop.addComponent(Graphics); graphics.clear(); graphics.fillColor = new Color(12, 10, 9, 205); graphics.rect(-640, -360, 1280, 720); graphics.fill();
            graphics.strokeColor = new Color(90, 61, 32, 210); graphics.lineWidth = 2; graphics.moveTo(-620, 299); graphics.lineTo(620, 299); graphics.moveTo(-620, -309); graphics.lineTo(620, -309); graphics.stroke();
            addAncientScreenTitle(root, title);
        };

        target.__SLG_ANCIENT_UI__ = {
            ANCIENT_UI: colors,
            localizeNode,
            ensureUiTransform,
            ensureUiChild,
            hideDirectUiSprites,
            suppressLegacyChrome,
            drawAncientPanel,
            createUiText,
            getButtonHandler,
            findButtonByHandler,
            styleAncientButton,
            styleAncientEditBox,
            addAncientScreenTitle,
            applyAncientScreenChrome,
        };
    }
`;

let main = fs.readFileSync('assets/scripts/Main.ts', 'utf8');
main = main.replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]cc['"];/, (whole, body) => {
  const names = body.split(',').map((v) => v.trim()).filter(Boolean);
  const required = ['Button','Color','EditBox','Graphics','HorizontalTextAlignment','Label','Sprite','UITransform','VerticalTextAlignment'];
  return `import { ${[...new Set([...names, ...required])].join(', ')} } from 'cc';`;
});
if (!main.includes('__SLG_ANCIENT_UI__')) {
  main = main.replace("    protected onLoad(): void {", bridgeMethod + "\n    protected onLoad(): void {\n        this.installAncientUiBridge();");
}
fs.writeFileSync('assets/scripts/Main.ts', main);
console.log('Installed stable ancient UI bridge in Main.ts');
