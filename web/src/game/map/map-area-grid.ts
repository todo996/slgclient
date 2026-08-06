export type MapCellPoint = Readonly<{ x: number; y: number }>;

export type MapArea = Readonly<{
  id: number;
  x: number;
  y: number;
  startCellX: number;
  startCellY: number;
  endCellX: number;
  endCellY: number;
  length: number;
}>;

export type MapAreaGridConfig = Readonly<{
  mapWidth: number;
  mapHeight: number;
  tileHeight: number;
  viewportHeight: number;
}>;

export class MapAreaGrid {
  readonly areaCellSize: number;
  readonly width: number;
  readonly height: number;

  constructor(private readonly config: MapAreaGridConfig) {
    if (
      config.mapWidth <= 0 ||
      config.mapHeight <= 0 ||
      config.tileHeight <= 0 ||
      config.viewportHeight <= 0
    ) {
      throw new Error("Kích thước chia vùng bản đồ phải lớn hơn 0");
    }

    this.areaCellSize = Math.min(
      Math.ceil(config.viewportHeight / config.tileHeight / 2) * 2 + 2,
      config.mapHeight,
    );
    this.width = Math.ceil(config.mapWidth / this.areaCellSize);
    this.height = Math.ceil(config.mapHeight / this.areaCellSize);
  }

  get count(): number {
    return this.width * this.height;
  }

  getAreaIdForCell(cell: MapCellPoint): number {
    const areaX = Math.floor(cell.x / this.areaCellSize);
    const areaY = Math.floor(cell.y / this.areaCellSize);
    return this.getAreaId(areaX, areaY);
  }

  getArea(id: number): MapArea {
    if (!this.isValidAreaId(id)) {
      throw new RangeError(`Area id không hợp lệ: ${id}`);
    }

    const x = id % this.width;
    const y = Math.floor(id / this.width);
    const startCellX = x * this.areaCellSize;
    const startCellY = y * this.areaCellSize;

    return {
      id,
      x,
      y,
      startCellX,
      startCellY,
      endCellX: Math.min(startCellX + this.areaCellSize, this.config.mapWidth),
      endCellY: Math.min(startCellY + this.areaCellSize, this.config.mapHeight),
      length: this.areaCellSize,
    };
  }

  getNeighborAreaIds(cell: MapCellPoint): number[] {
    const centerId = this.getAreaIdForCell(cell);
    const centerX = centerId % this.width;
    const centerY = Math.floor(centerId / this.width);
    const result: number[] = [];

    for (let y = centerY - 1; y <= centerY + 1; y += 1) {
      for (let x = centerX - 1; x <= centerX + 1; x += 1) {
        if (!this.isValidAreaPoint(x, y)) continue;
        result.push(this.getAreaId(x, y));
      }
    }

    return result;
  }

  private getAreaId(x: number, y: number): number {
    if (!this.isValidAreaPoint(x, y)) {
      throw new RangeError(`Tọa độ area không hợp lệ: ${x},${y}`);
    }
    return x + y * this.width;
  }

  private isValidAreaPoint(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private isValidAreaId(id: number): boolean {
    return Number.isInteger(id) && id >= 0 && id < this.count;
  }
}
