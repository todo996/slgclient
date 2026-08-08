export type GeneralConfig = Readonly<{
  name: string;
  cfgId: number;
  force: number;
  strategy: number;
  defense: number;
  speed: number;
  destroy: number;
  cost: number;
  forceGrow: number;
  strategyGrow: number;
  defenseGrow: number;
  speedGrow: number;
  destroyGrow: number;
  physicalPowerLimit: number;
  costPhysicalPower: number;
  probability: number;
  star: number;
  arms: readonly number[];
  camp: number;
}>;

export type GeneralSkill = Readonly<{
  id: number;
  lv: number;
  cfgId: number;
}>;

export type GeneralData = Readonly<{
  id: number;
  cfgId: number;
  exp: number;
  level: number;
  physicalPower: number;
  order: number;
  starLv: number;
  parentId: number;
  state: number;
  hasPrPoint: number;
  usePrPoint: number;
  forceAdded: number;
  strategyAdded: number;
  defenseAdded: number;
  speedAdded: number;
  destroyAdded: number;
  skills: readonly GeneralSkill[];
  config: GeneralConfig;
}>;

export type GeneralLevelConfig = Readonly<{
  level: number;
  exp: number;
  soldiers: number;
}>;

export type GeneralCommonConfig = Readonly<{
  physicalPowerLimit: number;
  costPhysicalPower: number;
  recoveryPhysicalPower: number;
  reclamationTime: number;
  drawGeneralCost: number;
  prPoint: number;
  limit: number;
}>;

export type GeneralAttributeKey =
  | "force"
  | "strategy"
  | "defense"
  | "speed"
  | "destroy";

type RawRecord = Record<string, unknown>;

const record = (value: unknown): RawRecord =>
  value !== null && typeof value === "object"
    ? value as RawRecord
    : {};

const records = (value: unknown): readonly RawRecord[] =>
  Array.isArray(value)
    ? value.filter((item): item is RawRecord =>
        item !== null && typeof item === "object")
    : [];

const numberValue = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const GENERAL_ATTRIBUTE_LABELS: Readonly<Record<GeneralAttributeKey, string>> = {
  force: "Vũ lực",
  strategy: "Chiến lược",
  defense: "Phòng thủ",
  speed: "Tốc độ",
  destroy: "Công thành",
};

export const GENERAL_ATTRIBUTE_KEYS: readonly GeneralAttributeKey[] = [
  "force",
  "strategy",
  "defense",
  "speed",
  "destroy",
];

const configBase = (config: GeneralConfig, key: GeneralAttributeKey): number => ({
  force: config.force,
  strategy: config.strategy,
  defense: config.defense,
  speed: config.speed,
  destroy: config.destroy,
})[key];

const configGrow = (config: GeneralConfig, key: GeneralAttributeKey): number => ({
  force: config.forceGrow,
  strategy: config.strategyGrow,
  defense: config.defenseGrow,
  speed: config.speedGrow,
  destroy: config.destroyGrow,
})[key];

export const generalAddedValue = (data: GeneralData, key: GeneralAttributeKey): number => ({
  force: data.forceAdded,
  strategy: data.strategyAdded,
  defense: data.defenseAdded,
  speed: data.speedAdded,
  destroy: data.destroyAdded,
})[key];

export const getGeneralAttributeValue = (
  data: GeneralData,
  key: GeneralAttributeKey,
): number => (
  configBase(data.config, key)
  + generalAddedValue(data, key)
  + data.level * configGrow(data.config, key)
) / 100;

export const getGeneralAttributeText = (
  data: GeneralData,
  key: GeneralAttributeKey,
  addedOverride?: number,
): string => {
  const baseAndAdded = (
    configBase(data.config, key)
    + (addedOverride ?? generalAddedValue(data, key))
  ) / 100;
  const levelGrowth = data.level * configGrow(data.config, key) / 100;
  return `${baseAndAdded} + (${levelGrowth})`;
};

export class GeneralProxy {
  private readonly configs = new Map<number, GeneralConfig>();
  private readonly levels: GeneralLevelConfig[] = [];
  private readonly myGenerals = new Map<number, GeneralData>();
  private common: GeneralCommonConfig = {
    physicalPowerLimit: 100,
    costPhysicalPower: 1,
    recoveryPhysicalPower: 10,
    reclamationTime: 30,
    drawGeneralCost: 30,
    prPoint: 1000,
    limit: 500,
  };

  clearData(): void {
    this.myGenerals.clear();
  }

  initGeneralConfig(
    generalConfig: unknown,
    generalBasic: unknown,
    basicConfig: unknown,
  ): void {
    const generalRoot = record(generalConfig);
    const levelRoot = record(generalBasic);
    const basicRoot = record(basicConfig);
    const common = record(basicRoot.general);

    this.configs.clear();
    for (const raw of records(generalRoot.list)) {
      const cfgId = numberValue(raw.cfgId);
      if (!cfgId) continue;
      this.configs.set(cfgId, {
        name: stringValue(raw.name),
        cfgId,
        force: numberValue(raw.force),
        strategy: numberValue(raw.strategy),
        defense: numberValue(raw.defense),
        speed: numberValue(raw.speed),
        destroy: numberValue(raw.destroy),
        cost: numberValue(raw.cost),
        forceGrow: numberValue(raw.force_grow),
        strategyGrow: numberValue(raw.strategy_grow),
        defenseGrow: numberValue(raw.defense_grow),
        speedGrow: numberValue(raw.speed_grow),
        destroyGrow: numberValue(raw.destroy_grow),
        physicalPowerLimit: numberValue(common.physical_power_limit),
        costPhysicalPower: numberValue(common.cost_physical_power),
        probability: numberValue(raw.probability),
        star: numberValue(raw.star),
        arms: Array.isArray(raw.arms) ? raw.arms.map(numberValue) : [],
        camp: numberValue(raw.camp),
      });
    }

    this.levels.length = 0;
    for (const raw of records(levelRoot.levels)) {
      const level = numberValue(raw.level);
      if (level <= 0) continue;
      this.levels[level - 1] = {
        level,
        exp: numberValue(raw.exp),
        soldiers: numberValue(raw.soldiers),
      };
    }

    this.common = {
      physicalPowerLimit: numberValue(common.physical_power_limit),
      costPhysicalPower: numberValue(common.cost_physical_power),
      recoveryPhysicalPower: numberValue(common.recovery_physical_power),
      reclamationTime: numberValue(common.reclamation_time),
      drawGeneralCost: numberValue(common.draw_general_cost),
      prPoint: numberValue(common.pr_point) || 1000,
      limit: numberValue(common.limit) || 500,
    };
  }

