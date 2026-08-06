import Phaser from "phaser";
import { MapCoordinate } from "../map/map-coordinate";
import { MapInputController } from "../map/map-input-controller";

const WORLD_MAP_KEY = "world-map";
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
  private mapBootstrapReady = false;

  constructor() {
    super("MapScene");
  }

  preload(): void {
    this.load.tilemapTiledJSON(WORLD_MAP_KEY, "/game-assets/world/map.json");
    for (const tileset of TILESET_TEXTURES) {
      this.load.image(tileset.key, tileset.url);
    }
  }

  create(): void {
    this.createWorldMap();
    this.configureCamera();
    new MapInputController(this, this.selectCell).enable();

    this.game.events.on(MAP_READY_EVENT, this.onMapBootstrapReady, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(MAP_READY_EVENT, this.onMapBootstrapReady, this);
    });
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
    this.marker = this.add.graphics().setDepth(50);
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

  private readonly onMapBootstrapReady = (): void => {
    this.mapBootstrapReady = true;
  };
}
