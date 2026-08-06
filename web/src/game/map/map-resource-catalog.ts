import type { MapArea } from "./map-area-grid";

export enum MapResourceType {
  SystemFortress = 50,
  SystemCity = 51,
  Wood = 52,
  Iron = 53,
  Stone = 54,
  Grain = 55,
  Fortress = 56,
}

export type MapResourceCell = Readonly<{
  id: number;
  type: number;
  level: number;
  x: number;
  y: number;
}>;

export type ResourceFrame = Readonly<{
  atlas: "map-tiles" | "map-res";
  frame: string;
}>;

type RawMapResourceData = Readonly<{
  w: number;
  h: number;
  list: ReadonlyArray<ReadonlyArray<number>>;
}>;

export class MapResourceCatalog {
  private constructor(private readonly data: RawMapResourceData) {}

  static fromUnknown(input: unknown): MapResourceCatalog {
    if (!input || typeof input !== "object") {
      throw new Error("mapRes_0 không phải object");
    }

    const candidate = input as Partial<RawMapResourceData>;
    if (
      !Number.isInteger(candidate.w) ||
      !Number.isInteger(candidate.h) ||
      !Array.isArray(candidate.list) ||
      candidate.list.length !== Number(candidate.w) * Number(candidate.h)
    ) {
      throw new Error("mapRes_0 sai kích thước hoặc danh sách cell");
    }

    return new MapResourceCatalog(candidate as RawMapResourceData);
  }

  get width(): number {
    return this.data.w;
  }

  get height(): number {
    return this.data.h;
  }

  getCell(x: number, y: number): MapResourceCell | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;

    const id = x + y * this.width;
    const raw = this.data.list[id];
    const type = Number(raw?.[0] ?? 0);
    const level = Number(raw?.[1] ?? 0);
    return { id, type, level, x, y };
  }

  getAreaCells(area: MapArea): MapResourceCell[] {
    const result: MapResourceCell[] = [];
    for (let y = area.startCellY; y < area.endCellY; y += 1) {
      for (let x = area.startCellX; x < area.endCellX; x += 1) {
        const cell = this.getCell(x, y);
        if (cell && this.getFrame(cell)) result.push(cell);
      }
    }
    return result;
  }

  getFrame(cell: MapResourceCell): ResourceFrame | null {
    if (cell.type === MapResourceType.SystemFortress) {
      return { atlas: "map-res", frame: "sys_fortress" };
    }

    if (
      cell.type === MapResourceType.SystemCity ||
      cell.type === MapResourceType.Fortress ||
      cell.level <= 0
    ) {
      return null;
    }

    if (cell.level === 1 || cell.level === 2) {
      return {
        atlas: "map-tiles",
        frame: `land_ground_${cell.level}_1`,
      };
    }

    const frameLevel = cell.level - 2;
    if (cell.type === MapResourceType.Grain) {
      return { atlas: "map-res", frame: `land_1_${frameLevel}` };
    }
    if (
      cell.type === MapResourceType.Wood ||
      cell.type === MapResourceType.Stone
    ) {
      return { atlas: "map-res", frame: `land_2_${frameLevel}` };
    }
    if (cell.type === MapResourceType.Iron) {
      return { atlas: "map-res", frame: `land_4_${frameLevel}` };
    }

    return null;
  }
}