  updateMyGenerals(value: unknown): readonly GeneralData[] {
    const updated: GeneralData[] = [];
    for (const raw of records(value)) {
      const data = this.createFromServer(raw);
      if (!data) continue;
      this.myGenerals.set(data.id, data);
      updated.push(data);
    }
    return updated;
  }

  updateGeneral(value: unknown): GeneralData | null {
    const raw = record(value);
    const id = numberValue(raw.id);
    if (!id) return null;
    if (numberValue(raw.state) !== 0) {
      this.myGenerals.delete(id);
      return null;
    }
    const data = this.createFromServer(raw);
    if (data) this.myGenerals.set(id, data);
    return data;
  }

  removeMyGenerals(ids: readonly number[]): void {
    for (const id of ids) this.myGenerals.delete(id);
  }

  getGeneralCfg(cfgId: number): GeneralConfig | null {
    return this.configs.get(cfgId) ?? null;
  }

  getGeneralAllCfg(): readonly GeneralConfig[] {
    return [...this.configs.values()];
  }

  getGeneralLevelCfg(level: number): GeneralLevelConfig | null {
    return this.levels[level - 1] ?? null;
  }

  getMaxLevel(): number {
    return this.levels.length;
  }

  getCommonCfg(): GeneralCommonConfig {
    return this.common;
  }

  getMyGeneral(id: number): GeneralData | null {
    return this.myGenerals.get(id) ?? null;
  }

  getMyGenerals(): readonly GeneralData[] {
    return [...this.myGenerals.values()];
  }

  getUseGenerals(): readonly GeneralData[] {
    const sorted = [...this.myGenerals.values()].sort((a, b) => {
      if (a.config.star !== b.config.star) return b.config.star - a.config.star;
      return a.cfgId - b.cfgId;
    });
    const used = sorted.filter((item) => item.order > 0);
    const remaining = sorted.filter((item) => item.order <= 0 && item.parentId <= 0);
    return [...used, ...remaining];
  }

  getMyGeneralsNotUse(): readonly GeneralData[] {
    return [...this.myGenerals.values()]
      .filter((item) => item.order === 0 && item.state === 0 && item.parentId <= 0)
      .sort((a, b) => {
        if (a.config.star !== b.config.star) return b.config.star - a.config.star;
        return a.cfgId - b.cfgId;
      });
  }

  getComposeGenerals(cfgId: number, excludeId: number): readonly GeneralData[] {
    return [...this.myGenerals.values()].filter((item) =>
      item.order <= 0
      && item.id !== excludeId
      && item.cfgId === cfgId
      && item.parentId <= 0
      && item.state === 0);
  }

  getGeneralIds(cfgId: number): readonly number[] {
    return [...this.myGenerals.values()]
      .filter((item) => item.cfgId === cfgId)
      .map((item) => item.id);
  }

  getMyActiveGeneralCount(): number {
    return [...this.myGenerals.values()].filter((item) => item.state === 0).length;
  }

  private createFromServer(raw: RawRecord): GeneralData | null {
    const id = numberValue(raw.id);
    const cfgId = numberValue(raw.cfgId);
    const config = this.configs.get(cfgId);
    if (!id || !config) return null;

    return {
      id,
      cfgId,
      exp: numberValue(raw.exp),
      level: numberValue(raw.level),
      physicalPower: numberValue(raw.physical_power),
      order: numberValue(raw.order),
      starLv: numberValue(raw.star_lv),
      parentId: numberValue(raw.parentId),
      state: numberValue(raw.state),
      hasPrPoint: numberValue(raw.hasPrPoint),
      usePrPoint: numberValue(raw.usePrPoint),
      forceAdded: numberValue(raw.force_added),
      strategyAdded: numberValue(raw.strategy_added),
      defenseAdded: numberValue(raw.defense_added),
      speedAdded: numberValue(raw.speed_added),
      destroyAdded: numberValue(raw.destroy_added),
      skills: records(raw.skills).map((skill) => ({
        id: numberValue(skill.id),
        lv: numberValue(skill.lv),
        cfgId: numberValue(skill.cfgId),
      })),
      config,
    };
  }
}

export const getGeneralCampLabel = (camp: number): string => ({
  1: "Hán",
  2: "Quần Hùng",
  3: "Ngụy",
  4: "Thục",
  5: "Ngô",
}[camp] ?? "");

export const getGeneralArmLabel = (arms: readonly number[]): string => {
  const labels: string[] = [];
  if (arms.some((arm) => [1, 4, 7].includes(arm))) labels.push("Bộ");
  if (arms.some((arm) => [2, 5, 8].includes(arm))) labels.push("Cung");
  if (arms.some((arm) => [3, 6, 9].includes(arm))) labels.push("Kỵ");
  return labels.join("");
};
