import { LogicEvent } from "../legacy/common/logic-event.ts";
import { EventMgr } from "../legacy/events/event-manager.ts";
import { LoginCommand } from "../legacy/login/login-command.ts";
import type { MapBootstrapSnapshot } from "../legacy/map/map-bootstrap-command.ts";
import { MapRuntimeEvent } from "../legacy/map/map-scan-controller.ts";
import { MapUiCommand } from "../legacy/map/map-ui-command.ts";
import type { MapEntityChanges } from "../legacy/map/map-entity-store.ts";
import {
  HUD_MENU_ACTIONS,
  createHudResources,
  formatCompactNumber,
  getArmyStateLabel,
  isValidMapCoordinate,
  readHudArmies,
  readHudCities,
  readHudTags,
  type HudArmyItem,
  type HudCityItem,
  type HudTagItem,
} from "./map-hud-data.ts";

type HudTab = "army" | "city" | "tag";

type CenterCell = Readonly<{ x: number; y: number }>;

const createButton = (label: string, className: string): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
};

export class MapHud {
  private readonly root = document.createElement("div");
  private readonly stage = document.createElement("div");
  private readonly resourceGrid = document.createElement("div");
  private readonly identity = document.createElement("div");
  private readonly list = document.createElement("div");
  private readonly xInput = document.createElement("input");
  private readonly yInput = document.createElement("input");
  private readonly tabs = new Map<HudTab, HTMLButtonElement>();
  private readonly cities = new Map<number, HudCityItem>();
  private readonly armies = new Map<number, HudArmyItem>();
  private tags: readonly HudTagItem[] = [];
  private activeTab: HudTab = "army";
  private readonly resizeObserver: ResizeObserver;

  constructor(
    private readonly host: HTMLElement,
    private readonly onLogout: () => void,
  ) {
    this.root.className = "map-hud";
    this.stage.className = "map-hud__stage";
    this.root.appendChild(this.stage);
    this.host.replaceChildren(this.root);
    this.build();
    this.resizeObserver = new ResizeObserver(() => this.updateScale());
    this.resizeObserver.observe(this.host);
    this.updateScale();

    EventMgr.on(LogicEvent.updateMyRoleRes, this.renderResources, this);
    EventMgr.on(LogicEvent.mapCenterChange, this.onMapCenterChange, this);
    EventMgr.on(MapRuntimeEvent.entitiesChanged, this.onEntitiesChanged, this);
    EventMgr.on(LogicEvent.updateTag, this.onTagsUpdated, this);
    MapUiCommand.getInstance();
  }

  setSnapshot(snapshot: MapBootstrapSnapshot): void {
    this.cities.clear();
    this.armies.clear();
    for (const city of readHudCities(snapshot)) this.cities.set(city.cityId, city);
    for (const army of readHudArmies(snapshot)) this.armies.set(army.id, army);
    this.tags = readHudTags(snapshot);
    this.renderIdentity();
    this.renderResources();
    this.renderList();
    if (LoginCommand.getInstance().proxy.getRoleResData() === null) {
      MapUiCommand.getInstance().queryRoleResources();
    }
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    EventMgr.targetOff(this);
    MapUiCommand.destroy();
    this.host.replaceChildren();
  }

