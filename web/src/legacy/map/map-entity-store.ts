import type { MapArea } from "../../game/map/map-area-grid.ts";
import { EventMgr } from "../events/event-manager.ts";
import { MapRuntimeEvent } from "./map-scan-controller.ts";

export type MapCityEntity = Readonly<{
  kind: "city";
  cellId: number;
  cityId: number;
  rid: number;
  name: string;
  x: number;
  y: number;
  isMain: number;
  level: number;
  curDurable: number;
  maxDurable: number;
  unionId: number;
  parentId: number;
  unionName: string;
  occupyTime: number;
}>;

export type MapBuildEntity = Readonly<{
  kind: "build";
  cellId: number;
  rid: number;
  nickName: string;
  name: string;
  x: number;
  y: number;
  type: number;
  level: number;
  opLevel: number;
  curDurable: number;
  maxDurable: number;
  defender: number;
  unionId: number;
  parentId: number;
  unionName: string;
  occupyTime: number;
  giveUpTime: number;
  endTime: number;
}>;

export type MapArmyEntity = Readonly<{
  kind: "army";
  id: number;
  cityId: number;
  order: number;
  generals: readonly number[];
  soldiers: readonly number[];
  conTimes: readonly number[];
  conCnts: readonly number[];
  cmd: number;
  state: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
  endTime: number;
  x: number;
  y: number;
}>;

export type EntityChanges<T> = Readonly<{
  added: readonly T[];
  updated: readonly T[];
  removed: readonly T[];
}>;

export type MapEntityChanges = Readonly<{
  areaId: number | null;
  cities: EntityChanges<MapCityEntity>;
  builds: EntityChanges<MapBuildEntity>;
  armies: EntityChanges<MapArmyEntity>;
}>;

type RawScanData = Readonly<{
  mc_builds?: unknown;
  mr_builds?: unknown;
  armys?: unknown;
}>;

type RawRoleProperty = Readonly<{
  citys?: unknown;
  mr_builds?: unknown;
  armys?: unknown;
}>;

const numberValue = (value: unknown): number => {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
};

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const numberList = (value: unknown): readonly number[] =>
  Array.isArray(value) ? value.map(numberValue) : [];

const recordList = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === "object",
      )
    : [];

const sameEntity = (first: unknown, second: unknown): boolean =>
  JSON.stringify(first) === JSON.stringify(second);

const hasChanges = <T>(changes: EntityChanges<T>): boolean =>
  changes.added.length > 0 ||
  changes.updated.length > 0 ||
  changes.removed.length > 0;

export class MapEntityStore {
  private readonly cities = new Map<number, MapCityEntity>();
  private readonly builds = new Map<number, MapBuildEntity>();
  private readonly armies = new Map<number, MapArmyEntity>();
  private readonly cityIdsByArea = new Map<number, Set<number>>();
  private readonly buildIdsByArea = new Map<number, Set<number>>();

  constructor(private readonly mapWidth: number) {
    if (!Number.isInteger(mapWidth) || mapWidth <= 0) {
      throw new Error("Chiều rộng map phải là số nguyên dương");
    }

    EventMgr.on(
      MapRuntimeEvent.scanBlockUpdated,
      this.onScanBlockUpdated,
      this,
    );
  }

  seedRoleProperty(value: unknown): MapEntityChanges {
    const roleProperty = (
      value && typeof value === "object" ? value : {}
    ) as RawRoleProperty;

    const changes: MapEntityChanges = {
      areaId: null,
      cities: this.upsertCities(recordList(roleProperty.citys)),
      builds: this.upsertBuilds(recordList(roleProperty.mr_builds)),
      armies: this.upsertArmies(recordList(roleProperty.armys)),
    };
    this.emitChanges(changes);
    return changes;
  }

