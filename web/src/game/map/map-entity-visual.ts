import type {
  MapArmyEntity,
  MapBuildEntity,
  MapCityEntity,
} from "../../legacy/map/map-entity-store.ts";
import { MapResourceType } from "./map-resource-catalog.ts";
import type { MapPoint } from "./map-coordinate.ts";

export type MapOwnerContext = Readonly<{
  myId: number;
  myUnionId: number;
  myParentId: number;
}>;

export type MapRelationColor =
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "red";

export type MapRelationFrames = Readonly<{
  down: string;
  up: string;
}>;

type OwnerData = Readonly<{
  rid: number;
  unionId: number;
  parentId: number;
}>;

const numberValue = (value: unknown): number => {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
};

export const EMPTY_OWNER_CONTEXT: MapOwnerContext = {
  myId: 0,
  myUnionId: 0,
  myParentId: 0,
};

export function readOwnerContext(roleProperty: unknown): MapOwnerContext {
  if (!roleProperty || typeof roleProperty !== "object") {
    return EMPTY_OWNER_CONTEXT;
  }

  const citys = (roleProperty as { citys?: unknown }).citys;
  if (!Array.isArray(citys)) return EMPTY_OWNER_CONTEXT;

  const mainCity = citys.find(
    (item): item is Record<string, unknown> =>
      item !== null &&
      typeof item === "object" &&
      numberValue((item as Record<string, unknown>).is_main) === 1,
  ) ?? citys.find(
    (item): item is Record<string, unknown> =>
      item !== null && typeof item === "object",
  );

  if (!mainCity) return EMPTY_OWNER_CONTEXT;

  return {
    myId: numberValue(mainCity.rid),
    myUnionId: numberValue(mainCity.union_id),
    myParentId: numberValue(mainCity.parent_id),
  };
}

export function getRelationColor(
  data: OwnerData,
  context: MapOwnerContext,
): MapRelationColor | null {
  if (!data.rid) return null;
  if (data.rid === context.myId) return "blue";
  if (data.unionId > 0 && data.unionId === context.myUnionId) return "green";
  if (data.unionId > 0 && data.unionId === context.myParentId) return "purple";
  if (data.parentId > 0 && data.parentId === context.myUnionId) return "yellow";
  return "red";
}

export function getRelationFrames(
  data: OwnerData,
  context: MapOwnerContext,
): MapRelationFrames | null {
  const color = getRelationColor(data, context);
  return color
    ? { down: `${color}_1_3`, up: `${color}_2_3` }
    : null;
}

export function getSystemCityScale(level: number): number {
  if (level >= 8) return 1.5;
  if (level >= 5) return 1;
  return 0.5;
}

export type BuildVisualKind =
  | "system-city"
  | "fortress"
  | "resource-border"
  | "none";

export function getBuildVisualKind(build: MapBuildEntity): BuildVisualKind {
  if (build.type === MapResourceType.SystemCity) return "system-city";
  if (build.type === MapResourceType.Fortress) return "fortress";
  if (
    build.type >= MapResourceType.Wood &&
    build.type < MapResourceType.Fortress
  ) {
    return "resource-border";
  }
  return "none";
}

export function getFortressStatus(
  build: MapBuildEntity,
  now: number,
): string {
  if (build.endTime <= now) return "";
  const leftSeconds = Math.max(0, Math.ceil((build.endTime - now) / 1000));
  const hours = Math.floor(leftSeconds / 3600);
  const minutes = Math.floor((leftSeconds % 3600) / 60);
  const seconds = leftSeconds % 60;
  const time = [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

  if (build.level === 0) return `Đang xây dựng...${time}`;
  if (build.level > 0 && build.opLevel > 0) return `Đang nâng cấp...${time}`;
  if (build.opLevel === 0) return `Đang phá dỡ...${time}`;
  return "";
}

export function getArmyAnimationKey(
  start: MapPoint,
  end: MapPoint,
): string {
  if (start.y === end.y) return start.x < end.x ? "qb_run_r" : "qb_run_l";
  if (start.y < end.y) {
    if (start.x < end.x) return "qb_run_ru";
    if (start.x === end.x) return "qb_run_u";
    return "qb_run_lu";
  }
  if (start.x < end.x) return "qb_run_rd";
  if (start.x === end.x) return "qb_run_d";
  return "qb_run_ld";
}

export function getArmyWorldPosition(
  army: MapArmyEntity,
  start: MapPoint,
  end: MapPoint,
  now: number,
): MapPoint {
  if (army.state <= 0 || army.endTime <= army.startTime) return end;
  const progress = Math.min(
    1,
    Math.max(0, (now - army.startTime) / (army.endTime - army.startTime)),
  );
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };
}

export function shouldRenderArmy(army: MapArmyEntity): boolean {
  return army.cmd !== 0 && army.cmd !== 5;
}

const isFriendly = (data: OwnerData, context: MapOwnerContext): boolean =>
  data.rid === context.myId ||
  (context.myUnionId > 0 &&
    (data.unionId === context.myUnionId ||
      data.parentId === context.myUnionId));

const isNear = (
  x: number,
  y: number,
  targetX: number,
  targetY: number,
): boolean => Math.abs(x - targetX) <= 5 && Math.abs(y - targetY) <= 5;

export function isArmyVisible(
  army: MapArmyEntity,
  cities: readonly MapCityEntity[],
  builds: readonly MapBuildEntity[],
  context: MapOwnerContext,
): boolean {
  const ownerCity = cities.find((city) => city.cityId === army.cityId);
  if (ownerCity?.rid === context.myId) return true;

  const positions = [
    { x: army.x, y: army.y },
    { x: army.toX, y: army.toY },
    { x: army.fromX, y: army.fromY },
  ];
  const friendly = [
    ...cities.filter((city) => isFriendly(city, context)),
    ...builds.filter((build) => isFriendly(build, context)),
  ];

  return positions.some((position) =>
    friendly.some((entity) => isNear(position.x, position.y, entity.x, entity.y)),
  );
}