  private build(): void {
    const top = document.createElement("div");
    top.className = "map-hud__top";

    const logout = createButton("", "map-hud__back");
    logout.setAttribute("aria-label", "Đăng xuất");
    logout.addEventListener("click", this.onLogout);

    this.resourceGrid.className = "map-hud__resources";
    this.identity.className = "map-hud__identity";
    top.append(logout, this.resourceGrid, this.identity);

    const menu = document.createElement("nav");
    menu.className = "map-hud__menu";
    menu.setAttribute("aria-label", "Menu bản đồ");
    for (const action of HUD_MENU_ACTIONS) {
      const button = createButton(action.label, "map-hud__menu-button");
      button.dataset.action = action.key;
      if (action.notice) {
        const notice = document.createElement("span");
        notice.className = "map-hud__notice";
        notice.setAttribute("aria-hidden", "true");
        button.appendChild(notice);
      }
      button.addEventListener("click", () => EventMgr.emit(action.event));
      menu.appendChild(button);
    }

    const right = document.createElement("aside");
    right.className = "map-hud__right";
    const tabBar = document.createElement("div");
    tabBar.className = "map-hud__tabs";
    const tabDefinitions: readonly [HudTab, string][] = [
      ["army", "Đội quân"],
      ["city", "Thành trì"],
      ["tag", "Đánh dấu"],
    ];
    for (const [key, label] of tabDefinitions) {
      const tab = createButton(label, "map-hud__tab");
      tab.dataset.tab = key;
      tab.setAttribute("aria-selected", String(key === this.activeTab));
      tab.addEventListener("click", () => this.selectTab(key));
      this.tabs.set(key, tab);
      tabBar.appendChild(tab);
    }
    this.list.className = "map-hud__list";
    right.append(tabBar, this.list);

    const jump = document.createElement("form");
    jump.className = "map-hud__jump";
    this.xInput.type = "number";
    this.yInput.type = "number";
    this.xInput.min = "0";
    this.yInput.min = "0";
    this.xInput.max = "199";
    this.yInput.max = "199";
    this.xInput.inputMode = "numeric";
    this.yInput.inputMode = "numeric";
    this.xInput.className = "map-hud__coord";
    this.yInput.className = "map-hud__coord";
    this.xInput.setAttribute("aria-label", "Tọa độ X");
    this.yInput.setAttribute("aria-label", "Tọa độ Y");
    const xLabel = document.createElement("span");
    xLabel.textContent = "X";
    const yLabel = document.createElement("span");
    yLabel.textContent = "Y";
    const submit = createButton("Nhảy", "map-hud__jump-button");
    submit.type = "submit";
    jump.append(xLabel, this.xInput, yLabel, this.yInput, submit);
    jump.addEventListener("submit", this.onJump);

    const setting = createButton("Cài đặt", "map-hud__setting");
    setting.addEventListener("click", () => EventMgr.emit(LogicEvent.openSetting));

    this.stage.append(top, menu, right, jump, setting);
  }

  private updateScale(): void {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (width <= 0 || height <= 0) return;
    const scale = Math.min(width / 1280, height / 720);
    this.root.style.setProperty("--map-hud-scale", String(scale));
  }

  private renderIdentity(): void {
    const role = LoginCommand.getInstance().proxy.getRoleData();
    this.identity.replaceChildren(
      this.createIdentityRow("Tên nhân vật:", role?.nickName ?? ""),
      this.createIdentityRow("Nhân vật ID:", String(role?.rid ?? 0)),
    );
  }

  private createIdentityRow(labelText: string, valueText: string): HTMLElement {
    const row = document.createElement("div");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    label.textContent = `${labelText} `;
    value.textContent = valueText;
    row.append(label, value);
    return row;
  }

  private readonly renderResources = (): void => {
    const resources = createHudResources(
      LoginCommand.getInstance().proxy.getRoleResData(),
    );
    this.resourceGrid.replaceChildren();
    for (const item of resources) {
      const cell = document.createElement("div");
      cell.className = "map-hud__resource";
      cell.dataset.resource = item.key;
      const label = document.createElement("span");
      label.textContent = item.label;
      const value = document.createElement("strong");
      value.textContent = item.value;
      cell.append(label, value);
      this.resourceGrid.appendChild(cell);
    }
  };

  private selectTab(tab: HudTab): void {
    this.activeTab = tab;
    for (const [key, button] of this.tabs) {
      button.setAttribute("aria-selected", String(key === tab));
    }
    this.renderList();
  }

  private renderList(): void {
    this.list.replaceChildren();
    if (this.activeTab === "army") this.renderArmies();
    else if (this.activeTab === "city") this.renderCities();
    else this.renderTags();
  }

