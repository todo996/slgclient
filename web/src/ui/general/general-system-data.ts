import {
  GENERAL_ATTRIBUTE_KEYS,
  type GeneralAttributeKey,
  type GeneralConfig,
  type GeneralData,
} from "../../legacy/general/general-proxy.ts";

export const ATTRIBUTE_STEP = 100;
export const MAX_CONVERT_SELECTION = 9;

export type AttributeAllocation = Record<GeneralAttributeKey, number>;

export const createAttributeAllocation = (general: GeneralData): AttributeAllocation => ({
  force: general.forceAdded,
  strategy: general.strategyAdded,
  defense: general.defenseAdded,
  speed: general.speedAdded,
  destroy: general.destroyAdded,
});

export const getAvailableAttributePoints = (
  general: GeneralData,
  allocation: AttributeAllocation,
): number => {
  const allocated = GENERAL_ATTRIBUTE_KEYS.reduce(
    (sum, key) => sum + Math.max(0, allocation[key]),
    0,
  );
  return Math.max(0, general.hasPrPoint - allocated);
};

export const adjustAttributeAllocation = (
  general: GeneralData,
  allocation: AttributeAllocation,
  key: GeneralAttributeKey,
  direction: 1 | -1,
): AttributeAllocation => {
  const next = { ...allocation };
  if (direction > 0) {
    if (getAvailableAttributePoints(general, allocation) < ATTRIBUTE_STEP) return allocation;
    if (next[key] + ATTRIBUTE_STEP > general.hasPrPoint) return allocation;
    next[key] += ATTRIBUTE_STEP;
  } else if (next[key] >= ATTRIBUTE_STEP) {
    next[key] -= ATTRIBUTE_STEP;
  }
  return next;
};

export const sortGeneralRoster = (
  configs: readonly GeneralConfig[],
): readonly GeneralConfig[] => [...configs].sort((a, b) => {
  if (a.star !== b.star) return b.star - a.star;
  return a.cfgId - b.cfgId;
});

export const toggleLimitedSelection = (
  selected: ReadonlySet<number>,
  id: number,
  limit: number,
): ReadonlySet<number> => {
  const next = new Set(selected);
  if (next.has(id)) {
    next.delete(id);
    return next;
  }
  if (next.size >= limit) return selected;
  next.add(id);
  return next;
};

export const readRoleGold = (value: unknown): number => {
  if (!value || typeof value !== "object") return 0;
  const raw = value as Record<string, unknown>;
  const parsed = Number(raw.gold ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
