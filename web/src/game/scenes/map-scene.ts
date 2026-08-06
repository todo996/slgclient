import Phaser from "phaser";
import { MapAreaGrid } from "../map/map-area-grid";
import { MapCoordinate } from "../map/map-coordinate";
import { MapInputController } from "../map/map-input-controller";
import { MapResourceCatalog } from "../map/map-resource-catalog";
import { MapResourceLayer } from "../map/map-resource-layer";
import { MapEntityLayer } from "../map/map-entity-layer";
import { MapEntityStore } from "../../legacy/map/map-entity-store";
import { MapScanController } from "../../legacy/map/map-scan-controller";
import { NetManager } from "../../legacy/network/socket/net-manager";
import type { MapBootstrapSnapshot } from "../../legacy/map/map-bootstrap-command";

const WORLD_MAP_KEY = "world-map";
const MAP_RESOURCE_CONFIG_KEY = "map-resource-config";
const MAP_READY_EVENT = "legacy-map-bootstrap-ready";
const MAP_CELL_SELECTED_EVENT = "map-cell-selected";

const TILESET_TEXTURES = [
  { name: "land", key: "world-land", url: "/game-assets/world/land.png" },
  { name: "hill", key: "world-hill", url: "/game-assets/world/hill.png" },
  {
    name: "water_edge_3",
    key: "world-water-edge-3",
    url: "/game-assets/world/water_edge_3.png",
  },
  {
    name: "water_edge_1",
    key: "world-water-edge-1",
    url: "/game-assets/world/water_edge_1.png",
  },
] as const;

const VISIBLE_LAYER_NAMES = ["base", "hill1", "hill2", "hill3"] as const;

export class MapScene extends Phaser.Scene {
  private map: Phaser.Tilemaps.Tilemap | null = null;
  private groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private marker: Phaser.GameObjects.Graphics | null = null;
  private coordinate: MapCoordinate | null = null;
  private resourceLayer: MapResourceLayer | null = null;
  private scanController: MapScanController | null = null;
  private entityStore: MapEntityStore | null = null;
  private entityLayer: MapEntityLayer | null = null;
  private mapBootstrapReady = false;
  private lastCenterCellId = -1;

  constructor() {
    super("MapScene");
  }

  preload(): void {
    this.load.tilemapTiledJSON(WORLD_MAP_KEY, "/game-assets/world/map.json");
    this.load.json(
      MAP_RESOURCE_CONFIG_KEY,
      "/game-assets/world/mapRes_0.json",
    );
    this.load.atlas(
      "map-tiles",
      "/game-assets/world/atlases/map_tiles.png",
      "/game-assets/world/atlases/map_tiles.json",
    );
    this.load.atlas(
      "map-res",
      "/game-assets/world/atlases/map_res.png",
      "/game-assets/world/atlases/map_res.json",
    );
    this.load.atlas(
      "map-frame-color",
      "/game-assets/world/atlases/map_frame_color.png",
      "/game-assets/world/atlases/map_frame_color.json",
    );
    this.load.atlas(
      "component-outside",
      "/game-assets/world/atlases/component_outside.png",
      "/game-assets/world/atlases/component_outside.json",
    );
    this.load.atlas(
      "map-qibing",
      "/game-assets/world/atlases/map_qibing.png",
      "/game-assets/world/atlases/map_qibing.json",
    );
    this.load.image("system-city", "/game-assets/world/sys_city.png");
    this.load.image("army-arrow", "/game-assets/world/army_arrow.png");
    this.load.json(
      "army-animation-manifest",
      "/game-assets/world/army_animations.json",
    );

    for (const tileset of TILESET_TEXTURES) {
      this.load.image(tileset.key, tileset.url);
    }
  }

