export type BuiltInCommodityId =
  | "padi"
  | "maize"
  | "spinach"
  | "chilli"
  | "banana";

/** Built-in ids keep autocomplete; custom ids are any other non-empty string. */
export type CommodityId = BuiltInCommodityId | (string & {});

export const BUILT_IN_COMMODITY_IDS: BuiltInCommodityId[] = [
  "padi",
  "maize",
  "spinach",
  "chilli",
  "banana",
];

export function isBuiltInCommodity(id: string): id is BuiltInCommodityId {
  return (BUILT_IN_COMMODITY_IDS as string[]).includes(id);
}

export type Commodity = {
  id: BuiltInCommodityId;
  unit: "kg";
  trendStart: string;
  trendMyr: number[];
};

import rawCommodities from "@/data/commodities.json";

export const COMMODITIES: Commodity[] = rawCommodities.map((item) => ({
  id: item.id as BuiltInCommodityId,
  unit: item.unit as Commodity["unit"],
  trendStart: item.trendStart,
  trendMyr: item.trendMyr,
}));

export function getCommodity(id: string): Commodity | undefined {
  return COMMODITIES.find((commodity) => commodity.id === id);
}

export function latestPrice(commodity: Commodity): number {
  return commodity.trendMyr.at(-1) ?? 0;
}

export function trendEndDate(commodity: Commodity): string {
  const date = new Date(`${commodity.trendStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + commodity.trendMyr.length - 1);
  return date.toISOString().slice(0, 10);
}

export function priceChangePercent(commodity: Commodity, days = 7): number {
  const trend = commodity.trendMyr;
  const current = trend.at(-1) ?? 0;
  const past = trend.at(-1 - days) ?? trend[0] ?? 0;
  if (!past) return 0;
  return ((current - past) / past) * 100;
}
