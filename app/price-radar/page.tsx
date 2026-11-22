"use client";

import { useState } from "react";
import { PriceRadarCard } from "@/components/price-radar-card";
import { PageHeader } from "@/components/page-header";
import { useMarketPrices } from "@/components/market-prices";
import { useSettings } from "@/components/providers";
import { COMMODITIES } from "@/lib/commodities";
import {
  INDONESIA_COMMODITY_IDS,
  valueChangePercent,
} from "@/lib/market";
import { formatIdr, formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/format";
import { LOCALE_TAGS, interpolate } from "@/i18n";

type Country = "malaysia" | "indonesia";

const COUNTRIES: Country[] = ["malaysia", "indonesia"];

const ACCENT: Record<Country, { selected: string; dot: string }> = {
  malaysia: {
    selected: "bg-[var(--country-my)] text-white shadow-sm",
    dot: "bg-[var(--country-my)]",
  },
  indonesia: {
    selected: "bg-[var(--country-id)] text-white shadow-sm",
    dot: "bg-[var(--country-id)]",
  },
};

export default function PriceRadarPage() {
  const { t, locale, currency } = useSettings();
  const snapshot = useMarketPrices();
  const localeTag = LOCALE_TAGS[locale];
  const indonesia = snapshot.indonesia;
  const [country, setCountry] = useState<Country>("malaysia");

  const indonesiaRows = INDONESIA_COMMODITY_IDS.flatMap((commodityId) => {
    const quote = indonesia.quotes[commodityId];
    const trend = indonesia.trends[commodityId];
    if (!quote || !trend) return [];
    return [{ commodityId, quote, trend }];
  });

  const labelFor = (value: Country) =>
    value === "malaysia" ? t.radar.malaysiaTitle : t.radar.indonesiaTitle;

  return (
    <div>
      <PageHeader title={t.radar.title} description={t.radar.description} />

      <div
        role="group"
        aria-label={t.radar.countryLabel}
        className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1"
      >
        {COUNTRIES.map((value) => {
          const selected = country === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setCountry(value)}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
                selected
                  ? ACCENT[value].selected
                  : "text-ink-muted hover:bg-surface"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full ${
                  selected ? "bg-white/80" : ACCENT[value].dot
                }`}
              />
              {labelFor(value)}
            </button>
          );
        })}
      </div>

      <section
        aria-label={t.radar.malaysiaTitle}
        hidden={country !== "malaysia"}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-[var(--country-my)]"
            />
            {t.radar.malaysiaTitle}
          </span>
          {snapshot.liveCount > 0 ? (
            <span className="rounded-full bg-aman/10 px-3 py-1 text-xs font-semibold text-aman">
              {t.radar.liveBadge}
            </span>
          ) : (
            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-ink-muted">
              {t.radar.sampleBadge}
            </span>
          )}
        </div>
        <p className="mb-3 text-xs leading-relaxed text-ink-muted">
          {snapshot.liveCount > 0
            ? interpolate(t.radar.liveNote, {
                date: formatDate(snapshot.observedAt, localeTag),
              })
            : t.radar.sampleNote}
        </p>

        <div className="space-y-3">
          {COMMODITIES.map((commodity) => {
            const quote = snapshot.quotes[commodity.id];
            const trend = snapshot.trends[commodity.id];

            return (
              <PriceRadarCard
                key={commodity.id}
                title={t.commodities[commodity.id]}
                price={formatMoney(quote.priceMyr, currency, localeTag)}
                unit={t.common.perKg}
                observedLabel={interpolate(t.radar.updated, {
                  date: formatDate(quote.observedAt, localeTag),
                })}
                sourceLabel={
                  quote.source === "pricecatcher"
                    ? t.radar.liveBadge
                    : t.radar.sampleBadge
                }
                sourceLive={quote.source === "pricecatcher"}
                change={valueChangePercent(trend.values)}
                changeLabel={t.radar.change7d}
                values={trend.values}
                href={`/price-radar/${commodity.id}`}
              />
            );
          })}
        </div>
      </section>

      <section
        aria-label={t.radar.indonesiaTitle}
        hidden={country !== "indonesia"}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-[var(--country-id)]"
            />
            {t.radar.indonesiaTitle}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              indonesia.liveCount > 0
                ? "bg-aman/10 text-aman"
                : "bg-surface-muted text-ink-muted"
            }`}
          >
            {indonesia.liveCount > 0
              ? t.radar.liveBadge
              : t.radar.unavailableBadge}
          </span>
        </div>

        {indonesia.liveCount > 0 ? (
          <>
            <p className="mb-3 text-xs leading-relaxed text-ink-muted">
              {interpolate(t.radar.indonesiaNote, {
                date: formatDate(indonesia.observedAt, localeTag),
              })}
            </p>

            <div className="space-y-3">
              {indonesiaRows.map(({ commodityId, quote, trend }) => (
                <PriceRadarCard
                  key={commodityId}
                  title={t.commodities[commodityId]}
                  price={formatIdr(quote.priceIdr, localeTag)}
                  unit={t.common.perKg}
                  observedLabel={interpolate(t.radar.updated, {
                    date: formatDate(quote.observedAt, localeTag),
                  })}
                  sourceLabel={t.radar.producerPrice}
                  sourceLive
                  change={valueChangePercent(trend.values, 1)}
                  changeLabel={t.radar.change1d}
                  values={trend.values}
                />
              ))}
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
              {t.radar.indonesiaCoverage}
            </p>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-ink-muted">
            {t.radar.indonesiaUnavailable}
          </p>
        )}
      </section>

      <p className="mt-4 text-center text-[11px] text-ink-muted">
        {t.radar.refreshNote}
      </p>
    </div>
  );
}
