"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth, useSettings } from "@/components/providers";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/components/button-styles";
import { useFarm } from "@/lib/farm-store";
import { resolveCommodityName, useCommodityCatalog } from "@/lib/commodity-store";
import { useMarketPrices } from "@/components/market-prices";
import { cropCostTotals, priceCrop } from "@/lib/farm";
import { SAFE_MARGIN_RATIO, type PriceStatus } from "@/lib/pricing";
import { formatMoney, IDR_PER_MYR } from "@/lib/currency";
import { LOCALE_TAGS, interpolate } from "@/i18n";
import { marketSourceLabel } from "@/lib/market-display";
import {
  resolveMarkets,
  type MarketCountry,
  type ResolvedMarket,
} from "@/lib/market-context";

const STATUS_RANK: Record<PriceStatus, number> = {
  rugi: 0,
  tipis: 1,
  aman: 2,
};

type MarketEntry = {
  country: MarketCountry;
  market: ResolvedMarket;
  status: PriceStatus;
  recommendedPriceMyr: number;
  minimumPriceMyr: number;
  costPerUnitMyr: number;
};

export function RecommendationClient({ cropId }: { cropId: string }) {
  const { t, locale, currency } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const crop = user ? farm.getCrop(cropId) : undefined;
  const snapshot = useMarketPrices();
  const { custom } = useCommodityCatalog();

  if (!user) return null;

  if (!crop) {
    return (
      <EmptyState
        icon="farm"
        title={t.farm.notFoundTitle}
        description={t.farm.notFoundDescription}
      >
        <Link href="/farm" className={`${PRIMARY_BUTTON} mt-4`}>
          {t.farm.backToFarm}
        </Link>
      </EmptyState>
    );
  }

  const totals = cropCostTotals(crop.costs);
  const cropName = resolveCommodityName(
    crop.commodityId,
    custom,
    t.commodities as Record<string, string>,
  );

  if (
    totals.totalCostMyr <= 0 ||
    crop.yieldKg <= 0 ||
    crop.marginPercent === null
  ) {
    return (
      <div>
        <BackLink href={`/farm/crops/${cropId}`} label={t.calc.backToCrop} />
        <EmptyState
          icon="calculator"
          title={t.calc.resultTitle}
          description={t.farm.costsNotEntered}
        >
          <Link
            href={`/farm/crops/${cropId}/costs`}
            className={`${PRIMARY_BUTTON} mt-4`}
          >
            {t.farm.inputCosts}
          </Link>
        </EmptyState>
      </div>
    );
  }

  const localeTag = LOCALE_TAGS[locale];
  // Cost-based figures depend only on the farmer's costs, so they are shown
  // once. Break-even is the cost per kg; minimum adds the chosen margin.
  const base = priceCrop(crop, 0);
  const markets = resolveMarkets(crop.commodityId, snapshot, IDR_PER_MYR);

  const entries: MarketEntry[] = [];
  for (const country of ["MY", "ID"] as const) {
    const market = markets[country];
    if (!market) continue;
    const pricing = priceCrop(crop, market.priceMyr);
    entries.push({
      country,
      market,
      status: pricing.status,
      recommendedPriceMyr: pricing.recommendedPriceMyr,
      minimumPriceMyr: pricing.minimumPriceMyr,
      costPerUnitMyr: pricing.costPerUnitMyr,
    });
  }

  const best = entries.reduce<MarketEntry | null>((current, entry) => {
    if (!current) return entry;
    if (STATUS_RANK[entry.status] !== STATUS_RANK[current.status]) {
      return STATUS_RANK[entry.status] > STATUS_RANK[current.status]
        ? entry
        : current;
    }
    return entry.recommendedPriceMyr > current.recommendedPriceMyr
      ? entry
      : current;
  }, null);

  const marketName = (country: MarketCountry) =>
    country === "MY" ? t.radar.malaysiaTitle : t.radar.indonesiaTitle;

  const advice = best
    ? best.status === "aman"
      ? t.calc.adviceAman
      : best.status === "tipis"
        ? t.calc.adviceTipis
        : t.calc.adviceRugi
    : null;

  return (
    <div>
      <BackLink href={`/farm/crops/${cropId}`} label={t.calc.backToCrop} />

      <header className="pb-4 pt-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          {cropName}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t.calc.resultTitle}
        </h1>
      </header>

      {/* Cost basis — depends only on the farmer's costs, shown once. */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink-muted">
          {t.calc.costBasisTitle}
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">{t.calc.breakEven}</dt>
            <dd className="font-medium">
              {formatMoney(base.costPerUnitMyr, currency, localeTag)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">{t.calc.minimumPrice}</dt>
            <dd className="font-semibold">
              {formatMoney(base.minimumPriceMyr, currency, localeTag)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Per-market selling price options. */}
      <section className="mt-4 space-y-3">
        <h2 className="text-sm font-semibold">{t.calc.compareTitle}</h2>
        {entries.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-ink-muted">
            {interpolate(t.calc.marketUnavailable, {
              commodity: cropName,
              market: `${t.radar.malaysiaTitle} · ${t.radar.indonesiaTitle}`,
            })}
          </p>
        ) : (
          entries.map((entry) => (
            <MarketPriceCard
              key={entry.country}
              entry={entry}
              name={marketName(entry.country)}
              localeTag={localeTag}
            />
          ))
        )}
        {entries.length > 0 ? (
          <p className="text-[11px] leading-relaxed text-ink-muted">
            {t.calc.fixedRateNote}
          </p>
        ) : null}
      </section>

      {/* Per-crop "what to do" advice. General advice lives on the Home card. */}
      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">{t.calc.adviceTitle}</h2>
        {best ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {advice}
            </p>
            {entries.length > 1 ? (
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {interpolate(t.calc.adviceBetterMarket, {
                  market: marketName(best.country),
                })}
              </p>
            ) : null}
            {best.status === "rugi" ? (
              <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                {[t.calc.tipHold, t.calc.tipMarket, t.calc.tipCost].map(
                  (tip, index) => (
                    <li key={tip} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold text-ink-muted"
                      >
                        {index + 1}
                      </span>
                      <span className="text-ink-muted">{tip}</span>
                    </li>
                  ),
                )}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {t.calc.compareHint}
          </p>
        )}
      </section>

      <div className="mt-4 space-y-2">
        <Link href={`/ai-advice?crop=${crop.id}`} className={PRIMARY_BUTTON}>
          {t.calc.askAi}
        </Link>
        <Link
          href={`/farm/crops/${cropId}/calculate`}
          className={`${SECONDARY_BUTTON} text-sm`}
        >
          {t.calc.updateMargin}
        </Link>
      </div>
    </div>
  );
}

function MarketPriceCard({
  entry,
  name,
  localeTag,
}: {
  entry: MarketEntry;
  name: string;
  localeTag: string;
}) {
  const { t, currency } = useSettings();

  // Every figure is shown in the farmer's selected currency (converted from the
  // MYR base), so a Rupiah user sees Rupiah for both the Malaysia and Indonesia
  // markets. The market name and source still say which market each card is.
  const marketValue = formatMoney(entry.market.priceMyr, currency, localeTag);
  const minimumValue = formatMoney(
    entry.minimumPriceMyr,
    currency,
    localeTag,
  );
  const safeValue = formatMoney(
    entry.minimumPriceMyr * SAFE_MARGIN_RATIO,
    currency,
    localeTag,
  );
  const profitValue = formatMoney(
    entry.recommendedPriceMyr - entry.costPerUnitMyr,
    currency,
    localeTag,
  );
  const recommendedOnMarket = entry.status !== "rugi";

  const badge = (
    <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
      {t.calc.recommendedBadge}
    </span>
  );

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{name}</p>
        <StatusBadge status={entry.status} label={t.status[entry.status]} />
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <Row
          label={t.calc.marketPrice}
          value={marketValue}
          badge={recommendedOnMarket ? badge : undefined}
        />
        <Row
          label={t.calc.minimumPrice}
          value={minimumValue}
          badge={recommendedOnMarket ? undefined : badge}
        />
        <Row
          label={t.calc.safePrice}
          value={safeValue}
        />
        <Row
          label={t.calc.profitPerKg}
          value={profitValue}
        />
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
        {marketSourceLabel(entry.market, t, localeTag)}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 text-ink-muted">
        <span className="truncate">{label}</span>
        {badge}
      </span>
      <span className="shrink-0 font-medium">
        {value} <span className="text-[11px] font-normal text-ink-muted">/ kg</span>
      </span>
    </div>
  );
}
