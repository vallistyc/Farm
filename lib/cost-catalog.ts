import type { CommodityId } from "@/lib/commodities";

export const DIRECT_COST_KEYS = [
  "seeds",
  "fertiliser",
  "compost",
  "pesticide",
  "mulch",
  "stakes",
  "lime",
] as const;

export const LABOUR_COST_KEYS = [
  "landPrep",
  "planting",
  "fertilising",
  "weeding",
  "spraying",
  "harvest",
] as const;

export type DirectCostKey = (typeof DIRECT_COST_KEYS)[number];
export type LabourCostKey = (typeof LABOUR_COST_KEYS)[number];

export const DIRECT_COST_SUGGESTIONS: Record<
  CommodityId,
  readonly DirectCostKey[]
> = {
  padi: ["seeds", "fertiliser", "pesticide", "lime"],
  maize: ["seeds", "fertiliser", "pesticide"],
  spinach: ["seeds", "compost", "fertiliser", "pesticide"],
  chilli: ["seeds", "fertiliser", "compost", "pesticide", "mulch", "stakes"],
  banana: ["seeds", "compost", "fertiliser", "pesticide", "stakes"],
};

export const LABOUR_COST_SUGGESTIONS: readonly LabourCostKey[] =
  LABOUR_COST_KEYS;
