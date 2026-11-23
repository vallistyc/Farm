import type { CommodityId } from "@/lib/commodities";
import {
  calculatePricing,
  type PricingResult,
} from "@/lib/pricing";

export const HIDDEN_COST_KEYS = [
  "transport",
  "packaging",
  "postHarvestLoss",
  "commission",
  "storage",
  "irrigation",
  "equipment",
  "loanInterest",
  "certification",
  "marketFee",
  "familyLabour",
] as const;

export type HiddenCostKey = (typeof HIDDEN_COST_KEYS)[number];

export type CostLine = {
  id: string;
  label: string;
  amountMyr: number;
};

export type CropCosts = {
  direct: CostLine[];
  labour: CostLine[];
  hidden: Partial<Record<HiddenCostKey, number>>;
};

export type Field = {
  id: string;
  name: string;
  sizeHa: number;
  location: string;
};

export type Crop = {
  id: string;
  fieldId: string;
  commodityId: CommodityId;
  plantingDate: string;
  harvestDate: string;
  yieldKg: number;
  lossPercent: number;
  /** null until the farmer explicitly enters it in the cost wizard. */
  marginPercent: number | null;
  costs: CropCosts;
  updatedAt: string;
};

export type FarmData = {
  fields: Field[];
  crops: Crop[];
};

export type CropCostInput = {
  direct: CostLine[];
  labour: CostLine[];
  hidden: Partial<Record<HiddenCostKey, number>>;
  yieldKg: number;
  lossPercent: number;
  marginPercent: number;
};

export function emptyCosts(): CropCosts {
  return { direct: [], labour: [], hidden: {} };
}

export function costLinesTotal(lines: CostLine[]): number {
  return lines.reduce(
    (sum, line) => sum + (Number.isFinite(line.amountMyr) ? line.amountMyr : 0),
    0,
  );
}

export function hiddenCostsTotal(
  hidden: Partial<Record<HiddenCostKey, number>>,
): number {
  return HIDDEN_COST_KEYS.reduce((sum, key) => {
    const value = hidden[key];
    return sum + (Number.isFinite(value) ? (value as number) : 0);
  }, 0);
}

export function cropCostTotals(costs: CropCosts): {
  directCostsMyr: number;
  labourCostsMyr: number;
  hiddenCostsMyr: number;
  totalCostMyr: number;
} {
  const directCostsMyr = costLinesTotal(costs.direct);
  const labourCostsMyr = costLinesTotal(costs.labour);
  const hiddenCostsMyr = hiddenCostsTotal(costs.hidden);
  return {
    directCostsMyr,
    labourCostsMyr,
    hiddenCostsMyr,
    totalCostMyr: directCostsMyr + labourCostsMyr + hiddenCostsMyr,
  };
}

export function priceCrop(crop: Crop, marketPriceMyr: number): PricingResult {
  const totals = cropCostTotals(crop.costs);
  return calculatePricing({
    ...totals,
    yieldKg: crop.yieldKg,
    lossPercent: crop.lossPercent,
    marginPercent: crop.marginPercent ?? 0,
    marketPriceMyr,
  });
}

export function hasCosts(crop: Crop): boolean {
  return cropCostTotals(crop.costs).totalCostMyr > 0;
}

export function isPriceable(crop: Crop): boolean {
  return crop.yieldKg > 0 && hasCosts(crop);
}

export function latestCrop(crops: Crop[]): Crop | undefined {
  return [...crops].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

export function latestPriceableCrop(
  crops: Crop[],
  commodityId?: CommodityId,
): Crop | undefined {
  return crops
    .filter(
      (crop) =>
        isPriceable(crop) &&
        (commodityId === undefined || crop.commodityId === commodityId),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}