  create(): void {
    this.createWorldMap();
    this.createRuntimeLayers();
    this.configureCamera();
    new MapInputController(this, this.selectCell).enable();
    this.syncMapCenter();

    this.game.events.on(MAP_READY_EVENT, this.onMapBootstrapReady, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  update(): void {
    this.syncMapCenter();
    this.entityLayer?.update();
  }

  private createWorldMap(): void {
    const map = this.make.tilemap({ key: WORLD_MAP_KEY });
    const tilesets = TILESET_TEXTURES.map((definition) => {
      const tileset = map.addTilesetImage(definition.name, definition.key);
      if (!tileset) throw new Error(`Không tạo được tileset ${definition.name}`);
      return tileset;
    });

    for (const [index, layerName] of VISIBLE_LAYER_NAMES.entries()) {
      const layer = map.createLayer(layerName, tilesets, 0, 0);
      if (!layer) throw new Error(`Không tạo được layer ${layerName}`);
      layer.setDepth(index);
      layer.setCullPadding(4, 8);
      if (layerName === "base") this.groundLayer = layer;
    }

    this.map = map;
    this.coordinate = new MapCoordinate({
      width: map.width,
      height: map.height,
      tileWidth: map.tileWidth,
      tileHeight: map.tileHeight,
    });
    this.marker = this.add.graphics().setDepth(50_000);
  }

  private createRuntimeLayers(): void {
    if (!this.map || !this.coordinate) return;

    const areaGrid = new MapAreaGrid({
      mapWidth: this.map.width,
      mapHeight: this.map.height,
      tileHeight: this.map.tileHeight,
      viewportHeight: Math.max(this.scale.height, this.map.tileHeight),
    });
    const catalog = MapResourceCatalog.fromUnknown(
      this.cache.json.get(MAP_RESOURCE_CONFIG_KEY),
    );

    if (catalog.width !== this.map.width || catalog.height !== this.map.height) {
      throw new Error("mapRes_0 không cùng kích thước với map TMX");
    }

    this.entityStore = new MapEntityStore(this.map.width);
    this.entityLayer = new MapEntityLayer(
      this,
      this.coordinate,
      areaGrid,
      this.entityStore,
    );
    this.resourceLayer = new MapResourceLayer(
      this,
      this.coordinate,
      areaGrid,
      catalog,
    );
    this.scanController = new MapScanController(
      areaGrid,
      (envelope, otherData) =>
        NetManager.getInstance().send(envelope, otherData),
    );
  }

  private configureCamera(): void {
    if (!this.map || !this.coordinate) return;

    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    camera.setZoom(0.58);

    const center = this.coordinate.cellToWorld({
      x: Math.floor(this.map.width / 2),
      y: Math.floor(this.map.height / 2),
    });
    camera.centerOn(center.x, center.y);
  }

  private syncMapCenter(): void {
    if (!this.map || !this.coordinate || !this.resourceLayer) return;

    const rawCell = this.coordinate.worldToCell(this.cameras.main.midPoint);
    const cell = {
      x: Phaser.Math.Clamp(rawCell.x, 0, this.map.width - 1),
      y: Phaser.Math.Clamp(rawCell.y, 0, this.map.height - 1),
    };
    const cellId = this.coordinate.getCellId(cell);
    if (cellId === this.lastCenterCellId) return;

    this.lastCenterCellId = cellId;
    this.resourceLayer.updateForCenter(cell);
    if (this.mapBootstrapReady) this.scanController?.updateForCenter(cell);
  }

  private readonly selectCell = (worldX: number, worldY: number): void => {
    if (!this.map || !this.groundLayer || !this.coordinate || !this.marker) {
      return;
    }

    const tilePoint = this.map.worldToTileXY(
      worldX,
      worldY,
      true,
      undefined,
      this.cameras.main,
    );
    if (!tilePoint) return;

    const cell = { x: Math.floor(tilePoint.x), y: Math.floor(tilePoint.y) };
    if (!this.coordinate.isValidCell(cell)) return;

    const corners = this.map.getTileCorners(
      cell.x,
      cell.y,
      this.cameras.main,
      this.groundLayer,
    );

    this.marker.clear();
    this.marker.lineStyle(4, 0xf1d07a, 0.95);
    if (corners?.length) {
      this.marker.beginPath();
      this.marker.moveTo(corners[0].x, corners[0].y);
      for (let index = 1; index < corners.length; index += 1) {
        this.marker.lineTo(corners[index].x, corners[index].y);
      }
      this.marker.closePath();
      this.marker.strokePath();
    }

    this.game.events.emit(MAP_CELL_SELECTED_EVENT, {
      id: this.coordinate.getCellId(cell),
      x: cell.x,
      y: cell.y,
      ready: this.mapBootstrapReady,
    });
  };

  private readonly onMapBootstrapReady = (
    snapshot?: MapBootstrapSnapshot,
  ): void => {
    if (snapshot) {
      this.entityLayer?.setRoleProperty(snapshot.roleProperty);
      this.entityStore?.seedRoleProperty(snapshot.roleProperty);
    }
    this.mapBootstrapReady = true;
    this.lastCenterCellId = -1;
    this.syncMapCenter();
  };

  private readonly shutdown = (): void => {
    this.game.events.off(MAP_READY_EVENT, this.onMapBootstrapReady, this);
    this.resourceLayer?.destroy();
    this.scanController?.destroy();
    this.entityLayer?.destroy();
    this.entityStore?.destroy();
    this.resourceLayer = null;
    this.scanController = null;
    this.entityLayer = null;
    this.entityStore = null;
    this.marker = null;
    this.groundLayer = null;
    this.map = null;
    this.coordinate = null;
    this.lastCenterCellId = -1;
  };
}