  applyScan(value: unknown, area: MapArea): MapEntityChanges {
    const scan = (
      value && typeof value === "object" ? value : {}
    ) as RawScanData;

    const cityRecords = recordList(scan.mc_builds).filter((record) =>
      this.belongsToArea(record, area),
    );
    const buildRecords = recordList(scan.mr_builds).filter((record) =>
      this.belongsToArea(record, area),
    );

    const changes: MapEntityChanges = {
      areaId: area.id,
      cities: this.replaceAreaEntities(
        area.id,
        cityRecords.map((record) => this.createCity(record)),
        this.cities,
        this.cityIdsByArea,
        (entity) => entity.cellId,
      ),
      builds: this.replaceAreaEntities(
        area.id,
        buildRecords.map((record) => this.createBuild(record)),
        this.builds,
        this.buildIdsByArea,
        (entity) => entity.cellId,
      ),
      armies: this.upsertArmies(recordList(scan.armys)),
    };

    this.emitChanges(changes);
    return changes;
  }

  getCity(cellId: number): MapCityEntity | null {
    return this.cities.get(cellId) ?? null;
  }

  getBuild(cellId: number): MapBuildEntity | null {
    return this.builds.get(cellId) ?? null;
  }

  getArmy(id: number): MapArmyEntity | null {
    return this.armies.get(id) ?? null;
  }

  getAllCities(): readonly MapCityEntity[] {
    return [...this.cities.values()];
  }

  getAllBuilds(): readonly MapBuildEntity[] {
    return [...this.builds.values()];
  }

  getAllArmies(): readonly MapArmyEntity[] {
    return [...this.armies.values()];
  }

  clear(): void {
    this.cities.clear();
    this.builds.clear();
    this.armies.clear();
    this.cityIdsByArea.clear();
    this.buildIdsByArea.clear();
  }

  destroy(): void {
    EventMgr.targetOff(this);
    this.clear();
  }

  private readonly onScanBlockUpdated = (
    value: unknown,
    area?: MapArea,
  ): void => {
    if (!area) return;
    this.applyScan(value, area);
  };

  private upsertCities(
    records: readonly Record<string, unknown>[],
  ): EntityChanges<MapCityEntity> {
    return this.upsertEntities(
      records.map((record) => this.createCity(record)),
      this.cities,
      (entity) => entity.cellId,
    );
  }

  private upsertBuilds(
    records: readonly Record<string, unknown>[],
  ): EntityChanges<MapBuildEntity> {
    return this.upsertEntities(
      records.map((record) => this.createBuild(record)),
      this.builds,
      (entity) => entity.cellId,
    );
  }

  private upsertArmies(
    records: readonly Record<string, unknown>[],
  ): EntityChanges<MapArmyEntity> {
    return this.upsertEntities(
      records.map((record) => this.createArmy(record)),
      this.armies,
      (entity) => entity.id,
    );
  }

  private upsertEntities<T>(
    incoming: readonly T[],
    storage: Map<number, T>,
    getId: (entity: T) => number,
  ): EntityChanges<T> {
    const added: T[] = [];
    const updated: T[] = [];

    for (const entity of incoming) {
      const id = getId(entity);
      const current = storage.get(id);
      storage.set(id, entity);
      if (!current) added.push(entity);
      else if (!sameEntity(current, entity)) updated.push(entity);
    }

    return { added, updated, removed: [] };
  }

  private replaceAreaEntities<T>(
    areaId: number,
    incoming: readonly T[],
    storage: Map<number, T>,
    areaIds: Map<number, Set<number>>,
    getId: (entity: T) => number,
  ): EntityChanges<T> {
    const previousIds = new Set(areaIds.get(areaId) ?? []);
    const nextIds = new Set<number>();
    const added: T[] = [];
    const updated: T[] = [];
    const removed: T[] = [];

    for (const entity of incoming) {
      const id = getId(entity);
      const current = storage.get(id);
      nextIds.add(id);
      storage.set(id, entity);
      if (!current) added.push(entity);
      else if (!sameEntity(current, entity)) updated.push(entity);
    }

    for (const id of previousIds) {
      if (nextIds.has(id)) continue;
      const current = storage.get(id);
      if (current) removed.push(current);
      storage.delete(id);
    }

    areaIds.set(areaId, nextIds);
    return { added, updated, removed };
  }

