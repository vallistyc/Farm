import type { BuiltInCommodityId, CommodityId } from "@/lib/commodities";

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
  BuiltInCommodityId,
  readonly DirectCostKey[]
> = {
  padi: ["seeds", "fertiliser", "pesticide", "lime"],
  maize: ["seeds", "fertiliser", "pesticide"],
  spinach: ["seeds", "compost", "fertiliser", "pesticide"],
  chilli: ["seeds", "fertiliser", "compost", "pesticide", "mulch", "stakes"],
  banana: ["seeds", "compost", "fertiliser", "pesticide", "stakes"],
};

const DEFAULT_DIRECT_COST_SUGGESTIONS: readonly DirectCostKey[] = [
  "seeds",
  "fertiliser",
  "pesticide",
];

export function directCostSuggestionsFor(
  commodityId: CommodityId,
): readonly DirectCostKey[] {
  return (
    DIRECT_COST_SUGGESTIONS[commodityId as BuiltInCommodityId] ??
    DEFAULT_DIRECT_COST_SUGGESTIONS
  );
}

export const LABOUR_COST_SUGGESTIONS: readonly LabourCostKey[] =
  LABOUR_COST_KEYS;
