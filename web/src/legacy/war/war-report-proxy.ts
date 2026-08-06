export type WarGeneralSnapshot = Readonly<{
  id: number;
  cfgId: number;
  physicalPower: number;
  order: number;
  level: number;
  exp: number;
  cityId: number;
  curArms: number;
  hasPrPoint: number;
  attackDistance: number;
  forceAdded: number;
  strategyAdded: number;
  defenseAdded: number;
  speedAdded: number;
  destroyAdded: number;
  starLv: number;
  star: number;
}>;

export type WarReportSkill = Readonly<{
  fromId: number;
  toId: readonly number[];
  cfgId: number;
  level: number;
  includeEffect: readonly number[];
  effectValue: readonly number[];
  effectRound: readonly number[];
  kill: readonly number[];
}>;

export type WarReportRound = Readonly<{
  id: number;
  isAttack: boolean;
  attack: WarGeneralSnapshot | null;
  defense: WarGeneralSnapshot | null;
  defenseLoss: number;
  round: number;
  turn: number;
  attackBefore: readonly WarReportSkill[];
  attackAfter: readonly WarReportSkill[];
  defenseAfter: readonly WarReportSkill[];
}>;

export type WarReport = Readonly<{
  id: number;
  attackRid: number;
  defenseRid: number;
  beginAttackArmy: Readonly<Record<string, unknown>>;
  beginDefenseArmy: Readonly<Record<string, unknown>>;
  endAttackArmy: Readonly<Record<string, unknown>>;
  endDefenseArmy: Readonly<Record<string, unknown>>;
  result: number;
  rounds: readonly WarReportRound[];
  attackIsRead: boolean;
  defenseIsRead: boolean;
  destroyDurable: number;
  occupy: number;
  x: number;
  y: number;
  createTime: number;
  beginAttackGenerals: readonly WarGeneralSnapshot[];
  beginDefenseGenerals: readonly WarGeneralSnapshot[];
  endAttackGenerals: readonly WarGeneralSnapshot[];
  endDefenseGenerals: readonly WarGeneralSnapshot[];
}>;

export type OwnBattleResult = "win" | "draw" | "lose" | "unknown";

type RawRecord = Record<string, unknown>;

const record = (value: unknown): RawRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as RawRecord
    : {};

const records = (value: unknown): readonly RawRecord[] =>
  Array.isArray(value)
    ? value.filter((item): item is RawRecord =>
        item !== null && typeof item === "object" && !Array.isArray(item))
    : [];

const numberValue = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const numberList = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.map(numberValue)
    : [];

const booleanValue = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return numberValue(value) !== 0;
};

const safeJson = (value: unknown, fallback: unknown): unknown => {
  if (typeof value !== "string") return value ?? fallback;
  if (!value.trim()) return fallback;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return fallback;
  }
};

const armyObject = (value: unknown): Readonly<Record<string, unknown>> =>
  record(safeJson(value, {}));

export const parseWarGenerals = (value: unknown): readonly WarGeneralSnapshot[] => {
  const parsed = safeJson(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item): WarGeneralSnapshot[] => {
    if (!Array.isArray(item)) return [];
    return [{
      id: numberValue(item[0]),
      cfgId: numberValue(item[1]),
      physicalPower: numberValue(item[2]),
      order: numberValue(item[3]),
      level: numberValue(item[4]),
      exp: numberValue(item[5]),
      cityId: numberValue(item[6]),
      curArms: numberValue(item[7]),
      hasPrPoint: numberValue(item[8]),
      attackDistance: numberValue(item[9]),
      forceAdded: numberValue(item[10]),
      strategyAdded: numberValue(item[11]),
      defenseAdded: numberValue(item[12]),
      speedAdded: numberValue(item[13]),
      destroyAdded: numberValue(item[14]),
      starLv: numberValue(item[15]),
      star: numberValue(item[16]),
    }];
  });
};

const parseSkill = (value: unknown): WarReportSkill => {
  const raw = record(value);
  return {
    fromId: numberValue(raw.f_id),
    toId: numberList(raw.t_id),
    cfgId: numberValue(raw.c_id),
    level: numberValue(raw.lv),
    includeEffect: numberList(raw.i_e),
    effectValue: numberList(raw.e_v),
    effectRound: numberList(raw.e_r),
    kill: numberList(raw.kill),
  };
};

