import Phaser from "phaser";
import type { MapAreaGrid } from "./map-area-grid.ts";
import type { MapCoordinate } from "./map-coordinate.ts";
import {
  EMPTY_OWNER_CONTEXT,
  getArmyAnimationKey,
  getArmyWorldPosition,
  getBuildVisualKind,
  getFortressStatus,
  getRelationFrames,
  getSystemCityScale,
  isArmyVisible,
  readOwnerContext,
  shouldRenderArmy,
  type MapOwnerContext,
} from "./map-entity-visual.ts";
import {
  MapEntityStore,
  type MapArmyEntity,
  type MapBuildEntity,
  type MapCityEntity,
  type MapEntityChanges,
} from "../../legacy/map/map-entity-store.ts";
import { EventMgr } from "../../legacy/events/event-manager.ts";
import { MapRuntimeEvent } from "../../legacy/map/map-scan-controller.ts";
import { DateUtil } from "../../legacy/utils/date-util.ts";

const RELATION_ATLAS = "map-frame-color";
const BUILD_ATLAS = "component-outside";
const ARMY_ATLAS = "map-qibing";
const ARMY_ARROW = "army-arrow";

const ENTITY_DEPTH = 20_000;
const ARMY_DEPTH = 30_000;

type RelationView = Readonly<{
  down: Phaser.GameObjects.Image;
  up: Phaser.GameObjects.Image;
}>;

type CityView = Readonly<{
  container: Phaser.GameObjects.Container;
  relation: RelationView;
}>;

type BuildView = Readonly<{
  container: Phaser.GameObjects.Container;
  relation?: RelationView;
  status?: Phaser.GameObjects.Text;
}>;

type ArmyView = {
  data: MapArmyEntity;
  sprite: Phaser.GameObjects.Sprite;
  arrow: Phaser.GameObjects.Image;
  animationKey: string;
};

type AnimationManifest = Readonly<{
  animations?: readonly Readonly<{
    key: string;
    frames: readonly string[];
    frameRate: number;
    repeat: number;
  }>[];
}>;

type VisibleAreaChange = Readonly<{
  addIds?: readonly number[];
  removeIds?: readonly number[];
}>;

const createRelationView = (
  scene: Phaser.Scene,
  width: number,
  height: number,
): RelationView => ({
  down: scene.add
    .image(0, 0, RELATION_ATLAS)
    .setDisplaySize(width, height)
    .setVisible(false),
  up: scene.add
    .image(0, 0, RELATION_ATLAS)
    .setDisplaySize(width, height)
    .setVisible(false),
});

