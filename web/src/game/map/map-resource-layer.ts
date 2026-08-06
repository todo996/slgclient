import Phaser from "phaser";
import type { MapCellPoint } from "./map-area-grid";
import { MapAreaGrid } from "./map-area-grid";
import { MapCoordinate } from "./map-coordinate";
import {
  MapResourceCatalog,
  type ResourceFrame,
} from "./map-resource-catalog";

type ResourceImage = Phaser.GameObjects.Image;

export class MapResourceLayer {
  private readonly visibleAreas = new Map<number, ResourceImage[]>();
  private readonly pools = new Map<ResourceFrame["atlas"], ResourceImage[]>();
  private centerAreaId = -1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly coordinate: MapCoordinate,
    private readonly areaGrid: MapAreaGrid,
    private readonly catalog: MapResourceCatalog,
  ) {}

  updateForCenter(cell: MapCellPoint): void {
    const areaId = this.areaGrid.getAreaIdForCell(cell);
    if (areaId === this.centerAreaId) return;
    this.centerAreaId = areaId;

    const nextAreaIds = new Set(this.areaGrid.getNeighborAreaIds(cell));
    for (const currentAreaId of this.visibleAreas.keys()) {
      if (!nextAreaIds.has(currentAreaId)) this.releaseArea(currentAreaId);
    }
    for (const nextAreaId of nextAreaIds) {
      if (!this.visibleAreas.has(nextAreaId)) this.createArea(nextAreaId);
    }
  }

  destroy(): void {
    for (const areaId of [...this.visibleAreas.keys()]) this.releaseArea(areaId);
    for (const pool of this.pools.values()) {
      for (const image of pool) image.destroy();
      pool.length = 0;
    }
    this.pools.clear();
  }

  private createArea(areaId: number): void {
    const images: ResourceImage[] = [];
    for (const resource of this.catalog.getAreaCells(this.areaGrid.getArea(areaId))) {
      const frame = this.catalog.getFrame(resource);
      if (!frame) continue;

      const image = this.acquire(frame);
      const world = this.coordinate.cellToWorld(resource);
      image
        .setPosition(world.x, world.y)
        .setOrigin(0.5, 0.5)
        .setDepth(10_000 + world.y)
        .setVisible(true);
      images.push(image);
    }
    this.visibleAreas.set(areaId, images);
  }

  private releaseArea(areaId: number): void {
    const images = this.visibleAreas.get(areaId);
    if (!images) return;

    for (const image of images) {
      image.setVisible(false);
      const atlas = image.texture.key as ResourceFrame["atlas"];
      const pool = this.pools.get(atlas) ?? [];
      pool.push(image);
      this.pools.set(atlas, pool);
    }
    this.visibleAreas.delete(areaId);
  }

  private acquire(frame: ResourceFrame): ResourceImage {
    const pool = this.pools.get(frame.atlas);
    const image = pool?.pop() ?? this.scene.add.image(0, 0, frame.atlas, frame.frame);
    image.setTexture(frame.atlas, frame.frame);
    return image;
  }
}