export const parseWarRounds = (
  value: unknown,
  attackGenerals: readonly WarGeneralSnapshot[],
  defenseGenerals: readonly WarGeneralSnapshot[],
): readonly WarReportRound[] => {
  const source = safeJson(value, []);
  if (!Array.isArray(source)) return [];
  const all = [...attackGenerals, ...defenseGenerals];
  const byId = (id: number): WarGeneralSnapshot | null =>
    all.find((general) => general.id === id) ?? null;
  const attackIds = new Set(attackGenerals.map((general) => general.id));
  const result: WarReportRound[] = [];

  source.forEach((roundValue, roundIndex) => {
    const turns = record(roundValue).b;
    if (!Array.isArray(turns)) return;
    turns.forEach((turnValue, turnIndex) => {
      const turn = record(turnValue);
      const attackId = numberValue(turn.a_id);
      result.push({
        id: result.length + 1,
        isAttack: attackIds.has(attackId),
        attack: byId(attackId),
        defense: byId(numberValue(turn.d_id)),
        defenseLoss: numberValue(turn.d_loss),
        round: roundIndex + 1,
        turn: turnIndex + 1,
        attackBefore: records(turn.a_bs).map(parseSkill),
        attackAfter: records(turn.a_as).map(parseSkill),
        defenseAfter: records(turn.d_as).map(parseSkill),
      });
    });
  });
  return result;
};

export const getOwnBattleResult = (
  report: WarReport,
  roleId: number,
): OwnBattleResult => {
  if (report.result === 1) return "draw";
  if (roleId === report.attackRid) {
    if (report.result === 2) return "win";
    if (report.result === 0) return "lose";
  }
  if (roleId === report.defenseRid) {
    if (report.result === 0) return "win";
    if (report.result === 2) return "lose";
  }
  return "unknown";
};

export class WarReportProxy {
  private readonly reports = new Map<number, WarReport>();
  private roleId = 0;

  setRoleId(roleId: number): void {
    this.roleId = Number.isFinite(roleId) ? roleId : 0;
  }

  clearData(): void {
    this.reports.clear();
  }

  updateReports(value: unknown): readonly WarReport[] {
    const root = record(value);
    const list = Array.isArray(root.list) ? root.list : value;
    if (!Array.isArray(list)) return [];
    const updated: WarReport[] = [];
    for (const item of list) {
      const report = this.createReport(item);
      if (!report) continue;
      this.reports.set(report.id, report);
      updated.push(report);
    }
    return updated;
  }

  updateReport(value: unknown): WarReport | null {
    const report = this.createReport(value);
    if (!report) return null;
    this.reports.set(report.id, report);
    return report;
  }

  markRead(id: number, read = true): void {
    if (id === 0) {
      for (const report of this.reports.values()) {
        this.reports.set(report.id, this.withReadState(report, read));
      }
      return;
    }
    const report = this.reports.get(id);
    if (report) this.reports.set(id, this.withReadState(report, read));
  }

  isRead(reportOrId: WarReport | number): boolean {
    const report = typeof reportOrId === "number"
      ? this.reports.get(reportOrId)
      : reportOrId;
    if (!report) return false;
    if (this.roleId === report.attackRid) return report.attackIsRead;
    if (this.roleId === report.defenseRid) return report.defenseIsRead;
    return false;
  }

  getReports(): readonly WarReport[] {
    return [...this.reports.values()].sort((a, b) => b.id - a.id);
  }

  getReport(id: number): WarReport | null {
    return this.reports.get(id) ?? null;
  }

  unreadCount(): number {
    return this.getReports().filter((report) => !this.isRead(report)).length;
  }

  private withReadState(report: WarReport, read: boolean): WarReport {
    if (this.roleId === report.attackRid) return { ...report, attackIsRead: read };
    if (this.roleId === report.defenseRid) return { ...report, defenseIsRead: read };
    return report;
  }

  private createReport(value: unknown): WarReport | null {
    const raw = record(value);
    const id = numberValue(raw.id);
    if (!id) return null;
    const beginAttackGenerals = parseWarGenerals(raw.b_a_general);
    const beginDefenseGenerals = parseWarGenerals(raw.b_d_general);
    return {
      id,
      attackRid: numberValue(raw.a_rid),
      defenseRid: numberValue(raw.d_rid),
      beginAttackArmy: armyObject(raw.b_a_army),
      beginDefenseArmy: armyObject(raw.b_d_army),
      endAttackArmy: armyObject(raw.e_a_army),
      endDefenseArmy: armyObject(raw.e_d_army),
      result: numberValue(raw.result),
      rounds: parseWarRounds(raw.rounds, beginAttackGenerals, beginDefenseGenerals),
      attackIsRead: booleanValue(raw.a_is_read),
      defenseIsRead: booleanValue(raw.d_is_read),
      destroyDurable: numberValue(raw.destroy),
      occupy: numberValue(raw.occupy),
      x: numberValue(raw.x),
      y: numberValue(raw.y),
      createTime: numberValue(raw.ctime),
      beginAttackGenerals,
      beginDefenseGenerals,
      endAttackGenerals: parseWarGenerals(raw.e_a_general),
      endDefenseGenerals: parseWarGenerals(raw.e_d_general),
    };
  }
}