  private createCity(record: Record<string, unknown>): MapCityEntity {
    const x = numberValue(record.x);
    const y = numberValue(record.y);
    return {
      kind: "city",
      cellId: this.getCellId(x, y),
      cityId: numberValue(record.cityId),
      rid: numberValue(record.rid),
      name: stringValue(record.name),
      x,
      y,
      isMain: numberValue(record.is_main),
      level: numberValue(record.level),
      curDurable: numberValue(record.cur_durable),
      maxDurable: numberValue(record.max_durable ?? record.maxDurable),
      unionId: numberValue(record.union_id),
      parentId: numberValue(record.parent_id),
      unionName: stringValue(record.union_name),
      occupyTime: numberValue(record.occupy_time),
    };
  }

  private createBuild(record: Record<string, unknown>): MapBuildEntity {
    const x = numberValue(record.x);
    const y = numberValue(record.y);
    return {
      kind: "build",
      cellId: this.getCellId(x, y),
      rid: numberValue(record.rid),
      nickName: stringValue(record.RNick),
      name: stringValue(record.name),
      x,
      y,
      type: numberValue(record.type),
      level: numberValue(record.level),
      opLevel: numberValue(record.op_level),
      curDurable: numberValue(record.cur_durable),
      maxDurable: numberValue(record.max_durable ?? record.maxDurable),
      defender: numberValue(record.defender),
      unionId: numberValue(record.union_id),
      parentId: numberValue(record.parent_id),
      unionName: stringValue(record.union_name),
      occupyTime: numberValue(record.occupy_time),
      giveUpTime: numberValue(record.giveUp_time),
      endTime: numberValue(record.end_time),
    };
  }

  private createArmy(record: Record<string, unknown>): MapArmyEntity {
    const cmd = numberValue(record.cmd);
    const rawFromX = numberValue(record.from_x);
    const rawFromY = numberValue(record.from_y);
    const rawToX = numberValue(record.to_x);
    const rawToY = numberValue(record.to_y);
    const returning = cmd === 4;
    const fromX = returning ? rawToX : rawFromX;
    const fromY = returning ? rawToY : rawFromY;
    const toX = returning ? rawFromX : rawToX;
    const toY = returning ? rawFromY : rawToY;
    const inCity = cmd === 0 || cmd === 5;

    return {
      kind: "army",
      id: numberValue(record.id),
      cityId: numberValue(record.cityId),
      order: numberValue(record.order),
      generals: numberList(record.generals),
      soldiers: numberList(record.soldiers),
      conTimes: numberList(record.con_times),
      conCnts: numberList(record.con_cnts),
      cmd,
      state: numberValue(record.state),
      fromX,
      fromY,
      toX,
      toY,
      startTime: numberValue(record.start) * 1000,
      endTime: numberValue(record.end) * 1000,
      x: inCity ? fromX : toX,
      y: inCity ? fromY : toY,
    };
  }

  private belongsToArea(
    record: Record<string, unknown>,
    area: MapArea,
  ): boolean {
    const x = numberValue(record.x);
    const y = numberValue(record.y);
    return (
      x >= area.startCellX &&
      x < area.endCellX &&
      y >= area.startCellY &&
      y < area.endCellY
    );
  }

  private getCellId(x: number, y: number): number {
    return x + y * this.mapWidth;
  }

  private emitChanges(changes: MapEntityChanges): void {
    if (
      hasChanges(changes.cities) ||
      hasChanges(changes.builds) ||
      hasChanges(changes.armies)
    ) {
      EventMgr.emit(MapRuntimeEvent.entitiesChanged, changes);
    }
  }
}
