from pathlib import Path

path = Path('assets/scripts/map/ui/MapUILogic.ts')
text = path.read_text(encoding='utf-8')
start = text.index('    private buildReferenceMapHud(): void {')
end = text.index('    private topLevelChildOf(node: Node): Node {', start)

method = r'''    private buildReferenceMapHud(): void {
        const legacyRoots = [...this.node.children];
        const contentRoot = this.topLevelChildOf(this.contentNode);
        const oldWidget = this.widgetNode;

        // HUD cũ không còn xuất hiện ở runtime. Chỉ giữ contentRoot để popup/logic thật tiếp tục hoạt động.
        for (const child of legacyRoots) {
            if (child !== contentRoot) child.active = false;
        }
        if (oldWidget && oldWidget !== contentRoot) oldWidget.active = false;
        if (this.srollLayout?.node) this.srollLayout.node.active = false;
        if (this.nameLabel?.node) this.nameLabel.node.active = false;
        if (this.ridLabel?.node) this.ridLabel.node.active = false;

        const hud = new Node('ReferenceMapHud');
        hud.parent = this.node;
        hud.layer = this.node.layer;
        hud.addComponent(UITransform).setContentSize(1280, 720);
        this._referenceHud = hud;
        this.widgetNode = hud;

        // Hồ sơ nhỏ ở góc trái, giữ phần lớn bản đồ thông thoáng như ảnh mẫu.
        const profile = this.makePanel(
            hud, 'PlayerProfile', 252, 86, -506, 310,
            new Color(12, 10, 8, 224), new Color(159, 112, 54, 238), 2, 8,
        );
        this.makePanel(profile, 'AvatarOuter', 72, 72, -87, 0, new Color(41, 25, 16, 255), new Color(224, 174, 86, 255), 3, 36);
        this.makePanel(profile, 'AvatarInner', 58, 58, -87, 0, new Color(74, 42, 23, 255), new Color(102, 65, 31, 255), 1, 29);
        this.makeLabel(profile, 'AvatarMark', 'T', -87, 1, 28, new Color(239, 205, 135, 255), true, 54);
        this._referenceRoleName = this.makeLabel(profile, 'RoleName', '', 25, 18, 18, new Color(247, 225, 180, 255), true, 148);
        this._referenceRoleId = this.makeLabel(profile, 'RoleId', '', 25, -8, 12, new Color(166, 143, 104, 255), false, 148);
        this.makeLabel(profile, 'ProfileCaption', 'CHỦ CÔNG', 20, -30, 10, new Color(116, 91, 58, 255), true, 100);
        this.makeButton(profile, 'Logout', 'Thoát', 91, -29, 54, 24, () => this.onBack(), false, 10);

        // Thanh tài nguyên liền, mảnh và trong suốt hơn bản trước.
        const resourceBar = this.makePanel(
            hud, 'ResourceBar', 860, 46, 196, 333,
            new Color(11, 9, 7, 222), new Color(112, 79, 39, 225), 1, 5,
        );
        const resources: Array<{key: string; title: string}> = [
            {key: 'decree', title: 'Lệnh'},
            {key: 'gold', title: 'Vàng'},
            {key: 'wood', title: 'Gỗ'},
            {key: 'iron', title: 'Sắt'},
            {key: 'stone', title: 'Đá'},
            {key: 'grain', title: 'Lương'},
        ];
        resources.forEach((item, index) => {
            const x = -355 + index * 142;
            if (index > 0) {
                this.makePanel(resourceBar, `ResourceDivider_${index}`, 1, 27, x - 70, 0, new Color(86, 59, 31, 170), new Color(0, 0, 0, 0), 0, 0);
            }
            this.makeLabel(resourceBar, `${item.key}_title`, item.title, x - 28, 0, 11, new Color(169, 140, 93, 255), true, 48);
            this._referenceResourceLabels[item.key] = this.makeLabel(resourceBar, `${item.key}_value`, '0', x + 30, 0, 14, new Color(239, 220, 178, 255), true, 72);
        });

        // Menu dọc trái: chỉ các chức năng đã có handler thật.
        const rail = this.makePanel(
            hud, 'LeftRail', 128, 376, -568, 84,
            new Color(8, 7, 6, 155), new Color(92, 62, 31, 150), 1, 8,
        );
        const menu: Array<{title: string; action: () => void}> = [
            {title: 'Tướng', action: () => this.onClickGeneral()},
            {title: 'Chiến báo', action: () => this.openWarReport()},
            {title: 'Chiêu mộ', action: () => this.openDraw()},
            {title: 'Liên minh', action: () => this.openUnion()},
            {title: 'Chợ', action: () => this.openTr()},
            {title: 'Trò chuyện', action: () => this.openChat()},
            {title: 'Thu thuế', action: () => this.onClickCollection()},
            {title: 'Kỹ năng', action: () => this.onClickSkillBtn()},
        ];
        menu.forEach((item, index) => {
            const y = 158 - index * 45;
            const btn = this.makeButton(rail, `Menu_${index}`, item.title, 0, y, 112, 38, item.action, false, 12);
            this.makePanel(btn, `MenuAccent_${index}`, 3, 24, -50, 0, new Color(190, 139, 65, 235), new Color(0, 0, 0, 0), 0, 0);
        });

        // Thanh chat góc dưới trái dùng đúng openChat(), không hiển thị nội dung giả.
        const chatBar = this.makePanel(
            hud, 'WorldChatBar', 350, 42, -434, -323,
            new Color(8, 8, 7, 205), new Color(118, 82, 39, 225), 1, 7,
        );
        chatBar.addComponent(Button);
        chatBar.on(Button.EventType.CLICK, () => this.openChat(), this);
        this.makeLabel(chatBar, 'ChatChannel', 'THẾ GIỚI', -118, 0, 11, new Color(213, 166, 83, 255), true, 80);
        this.makePanel(chatBar, 'ChatDivider', 1, 22, -70, 0, new Color(91, 62, 34, 210), new Color(0, 0, 0, 0), 0, 0);
        this.makeLabel(chatBar, 'ChatHint', 'Mở trò chuyện', 35, 0, 12, new Color(185, 174, 153, 255), false, 190);
        this.makeLabel(chatBar, 'ChatArrow', '›', 151, 0, 20, new Color(217, 172, 88, 255), true, 24);

        // Cài đặt thật ở góc phải dưới như ảnh mẫu.
        const utility = this.makePanel(
            hud, 'BottomRightUtility', 104, 58, 569, -317,
            new Color(10, 8, 7, 215), new Color(129, 89, 43, 235), 1, 8,
        );
        this.makeButton(utility, 'SettingButton', 'Cài đặt', 0, 0, 90, 42, () => this.onClickSetting(), false, 12);

        if (contentRoot) {
            contentRoot.active = true;
            contentRoot.setSiblingIndex(this.node.children.length - 1);
        }
        hud.setSiblingIndex(Math.max(0, this.node.children.length - 2));
    }

'''

new_text = text[:start] + method + text[end:]
path.write_text(new_text, encoding='utf-8')

check = path.read_text(encoding='utf-8')
for required in ['WorldChatBar', 'ResourceBar', 'LeftRail', "action: () => this.openWarReport()", "action: () => this.openChat()"]:
    if required not in check:
        raise SystemExit(f'Map HUD migration missing {required}')