  private renderArmies(): void {
    const values = [...this.armies.values()].sort((a, b) => a.order - b.order);
    for (const army of values) {
      const button = createButton("", "map-hud__list-item map-hud__army-item");
      const soldiers = army.soldiers.reduce((sum, value) => sum + value, 0);
      const title = document.createElement("span");
      const position = document.createElement("span");
      const detail = document.createElement("small");
      title.textContent = `${getArmyStateLabel(army)} Đội ${army.order}`;
      position.textContent = `(${army.x}, ${army.y})`;
      detail.textContent = `Kỵ binh ${formatCompactNumber(soldiers)}`;
      button.append(title, position, detail);
      button.addEventListener("click", () => {
        button.classList.toggle("is-expanded");
      });
      this.list.appendChild(button);
    }
  }

  private renderCities(): void {
    const values = [...this.cities.values()].sort((a, b) => b.isMain - a.isMain);
    for (const city of values) {
      const button = createButton("", "map-hud__list-item");
      button.append(
        this.createTextSpan(city.name),
        this.createTextSpan(`(${city.x}, ${city.y})`),
      );
      button.addEventListener("click", () => EventMgr.emit(LogicEvent.scrollToMap, city.x, city.y));
      this.list.appendChild(button);
    }
  }

  private renderTags(): void {
    for (const tag of this.tags) {
      const button = createButton("", "map-hud__list-item");
      button.append(
        this.createTextSpan(tag.name),
        this.createTextSpan(`(${tag.x}, ${tag.y})`),
      );
      button.addEventListener("click", () => EventMgr.emit(LogicEvent.scrollToMap, tag.x, tag.y));
      this.list.appendChild(button);
    }
  }

  private createTextSpan(text: string): HTMLSpanElement {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
  }

  private readonly onTagsUpdated = (value?: unknown): void => {
    if (value !== undefined) {
      this.tags = readHudTags({
        nationMapConfig: {},
        roleProperty: {},
        positionTags: value,
      });
    }
    if (this.activeTab === "tag") this.renderList();
  };

  private readonly onMapCenterChange = (cell: CenterCell): void => {
    this.xInput.value = String(cell.x);
    this.yInput.value = String(cell.y);
  };

  private readonly onJump = (event: SubmitEvent): void => {
    event.preventDefault();
    const x = Number(this.xInput.value);
    const y = Number(this.yInput.value);
    if (!isValidMapCoordinate(x, y)) {
      EventMgr.emit(LogicEvent.showToast, "Không thể đi đến vị trí này");
      return;
    }
    EventMgr.emit(LogicEvent.scrollToMap, x, y);
  };

  private readonly onEntitiesChanged = (changes: MapEntityChanges): void => {
    const roleId = LoginCommand.getInstance().proxy.getRoleData()?.rid ?? 0;
    const ownCityIds = new Set(this.cities.keys());

    for (const city of changes.cities.removed) this.cities.delete(city.cityId);
    for (const city of [...changes.cities.added, ...changes.cities.updated]) {
      if (city.rid === roleId) {
        this.cities.set(city.cityId, {
          cityId: city.cityId,
          name: city.name,
          x: city.x,
          y: city.y,
          isMain: city.isMain,
        });
        ownCityIds.add(city.cityId);
      }
    }

    for (const army of changes.armies.removed) this.armies.delete(army.id);
    for (const army of [...changes.armies.added, ...changes.armies.updated]) {
      if (!ownCityIds.has(army.cityId)) continue;
      this.armies.set(army.id, {
        id: army.id,
        cityId: army.cityId,
        order: army.order,
        cmd: army.cmd,
        state: army.state,
        x: army.x,
        y: army.y,
        fromX: army.fromX,
        fromY: army.fromY,
        toX: army.toX,
        toY: army.toY,
        soldiers: army.soldiers,
        endTime: army.endTime,
      });
    }
    this.renderList();
  };
}
