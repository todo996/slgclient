import type { MapArea, MapCellPoint } from "../../game/map/map-area-grid";
import { MapAreaGrid } from "../../game/map/map-area-grid.ts";
import { ServerConfig } from "../config/server-config.ts";
import { EventMgr } from "../events/event-manager.ts";
import type { OutgoingEnvelope } from "../network/socket/net-interface.ts";

export const MAP_SCAN_CACHE_MS = 10_000;

export const MapRuntimeEvent = {
  visibleAreasChanged: "map_visible_areas_changed",
  scanBlockUpdated: "map_scan_block_updated",
  entitiesChanged: "map_entities_changed",
} as const;

type SendRequest = (
  envelope: OutgoingEnvelope,
  otherData: unknown,
) => Promise<unknown>;

type ScanResponse = Readonly<{
  code?: number;
  msg?: unknown;
}>;

export class MapScanController {
  private readonly requestedAt = new Map<number, number>();
  private visibleAreaIds = new Set<number>();

  constructor(
    private readonly areaGrid: MapAreaGrid,
    private readonly sendRequest: SendRequest,
  ) {
    EventMgr.on(
      ServerConfig.nationMap_scanBlock,
      this.onScanBlock,
      this,
    );
  }

  updateForCenter(cell: MapCellPoint, now = Date.now()): void {
    const centerAreaId = this.areaGrid.getAreaIdForCell(cell);
    const nextIds = new Set(this.areaGrid.getNeighborAreaIds(cell));
    const addIds = [...nextIds].filter((id) => !this.visibleAreaIds.has(id));
    const removeIds = [...this.visibleAreaIds].filter((id) => !nextIds.has(id));
    this.visibleAreaIds = nextIds;

    EventMgr.emit(MapRuntimeEvent.visibleAreasChanged, {
      centerAreaId,
      addIds,
      removeIds,
    });

    const orderedIds = [
      centerAreaId,
      ...[...nextIds].filter((id) => id !== centerAreaId),
    ];
    for (const id of orderedIds) this.requestArea(id, now);
  }

  destroy(): void {
    EventMgr.targetOff(this);
    this.requestedAt.clear();
    this.visibleAreaIds.clear();
  }

  private requestArea(id: number, now: number): void {
    const lastRequest = this.requestedAt.get(id);
    if (
      lastRequest !== undefined &&
      now - lastRequest < MAP_SCAN_CACHE_MS
    ) {
      return;
    }

    const area = this.areaGrid.getArea(id);
    this.requestedAt.set(id, now);
    void this.sendRequest(
      {
        name: ServerConfig.nationMap_scanBlock,
        msg: {
          x: area.startCellX,
          y: area.startCellY,
          length: area.length,
        },
      },
      area,
    );
  }

  private readonly onScanBlock = (
    data: ScanResponse,
    area?: MapArea,
  ): void => {
    if (data.code !== 0 || !area) return;
    EventMgr.emit(MapRuntimeEvent.scanBlockUpdated, data.msg ?? {}, area);
  };
}
