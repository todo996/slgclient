import type { MapBootstrapSnapshot } from "../legacy/map/map-bootstrap-command.ts";

export type HudResourceKey =
  | "decree"
  | "grain"
  | "wood"
  | "iron"
  | "stone"
  | "gold"
  | "wood_yield"
  | "iron_yield"
  | "stone_yield"
  | "grain_yield";

export type HudResourceItem = Readonly<{
  key: HudResourceKey;
  label: string;
  value: string;
}>;

export type HudCityItem = Readonly<{
  cityId: number;
  name: string;
  x: number;
  y: number;
  isMain: number;
}>;

export type HudArmyItem = Readonly<{
  id: number;
  cityId: number;
  order: number;
  cmd: number;
  state: number;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  soldiers: readonly number[];
  endTime: number;
}>;

export type HudTagItem = Readonly<{
  name: string;
  x: number;
  y: number;
}>;

export const HUD_MENU_ACTIONS = [
  { key: "general", label: "Võ tướng", event: "open_general", notice: false },
  { key: "report", label: "Chiến báo", event: "open_war_report", notice: true },
  { key: "draw", label: "Chiêu mộ", event: "open_draw", notice: false },
  { key: "union", label: "Liên minh", event: "open_union", notice: true },
  { key: "collect", label: "Trưng thu", event: "open_collection", notice: false },
  { key: "market", label: "Chợ", event: "open_transform", notice: false },
  { key: "chat", label: "Chat", event: "open_chat", notice: false },
  { key: "skill", label: "Kỹ năng", event: "open_skill", notice: false },
] as const;

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object"
    ? value as Record<string, unknown>
    : {};

const records = (value: unknown): readonly Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === "object",
      )
    : [];

const numberValue = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const trimNumber = (value: number): string =>
  Number(value.toFixed(value >= 10 ? 0 : 1)).toLocaleString("vi-VN");

export const formatCompactNumber = (value: unknown): string => {
  const number = numberValue(value);
  if (number >= 1_000_000_000) return `${trimNumber(number / 1_000_000_000)} tỷ`;
  if (number >= 1_000_000) return `${trimNumber(number / 1_000_000)} triệu`;
  if (number >= 1_000) return `${trimNumber(number / 1_000)} nghìn`;
  return Math.floor(number).toLocaleString("vi-VN");
};

export function createHudResources(value: unknown): readonly HudResourceItem[] {
  const data = record(value);
  const capacity = formatCompactNumber(data.depot_capacity);
  const stored = (key: HudResourceKey): string =>
    `${formatCompactNumber(data[key])}/${capacity}`;

  return [
    { key: "decree", label: "Lệnh:", value: formatCompactNumber(data.decree) },
    { key: "grain", label: "Lương:", value: stored("grain") },
    { key: "wood", label: "Gỗ:", value: stored("wood") },
    { key: "iron", label: "Sắt:", value: stored("iron") },
    { key: "stone", label: "Đá:", value: stored("stone") },
    { key: "gold", label: "Vàng:", value: formatCompactNumber(data.gold) },
    { key: "wood_yield", label: "Gỗ+", value: formatCompactNumber(data.wood_yield) },
    { key: "iron_yield", label: "Sắt+", value: formatCompactNumber(data.iron_yield) },
    { key: "stone_yield", label: "Đá+", value: formatCompactNumber(data.stone_yield) },
    { key: "grain_yield", label: "Lương+", value: formatCompactNumber(data.grain_yield) },
  ];
}

export function readHudCities(snapshot: MapBootstrapSnapshot): readonly HudCityItem[] {
  const property = record(snapshot.roleProperty);
  return records(property.citys).map((item) => ({
    cityId: numberValue(item.cityId),
    name: stringValue(item.name),
    x: numberValue(item.x),
    y: numberValue(item.y),
    isMain: numberValue(item.is_main),
  }));
}

export function readHudArmies(snapshot: MapBootstrapSnapshot): readonly HudArmyItem[] {
  const property = record(snapshot.roleProperty);
  return records(property.armys).map((item) => ({
    id: numberValue(item.id),
    cityId: numberValue(item.cityId),
    order: numberValue(item.order),
    cmd: numberValue(item.cmd),
    state: numberValue(item.state),
    x: numberValue(item.x),
    y: numberValue(item.y),
    fromX: numberValue(item.from_x),
    fromY: numberValue(item.from_y),
    toX: numberValue(item.to_x),
    toY: numberValue(item.to_y),
    soldiers: Array.isArray(item.soldiers)
      ? item.soldiers.map(numberValue)
      : [],
    endTime: numberValue(item.end_time),
  }));
}

export function readHudTags(snapshot: MapBootstrapSnapshot): readonly HudTagItem[] {
  const message = record(snapshot.positionTags);
  const source = Array.isArray(snapshot.positionTags)
    ? snapshot.positionTags
    : message.pos_tags;
  return records(source).map((item) => ({
    name: stringValue(item.name),
    x: numberValue(item.x),
    y: numberValue(item.y),
  }));
}

export function isValidMapCoordinate(x: unknown, y: unknown, size = 200): boolean {
  const cellX = Number(x);
  const cellY = Number(y);
  return Number.isInteger(cellX) && Number.isInteger(cellY) &&
    cellX >= 0 && cellY >= 0 && cellX < size && cellY < size;
}

export function getArmyStateLabel(army: HudArmyItem): string {
  if (army.state > 0) return army.cmd === 4 ? "[Rút lui]" : "[Hành quân]";
  const labels: Record<number, string> = {
    0: "[Chờ lệnh]",
    1: "[Tấn công]",
    2: "[Đồn trú]",
    3: "[Điều động]",
    4: "[Trở về]",
    5: "[Chiêu mộ]",
    6: "[Đồn điền]",
  };
  return labels[army.cmd] ?? "[Chờ lệnh]";
}
