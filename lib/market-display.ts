import type { Dictionary } from "@/i18n";
import { formatDate } from "@/lib/format";
import type { MarketCountry, ResolvedMarket } from "@/lib/market-context";

export function marketCountryName(
  country: MarketCountry,
  t: Dictionary,
): string {
  return country === "MY" ? t.radar.malaysiaTitle : t.radar.indonesiaTitle;
}

export function marketSourceName(
  market: ResolvedMarket,
  t: Dictionary,
): string {
  if (market.source === "bapanas") return t.radar.producerPrice;
  if (market.source === "pricecatcher") return t.radar.liveBadge;
  return t.radar.sampleBadge;
}

/** "Malaysia · Official data · 22 Nov 2026" for market attribution lines. */
export function marketSourceLabel(
  market: ResolvedMarket,
  t: Dictionary,
  localeTag: string,
): string {
  return [
    marketCountryName(market.country, t),
    marketSourceName(market, t),
    formatDate(market.observedAt, localeTag),
  ].join(" · ");
}
