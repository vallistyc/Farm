"use client";

import Link from "next/link";
import { useAuth, useSettings } from "@/components/providers";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/page-header";
import { PriceChart } from "@/components/price-chart";
import { StatusBadge } from "@/components/status-badge";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/components/button-styles";
import { useFarm } from "@/lib/farm-store";
import { getCommodity } from "@/lib/commodities";
import { useMarketPrices } from "@/components/market-prices";
import { valueChangePercent } from "@/lib/market";
import { latestPriceableCrop, priceCrop } from "@/lib/farm";
import { LOCALE_TAGS, interpolate } from "@/i18n";
import { formatMoney } from "@/lib/currency";
import { formatDate, formatPercentChange } from "@/lib/format";

export function PriceRadarDetailClient({
  commodityId,
}: {
  commodityId: string;
}) {
  const { t, locale, currency } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const commodity = getCommodity(commodityId);
  const snapshot = useMarketPrices();
  const activeId = commodity?.id ?? "padi";
  const quote = snapshot.quotes[activeId];
  const trend = snapshot.trends[activeId];
  const localeTag = LOCALE_TAGS[locale];

  if (!commodity) {
    return (
      <EmptyState
        icon="chart"
        title={t.radar.notFoundTitle}
        description={t.radar.notFoundDescription}
      >
        <Link href="/price-radar" className={`${PRIMARY_BUTTON} mt-4`}>
          {t.radar.backToRadar}
        </Link>
      </EmptyState>
    );
  }

  const marketPrice = quote.priceMyr;
  const change = valueChangePercent(trend.values);
  const trendColor =
    change > 0 ? "text-aman" : change < 0 ? "text-rugi" : "text-ink-muted";
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";

  const crop = latestPriceableCrop(farm.data.crops, commodity.id);
  const pricing = crop ? priceCrop(crop, marketPrice) : null;
  const msp = pricing?.minimumPriceMyr;

  return (
    <div>
      <BackLink href="/price-radar" label={t.radar.backToRadar} />

      <header className="pb-4 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.commodities[commodity.id]}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {interpolate(t.radar.updated, {
            date: formatDate(quote.observedAt, localeTag),
          })}
        </p>
        <p
          className={`mt-1 text-xs leading-relaxed ${
            quote.source === "pricecatcher" ? "text-aman" : "text-ink-muted"
          }`}
        >
          {quote.source === "pricecatcher"
            ? interpolate(t.radar.liveNote, {
                date: formatDate(quote.observedAt, localeTag),
              })
            : t.radar.seedNote}
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">{t.radar.marketNow}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {formatMoney(marketPrice, currency, localeTag)}
            </p>
            <p className="text-xs text-ink-muted">{t.common.perKg}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-ink-muted">{t.radar.change7d}</p>
            <p className={`mt-1 text-sm font-semibold ${trendColor}`}>
              <span aria-hidden="true">{arrow} </span>
              {formatPercentChange(change)}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">{t.radar.trendTitle}</h2>
        <div className="mt-3">
          <PriceChart
            values={trend.values}
            msp={msp}
            ariaLabel={`${t.radar.trendTitle} — ${t.commodities[commodity.id]}`}
          />
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">{t.radar.refreshNote}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0.5 w-4 rounded-full bg-brand"
            />
            {t.radar.legendPrice}
          </span>
          {msp !== undefined ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="w-4 border-t-2 border-dashed border-tipis"
              />
              {t.radar.legendMsp}
            </span>
          ) : null}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        {pricing && crop && msp !== undefined ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">{t.radar.yourMinimum}</h2>
              <StatusBadge
                status={pricing.status}
                label={t.status[pricing.status]}
              />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {formatMoney(msp, currency, localeTag)}
              <span className="ml-1 text-xs font-normal text-ink-muted">
                {t.common.perKg}
              </span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              {interpolate(t.radar.mspHint, {
                commodity: t.commodities[commodity.id],
              })}
            </p>
            <Link
              href={`/farm/crops/${crop.id}/recommendation`}
              className={`${SECONDARY_BUTTON} mt-4 text-sm`}
            >
              {t.home.viewRecommendation}
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-sm font-semibold">{t.radar.yourMinimum}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {t.radar.noMsp}
            </p>
            <Link
              href="/farm/crops/new"
              className={`${SECONDARY_BUTTON} mt-4 text-sm`}
            >
              {t.farm.addCrop}
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
