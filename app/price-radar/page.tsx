"use client";

import Link from "next/link";
import { useSettings } from "@/components/providers";
import { useMarketPrices } from "@/components/market-prices";
import { PageHeader } from "@/components/page-header";
import { Sparkline } from "@/components/price-chart";
import { COMMODITIES } from "@/lib/commodities";
import { valueChangePercent } from "@/lib/market";
import { LOCALE_TAGS, interpolate } from "@/i18n";
import { formatMoney } from "@/lib/currency";
import { formatDate, formatPercentChange } from "@/lib/format";

export default function PriceRadarPage() {
  const { t, locale, currency } = useSettings();
  const snapshot = useMarketPrices();
  const localeTag = LOCALE_TAGS[locale];

  return (
    <div>
      <PageHeader title={t.radar.title} description={t.radar.description} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {snapshot.liveCount > 0 ? (
          <>
            <span className="rounded-full bg-aman/10 px-3 py-1 text-xs font-semibold text-aman">
              {t.radar.liveBadge}
            </span>
            <p className="text-xs leading-relaxed text-ink-muted">
              {interpolate(t.radar.liveNote, {
                date: formatDate(snapshot.observedAt, localeTag),
              })}
            </p>
          </>
        ) : (
          <>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-ink-muted">
              {t.radar.sampleBadge}
            </span>
            <p className="text-xs leading-relaxed text-ink-muted">
              {t.radar.sampleNote}
            </p>
          </>
        )}
      </div>

      <div className="space-y-3">
        {COMMODITIES.map((commodity) => {
          const quote = snapshot.quotes[commodity.id];
          const trend = snapshot.trends[commodity.id];
          const price = quote.priceMyr;
          const change = valueChangePercent(trend.values);
          const trendColor =
            change > 0
              ? "text-aman"
              : change < 0
                ? "text-rugi"
                : "text-ink-muted";
          const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";

          return (
            <Link
              key={commodity.id}
              href={`/price-radar/${commodity.id}`}
              className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-muted"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    {t.commodities[commodity.id]}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {interpolate(t.radar.updated, {
                      date: formatDate(quote.observedAt, localeTag),
                    })}
                  </p>
                  <p
                    className={`mt-0.5 truncate text-[11px] ${
                      quote.source === "pricecatcher"
                        ? "text-aman"
                        : "text-ink-muted"
                    }`}
                  >
                    {quote.source === "pricecatcher"
                      ? t.radar.liveBadge
                      : t.radar.sampleBadge}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold tracking-tight">
                    {formatMoney(price, currency, localeTag)}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {t.common.perKg}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <Sparkline
                  values={trend.values}
                  className={`h-7 w-20 shrink-0 ${trendColor}`}
                />
                <p className={`text-xs font-semibold ${trendColor}`}>
                  <span aria-hidden="true">{arrow} </span>
                  {formatPercentChange(change)}
                  <span className="ml-1.5 font-normal text-ink-muted">
                    {t.radar.change7d}
                  </span>
                </p>
                <span
                  aria-hidden="true"
                  className="ml-auto text-lg text-ink-muted"
                >
                  ›
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[11px] text-ink-muted">
        {t.radar.refreshNote}
      </p>
    </div>
  );
}