export class MapEntityLayer {
  private readonly cityViews = new Map<number, CityView>();
  private readonly buildViews = new Map<number, BuildView>();
  private readonly armyViews = new Map<number, ArmyView>();
  private readonly visibleAreaIds = new Set<number>();
  private ownerContext: MapOwnerContext = EMPTY_OWNER_CONTEXT;
  private lastCountdownSecond = -1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly coordinate: MapCoordinate,
    private readonly areaGrid: MapAreaGrid,
    private readonly store: MapEntityStore,
  ) {
    this.createArmyAnimations();
    EventMgr.on(MapRuntimeEvent.entitiesChanged, this.onEntitiesChanged, this);
    EventMgr.on(
      MapRuntimeEvent.visibleAreasChanged,
      this.onVisibleAreasChanged,
      this,
    );
  }

  setRoleProperty(roleProperty: unknown): void {
    this.ownerContext = readOwnerContext(roleProperty);
    this.refreshAll();
  }

  update(now = DateUtil.getServerTime()): void {
    for (const view of this.armyViews.values()) this.updateArmyView(view, now);

    const second = Math.floor(now / 1000);
    if (second === this.lastCountdownSecond) return;
    this.lastCountdownSecond = second;
    for (const build of this.store.getAllBuilds()) {
      const status = this.buildViews.get(build.cellId)?.status;
      if (status) status.setText(getFortressStatus(build, now));
    }
  }

  destroy(): void {
    EventMgr.targetOff(this);
    for (const view of this.cityViews.values()) view.container.destroy(true);
    for (const view of this.buildViews.values()) view.container.destroy(true);
    for (const view of this.armyViews.values()) this.destroyArmyView(view);
    this.cityViews.clear();
    this.buildViews.clear();
    this.armyViews.clear();
    this.visibleAreaIds.clear();
  }

  private readonly onEntitiesChanged = (changes: MapEntityChanges): void => {
    for (const city of changes.cities.removed) this.removeCity(city.cellId);
    for (const city of [...changes.cities.added, ...changes.cities.updated]) {
      this.upsertCity(city);
    }

    for (const build of changes.builds.removed) this.removeBuild(build.cellId);
    for (const build of [...changes.builds.added, ...changes.builds.updated]) {
      this.upsertBuild(build);
    }

    for (const army of changes.armies.removed) this.removeArmy(army.id);
    for (const army of [...changes.armies.added, ...changes.armies.updated]) {
      this.upsertArmy(army);
    }

    if (
      changes.cities.added.length ||
      changes.cities.updated.length ||
      changes.cities.removed.length ||
      changes.builds.added.length ||
      changes.builds.updated.length ||
      changes.builds.removed.length
    ) {
      this.refreshArmies();
    }
  };

  private readonly onVisibleAreasChanged = (change: VisibleAreaChange): void => {
    for (const id of change.removeIds ?? []) this.visibleAreaIds.delete(id);
    for (const id of change.addIds ?? []) this.visibleAreaIds.add(id);
    this.refreshAll();
  };

  private refreshAll(): void {
    for (const city of this.store.getAllCities()) this.upsertCity(city);
    for (const build of this.store.getAllBuilds()) this.upsertBuild(build);
    this.refreshArmies();
  }

  private refreshArmies(): void {
    const armyIds = new Set(this.store.getAllArmies().map((army) => army.id));
    for (const id of this.armyViews.keys()) {
      if (!armyIds.has(id)) this.removeArmy(id);
    }
    for (const army of this.store.getAllArmies()) this.upsertArmy(army);
  }

  private isCellVisible(x: number, y: number): boolean {
    if (!this.visibleAreaIds.size || !this.coordinate.isValidCell({ x, y })) {
      return false;
    }
    return this.visibleAreaIds.has(this.areaGrid.getAreaIdForCell({ x, y }));
  }

  private upsertCity(city: MapCityEntity): void {
    if (!this.isCellVisible(city.x, city.y)) {
      this.removeCity(city.cellId);
      return;
    }

    this.removeCity(city.cellId);
    const world = this.coordinate.cellToWorld(city);
    const relation = createRelationView(this.scene, 580, 308);
    const cityImage = this.scene.add
      .image(-5, -25, BUILD_ATLAS, "component_998")
      .setScale(1.5);
    const name = this.scene.add
      .text(0, -43.628, city.name, {
        color: "#ffffff",
        fontFamily: "Noto Serif, serif",
        fontSize: "26px",
        stroke: "#24160b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Thứ tự con giữ theo RoleCity.prefab: up, down, sprite, label.
    const container = this.scene.add.container(world.x, world.y, [
      relation.up,
      relation.down,
      cityImage,
      name,
    ]);
    container.setDepth(ENTITY_DEPTH + world.y);
    this.applyRelation(relation, city);
    this.cityViews.set(city.cellId, { container, relation });
  }

  private removeCity(cellId: number): void {
    const view = this.cityViews.get(cellId);
    if (!view) return;
    view.container.destroy(true);
    this.cityViews.delete(cellId);
  }

  private upsertBuild(build: MapBuildEntity): void {
    if (!this.isCellVisible(build.x, build.y)) {
      this.removeBuild(build.cellId);
      return;
    }

    this.removeBuild(build.cellId);
    const kind = getBuildVisualKind(build);
    if (kind === "none") return;

    const world = this.coordinate.cellToWorld(build);
    let view: BuildView;

    if (kind === "system-city") {
      const relation = createRelationView(this.scene, 1000, 500);
      const cityImage = this.scene.add
        .image(0, -15, "system-city")
        .setDisplaySize(800, 400);
      // Thứ tự con giữ theo SysCity.prefab: down, up, cityicon.
      const container = this.scene.add.container(world.x, world.y, [
        relation.down,
        relation.up,
        cityImage,
      ]);
      container
        .setScale(getSystemCityScale(build.level))
        .setDepth(ENTITY_DEPTH + world.y);
      this.applyRelation(relation, build);
      view = { container, relation };
    } else if (kind === "fortress") {
      const image = this.scene.add
        .image(0, -22, BUILD_ATLAS, "component_119")
        .setScale(0.8);
      const title = this.scene.add
        .text(0, -62, this.getFortressName(build), {
          color: "#ffffff",
          fontFamily: "Noto Serif, serif",
          fontSize: "20px",
          stroke: "#24160b",
          strokeThickness: 3,
        })
        .setOrigin(0.5);
      const status = this.scene.add
        .text(0, 0, getFortressStatus(build, DateUtil.getServerTime()), {
          color: "#ffffff",
          fontFamily: "Noto Serif, serif",
          fontSize: "18px",
          stroke: "#24160b",
          strokeThickness: 3,
        })
        .setOrigin(0.5);
      const container = this.scene.add
        .container(world.x, world.y, [image, title, status])
        .setDepth(ENTITY_DEPTH + world.y);
      view = { container, status };
    } else {
      const relation = createRelationView(this.scene, 200, 100);
      const container = this.scene.add
        .container(world.x, world.y, [relation.up, relation.down])
        .setDepth(ENTITY_DEPTH + world.y);
      this.applyRelation(relation, build);
      view = { container, relation };
    }

    this.buildViews.set(build.cellId, view);
  }

  private removeBuild(cellId: number): void {
    const view = this.buildViews.get(cellId);
    if (!view) return;
    view.container.destroy(true);
    this.buildViews.delete(cellId);
  }

  private getFortressName(build: MapBuildEntity): string {
    if (build.nickName && build.name) return `${build.nickName}:${build.name}`;
    return build.name || build.nickName || "Pháo đài";
  }

  private applyRelation(
    view: RelationView,
    data: MapCityEntity | MapBuildEntity,
  ): void {
    const frames = getRelationFrames(data, this.ownerContext);
    if (!frames) {
      view.down.setVisible(false);
      view.up.setVisible(false);
      return;
    }
    view.down.setTexture(RELATION_ATLAS, frames.down).setVisible(true);
    view.up.setTexture(RELATION_ATLAS, frames.up).setVisible(true);
  }

  private upsertArmy(army: MapArmyEntity): void {
    if (!this.shouldShowArmy(army)) {
      this.removeArmy(army.id);
      return;
    }

    let view = this.armyViews.get(army.id);
    const start = this.coordinate.cellToWorld({ x: army.fromX, y: army.fromY });
    const end = this.coordinate.cellToWorld({ x: army.toX, y: army.toY });
    const animationKey = getArmyAnimationKey(start, end);

    if (!view) {
      const sprite = this.scene.add.sprite(0, 0, ARMY_ATLAS);
      const arrow = this.scene.add
        .image(0, 0, ARMY_ARROW)
        .setOrigin(0.5, 1)
        .setDisplaySize(20, 36);
      view = { data: army, sprite, arrow, animationKey: "" };
      this.armyViews.set(army.id, view);
    }

    view.data = army;
    if (view.animationKey !== animationKey) {
      view.animationKey = animationKey;
      view.sprite.play(animationKey, true);
    }
    this.updateArmyView(view, DateUtil.getServerTime());
  }

  private removeArmy(id: number): void {
    const view = this.armyViews.get(id);
    if (!view) return;
    this.destroyArmyView(view);
    this.armyViews.delete(id);
  }

  private destroyArmyView(view: ArmyView): void {
    view.sprite.destroy();
    view.arrow.destroy();
  }

  private shouldShowArmy(army: MapArmyEntity): boolean {
    if (!shouldRenderArmy(army)) return false;

    const inVisibleArea = [
      { x: army.x, y: army.y },
      { x: army.fromX, y: army.fromY },
      { x: army.toX, y: army.toY },
    ].some((cell) => this.isCellVisible(cell.x, cell.y));
    if (!inVisibleArea) return false;

    return isArmyVisible(
      army,
      this.store.getAllCities(),
      this.store.getAllBuilds(),
      this.ownerContext,
    );
  }

  private updateArmyView(view: ArmyView, now: number): void {
    if (!this.shouldShowArmy(view.data)) {
      view.sprite.setVisible(false);
      view.arrow.setVisible(false);
      return;
    }

    const start = this.coordinate.cellToWorld({
      x: view.data.fromX,
      y: view.data.fromY,
    });
    const end = this.coordinate.cellToWorld({
      x: view.data.toX,
      y: view.data.toY,
    });
    const current = getArmyWorldPosition(view.data, start, end, now);
    view.sprite
      .setPosition(current.x, current.y)
      .setDepth(ARMY_DEPTH + current.y)
      .setVisible(true);

    const deltaX = end.x - current.x;
    const deltaY = end.y - current.y;
    const length = Math.hypot(deltaX, deltaY);
    const moving = view.data.state > 0 && length > 1;
    view.arrow.setVisible(moving);
    if (moving) {
      view.arrow
        .setPosition(current.x, current.y)
        .setAngle((Math.atan2(deltaY, deltaX) * 180) / Math.PI + 90)
        .setDisplaySize(20, length)
        .setDepth(ARMY_DEPTH - 1 + current.y);
    }
  }

  private createArmyAnimations(): void {
    const manifest = this.scene.cache.json.get(
      "army-animation-manifest",
    ) as AnimationManifest | undefined;

    for (const animation of manifest?.animations ?? []) {
      if (this.scene.anims.exists(animation.key)) continue;
      this.scene.anims.create({
        key: animation.key,
        frames: animation.frames.map((frame) => ({
          key: ARMY_ATLAS,
          frame,
        })),
        frameRate: animation.frameRate,
        repeat: animation.repeat,
      });
    }
  }
}
