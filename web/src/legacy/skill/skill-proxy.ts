export type SkillLevelConfig = Readonly<{
  probability: number;
  effectValue: readonly number[];
  effectRound: readonly number[];
}>;

export type SkillConfig = Readonly<{
  cfgId: number;
  name: string;
  trigger: number;
  target: number;
  description: string;
  limit: number;
  arms: readonly number[];
  includeEffect: readonly number[];
  levels: readonly SkillLevelConfig[];
}>;

export type SkillData = Readonly<{
  id: number;
  cfgId: number;
  generals: readonly number[];
}>;

export type SkillOutlineItem = Readonly<{
  type: number;
  description: string;
}>;

export type SkillOutline = Readonly<{
  triggers: readonly SkillOutlineItem[];
  targets: readonly SkillOutlineItem[];
}>;

type RawRecord = Record<string, unknown>;

const record = (value: unknown): RawRecord =>
  value !== null && typeof value === "object" ? value as RawRecord : {};

const records = (value: unknown): readonly RawRecord[] =>
  Array.isArray(value)
    ? value.filter((item): item is RawRecord => item !== null && typeof item === "object")
    : [];

const numberValue = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const numberList = (value: unknown): number[] =>
  Array.isArray(value) ? value.map(numberValue) : [];

const text = (value: unknown): string => typeof value === "string" ? value : "";

const outlineList = (value: unknown): SkillOutlineItem[] => {
  const wrapper = record(value);
  return records(wrapper.list).map((item) => ({
    type: numberValue(item.type),
    description: text(item.des),
  }));
};

export const getSkillArmLabel = (arms: readonly number[]): string => {
  const labels: string[] = [];
  if (arms.some((arm) => [1, 4, 7].includes(arm))) labels.push("Bộ");
  if (arms.some((arm) => [2, 5, 8].includes(arm))) labels.push("Cung");
  if (arms.some((arm) => [3, 6, 9].includes(arm))) labels.push("Kỵ");
  return labels.join("");
};

export const renderSkillDescription = (
  config: SkillConfig,
  levelIndex: number,
): string => {
  const level = config.levels[Math.max(0, Math.min(levelIndex, config.levels.length - 1))];
  if (!level) return config.description;
  let description = config.description.replaceAll("`", "");
  for (const value of level.effectValue) {
    description = description.replace("%n%", String(value));
  }
  return description.replaceAll("%%", "%");
};

export class SkillProxy {
  private readonly configs = new Map<number, SkillConfig>();
  private readonly skills = new Map<number, SkillData>();
  private outline: SkillOutline = { triggers: [], targets: [] };

  clearData(): void {
    this.skills.clear();
  }

  initSkillConfig(outlineValue: unknown, configValues: readonly unknown[]): void {
    const outline = record(outlineValue);
    this.outline = {
      triggers: outlineList(outline.trigger_type),
      targets: outlineList(outline.target_type),
    };
    this.configs.clear();
    for (const value of configValues) {
      const raw = record(value);
      const cfgId = numberValue(raw.cfgId);
      if (!cfgId) continue;
      this.configs.set(cfgId, {
        cfgId,
        name: text(raw.name),
        trigger: numberValue(raw.trigger),
        target: numberValue(raw.target),
        description: text(raw.des),
        limit: numberValue(raw.limit),
        arms: numberList(raw.arms),
        includeEffect: numberList(raw.include_effect),
        levels: records(raw.levels).map((level) => ({
          probability: numberValue(level.probability),
          effectValue: numberList(level.effect_value),
          effectRound: numberList(level.effect_round),
        })),
      });
    }
  }

  updateSkills(value: unknown): readonly SkillData[] {
    const updated: SkillData[] = [];
    for (const raw of records(value)) {
      const cfgId = numberValue(raw.cfgId);
      if (!cfgId) continue;
      const skill = {
        id: numberValue(raw.id),
        cfgId,
        generals: numberList(raw.generals),
      } satisfies SkillData;
      this.skills.set(cfgId, skill);
      updated.push(skill);
    }
    return updated;
  }

  getSkillCfg(cfgId: number): SkillConfig | null {
    return this.configs.get(cfgId) ?? null;
  }

  getSkill(cfgId: number): SkillData | null {
    return this.skills.get(cfgId) ?? null;
  }

  getSkillConfigs(): readonly SkillConfig[] {
    return [...this.configs.values()].sort((a, b) => a.cfgId - b.cfgId);
  }

  getSkills(): readonly SkillData[] {
    return [...this.skills.values()];
  }

  getOutline(): SkillOutline {
    return this.outline;
  }

  getTriggerLabel(trigger: number): string {
    return this.outline.triggers.find((item) => item.type === trigger)?.description ?? "";
  }

  getTargetLabel(target: number): string {
    return this.outline.targets.find((item) => item.type === target)?.description ?? "";
  }
}
