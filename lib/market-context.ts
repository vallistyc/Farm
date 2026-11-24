import type { CommodityId } from "@/lib/commodities";
import type { CurrencyCode } from "@/lib/currency";
import type {
  IndonesiaCommodityId,
  MarketCommodityId,
  MarketSnapshot,
  MarketSource,
} from "@/lib/market";

export type MarketCountry = "MY" | "ID";

export const MARKET_COUNTRIES: MarketCountry[] = ["MY", "ID"];

export const DEFAULT_COUNTRY: MarketCountry = "MY";

export function isMarketCountry(value: unknown): value is MarketCountry {
  return value === "MY" || value === "ID";
}

export function countryCurrency(country: MarketCountry): CurrencyCode {
  return country === "ID" ? "IDR" : "MYR";
}

export type ResolvedMarket = {
  country: MarketCountry;
  /** Price per kg converted to MYR, the base used by the pricing module. */
  priceMyr: number;
  /** Price exactly as published by the source. */
  nativePrice: number;
  nativeCurrency: CurrencyCode;
  source: MarketSource | "bapanas";
  observedAt: string;
  isLive: boolean;
};

export type MarketPair = {
  MY: ResolvedMarket | null;
  ID: ResolvedMarket | null;
};

export function resolveMarkets(
  commodityId: CommodityId,
  snapshot: MarketSnapshot,
  idrPerMyr: number,
): MarketPair {
  return {
    MY: resolveMarket("MY", commodityId, snapshot, idrPerMyr),
    ID: resolveMarket("ID", commodityId, snapshot, idrPerMyr),
  };
}

/**
 * The market the farmer picked, or the other one when that source does not
 * publish this commodity (Bapanas has no spinach or banana). Returns null only
 * when neither market has a price.
 */
export function preferredMarket(
  country: MarketCountry,
  commodityId: CommodityId,
  snapshot: MarketSnapshot,
  idrPerMyr: number,
): ResolvedMarket | null {
  const pair = resolveMarkets(commodityId, snapshot, idrPerMyr);
  return pair[country] ?? pair[country === "MY" ? "ID" : "MY"];
}

/**
 * Picks the official quote for a market and converts it to the MYR base.
 * `idrPerMyr` is passed in so this module stays dependency-free and testable.
 * Returns null when that market has no usable price for the commodity.
 */
export function resolveMarket(
  country: MarketCountry,
  commodityId: CommodityId,
  snapshot: MarketSnapshot,
  idrPerMyr: number,
): ResolvedMarket | null {
  if (country === "MY") {
    const quote = snapshot.quotes[commodityId as MarketCommodityId];
    if (!quote || !Number.isFinite(quote.priceMyr) || quote.priceMyr <= 0) {
      return null;
    }
    return {
      country,
      priceMyr: quote.priceMyr,
      nativePrice: quote.priceMyr,
      nativeCurrency: "MYR",
      source: quote.source,
      observedAt: quote.observedAt,
      isLive: quote.source === "pricecatcher",
    };
  }

  const quote =
    snapshot.indonesia.quotes[commodityId as IndonesiaCommodityId];
  if (!quote || !Number.isFinite(quote.priceIdr) || quote.priceIdr <= 0) {
    return null;
  }
  const rate = idrPerMyr > 0 ? idrPerMyr : 3650;
  return {
    country,
    priceMyr: quote.priceIdr / rate,
    nativePrice: quote.priceIdr,
    nativeCurrency: "IDR",
    source: "bapanas",
    observedAt: quote.observedAt,
    isLive: true,
  };
}
