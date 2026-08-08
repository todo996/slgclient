export type MapPoint = Readonly<{
  x: number;
  y: number;
}>;

export type MapGeometryConfig = Readonly<{
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
}>;

export class MapCoordinate {
  private readonly config: MapGeometryConfig;

  constructor(config: MapGeometryConfig) {
    this.config = config;
    if (
      config.width <= 0 ||
      config.height <= 0 ||
      config.tileWidth <= 0 ||
      config.tileHeight <= 0
    ) {
      throw new Error("Kích thước bản đồ phải lớn hơn 0");
    }
  }

  get cellCount(): number {
    return this.config.width * this.config.height;
  }

  getCellId(point: MapPoint): number {
    return point.x + point.y * this.config.width;
  }

  getCellPoint(id: number): MapPoint {
    return {
      x: id % this.config.width,
      y: Math.floor(id / this.config.width),
    };
  }

  isValidCell(point: MapPoint): boolean {
    return (
      point.x >= 0 &&
      point.x < this.config.width &&
      point.y >= 0 &&
      point.y < this.config.height
    );
  }

  cellToWorld(point: MapPoint): MapPoint {
    const zeroX =
      this.config.width * this.config.tileWidth * 0.5;
    const zeroY =
      this.config.height * this.config.tileHeight -
      this.config.tileHeight * 0.5;

    return {
      x:
        zeroX -
        (point.y - point.x) *
          this.config.tileWidth *
          0.5,
      y:
        zeroY -
        (point.x + point.y) *
          this.config.tileHeight *
          0.5,
    };
  }

  worldToCell(point: MapPoint): MapPoint {
    return {
      x: Math.floor(
        this.config.height * 0.5 +
          point.x / this.config.tileWidth -
          point.y / this.config.tileHeight,
      ),
      y: Math.floor(
        this.config.width * 1.5 -
          point.x / this.config.tileWidth -
          point.y / this.config.tileHeight,
      ),
    };
  }
}
