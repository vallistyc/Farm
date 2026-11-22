export type PriceStatus = "aman" | "tipis" | "rugi";

export type PricingInput = {
  directCostsMyr: number;
  labourCostsMyr: number;
  hiddenCostsMyr: number;
  yieldKg: number;
  lossPercent: number;
  marginPercent: number;
  marketPriceMyr: number;
};

export type PricingResult = {
  directCostsMyr: number;
  labourCostsMyr: number;
  hiddenCostsMyr: number;
  totalCostMyr: number;
  effectiveYieldKg: number;
  costPerUnitMyr: number;
  minimumPriceMyr: number;
  marginPercent: number;
  marketPriceMyr: number;
  status: PriceStatus;
  recommendedPriceMyr: number;
};

export const SAFE_MARGIN_RATIO = 1.1;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function totalCostMyr(input: {
  directCostsMyr: number;
  labourCostsMyr: number;
  hiddenCostsMyr: number;
}): number {
  return (
    nonNegative(input.directCostsMyr) +
    nonNegative(input.labourCostsMyr) +
    nonNegative(input.hiddenCostsMyr)
  );
}

export function effectiveYieldKg(yieldKg: number, lossPercent: number): number {
  const loss = clamp(lossPercent, 0, 100);
  return nonNegative(yieldKg) * (1 - loss / 100);
}

export function costPerUnitMyr(
  totalCost: number,
  yieldKg: number,
  lossPercent: number,
): number {
  const effective = effectiveYieldKg(yieldKg, lossPercent);
  if (effective <= 0) return 0;
  return nonNegative(totalCost) / effective;
}

export function minimumSellingPriceMyr(
  costPerUnit: number,
  marginPercent: number,
): number {
  const margin = nonNegative(marginPercent) / 100;
  return nonNegative(costPerUnit) * (1 + margin);
}

export function assessMarket(
  minimumPrice: number,
  marketPrice: number,
): PriceStatus {
  if (marketPrice >= minimumPrice * SAFE_MARGIN_RATIO) return "aman";
  if (marketPrice >= minimumPrice) return "tipis";
  return "rugi";
}

export function recommendedPriceMyr(
  status: PriceStatus,
  marketPrice: number,
  minimumPrice: number,
): number {
  return status === "rugi" ? minimumPrice : marketPrice;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const directCostsMyr = nonNegative(input.directCostsMyr);
  const labourCostsMyr = nonNegative(input.labourCostsMyr);
  const hiddenCostsMyr = nonNegative(input.hiddenCostsMyr);
  const totalCost = totalCostMyr({
    directCostsMyr,
    labourCostsMyr,
    hiddenCostsMyr,
  });
  const costPerUnit = costPerUnitMyr(
    totalCost,
    input.yieldKg,
    input.lossPercent,
  );
  const minimumPrice = minimumSellingPriceMyr(
    costPerUnit,
    input.marginPercent,
  );
  const marketPrice = nonNegative(input.marketPriceMyr);
  const status = assessMarket(minimumPrice, marketPrice);

  return {
    directCostsMyr,
    labourCostsMyr,
    hiddenCostsMyr,
    totalCostMyr: totalCost,
    effectiveYieldKg: effectiveYieldKg(input.yieldKg, input.lossPercent),
    costPerUnitMyr: costPerUnit,
    minimumPriceMyr: minimumPrice,
    marginPercent: nonNegative(input.marginPercent),
    marketPriceMyr: marketPrice,
    status,
    recommendedPriceMyr: recommendedPriceMyr(status, marketPrice, minimumPrice),
  };
}
