import { DateUtil } from "../utils/date-util.ts";

export const ArmyCmd = {
  Idle: 0,
  Attack: 1,
  Garrison: 2,
  Reclaim: 3,
  Return: 4,
  Conscript: 5,
  Transfer: 6,
} as const;

export type ArmyData = Readonly<{
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

type RawRecord = Record<string, unknown>;
const record = (value: unknown): RawRecord => value !== null && typeof value === "object" ? value as RawRecord : {};
const records = (value: unknown): readonly RawRecord[] => Array.isArray(value)
  ? value.filter((item): item is RawRecord => item !== null && typeof item === "object")
  : [];
const numberValue = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const numberList = (value: unknown): number[] => Array.isArray(value) ? value.map(numberValue) : [];

export const createArmyFromServer = (value: unknown): ArmyData | null => {
  const raw = record(value);
  const id = numberValue(raw.id);
  const cityId = numberValue(raw.cityId);
  const order = numberValue(raw.order);
  if (!id || !cityId || !order) return null;
  const cmd = numberValue(raw.cmd);
  const rawFromX = numberValue(raw.from_x);
  const rawFromY = numberValue(raw.from_y);
  const rawToX = numberValue(raw.to_x);
  const rawToY = numberValue(raw.to_y);
  const fromX = cmd === ArmyCmd.Return ? rawToX : rawFromX;
  const fromY = cmd === ArmyCmd.Return ? rawToY : rawFromY;
  const toX = cmd === ArmyCmd.Return ? rawFromX : rawToX;
  const toY = cmd === ArmyCmd.Return ? rawFromY : rawToY;
  const stopped = cmd === ArmyCmd.Idle || cmd === ArmyCmd.Conscript;
  return {
    id,
    cityId,
    order,
    generals: numberList(raw.generals),
    soldiers: numberList(raw.soldiers),
    conTimes: numberList(raw.con_times),
    conCnts: numberList(raw.con_cnts),
    cmd,
    state: numberValue(raw.state),
    fromX,
    fromY,
    toX,
    toY,
    startTime: numberValue(raw.start) * 1000,
    endTime: numberValue(raw.end) * 1000,
    x: stopped ? fromX : toX,
    y: stopped ? fromY : toY,
  };
};

export const isArmyConscriptComplete = (army: ArmyData): boolean =>
  army.conTimes.some((time) => time > 0 && DateUtil.getServerTime() >= time * 1000);

export class ArmyProxy {
  private readonly maxArmyCount = 5;
  private readonly armies = new Map<number, Array<ArmyData | null>>();

  clearData(): void { this.armies.clear(); }

  getArmyList(cityId: number): readonly (ArmyData | null)[] {
    return this.armies.get(cityId) ?? Array.from({ length: this.maxArmyCount }, () => null);
  }

  updateArmies(cityId: number, value: unknown): readonly (ArmyData | null)[] {
    const list = this.ensureCity(cityId);
    for (const raw of records(value)) {
      const army = createArmyFromServer(raw);
      if (army) list[army.order - 1] = army;
    }
    return list;
  }

  updateArmy(value: unknown): ArmyData | null {
    const army = createArmyFromServer(value);
    if (!army) return null;
    this.ensureCity(army.cityId)[army.order - 1] = army;
    return army;
  }

  updateArmiesNoCity(value: unknown): readonly ArmyData[] {
    const updated: ArmyData[] = [];
    for (const raw of records(value)) {
      const army = this.updateArmy(raw);
      if (army) updated.push(army);
    }
    return updated;
  }

  getArmyById(id: number, cityId: number): ArmyData | null {
    return this.getArmyList(cityId).find((army) => army?.id === id) ?? null;
  }

  getArmyByOrder(order: number, cityId: number): ArmyData | null {
    return this.getArmyList(cityId)[order - 1] ?? null;
  }

  getAllArmies(): readonly ArmyData[] {
    return [...this.armies.values()].flatMap((list) => list.filter((item): item is ArmyData => item !== null));
  }

  getArmiesByPosition(x: number, y: number): readonly ArmyData[] {
    return this.getAllArmies().filter((army) => army.fromX === x && army.fromY === y);
  }

  private ensureCity(cityId: number): Array<ArmyData | null> {
    let list = this.armies.get(cityId);
    if (!list) {
      list = Array.from({ length: this.maxArmyCount }, () => null);
      this.armies.set(cityId, list);
    }
    return list;
  }
}
