"use client";

import Link from "next/link";
import { useAuth, useSettings } from "@/components/providers";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/page-header";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/components/button-styles";
import { useFarm } from "@/lib/farm-store";
import { getCommodity } from "@/lib/commodities";
import { useMarketQuote } from "@/components/market-prices";
import { cropCostTotals, priceCrop } from "@/lib/farm";
import { LOCALE_TAGS } from "@/i18n";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/format";
import type { PriceStatus } from "@/lib/pricing";

const HERO: Record<
  PriceStatus,
  { card: string; icon: string; symbol: string }
> = {
  aman: {
    card: "border-aman/40 bg-aman/10 text-aman",
    icon: "bg-aman/15",
    symbol: "✓",
  },
  tipis: {
    card: "border-tipis/40 bg-tipis/10 text-tipis",
    icon: "bg-tipis/15",
    symbol: "!",
  },
  rugi: {
    card: "border-rugi/40 bg-rugi/10 text-rugi",
    icon: "bg-rugi/15",
    symbol: "✕",
  },
};

export function RecommendationClient({ cropId }: { cropId: string }) {
  const { t, locale, currency } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const crop = user ? farm.getCrop(cropId) : undefined;
  const quote = useMarketQuote(crop?.commodityId ?? "padi");

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

  const commodity = getCommodity(crop.commodityId);
  const totals = cropCostTotals(crop.costs);
  const pricing = commodity
    ? priceCrop(crop, quote.priceMyr)
    : null;
  const localeTag = LOCALE_TAGS[locale];

  if (!pricing || totals.totalCostMyr <= 0 || crop.yieldKg <= 0) {
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

  const hero = HERO[pricing.status];
  const advice =
    pricing.status === "aman"
      ? t.calc.adviceAman
      : pricing.status === "tipis"
        ? t.calc.adviceTipis
        : t.calc.adviceRugi;

  return (
    <div>
      <BackLink href={`/farm/crops/${cropId}`} label={t.calc.backToCrop} />

      <header className="pb-4 pt-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          {t.commodities[crop.commodityId]}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t.calc.resultTitle}
        </h1>
      </header>

      <section className={`rounded-2xl border p-5 ${hero.card}`}>
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`flex size-8 items-center justify-center rounded-full text-base font-bold ${hero.icon}`}
          >
            {hero.symbol}
          </span>
          <p className="text-lg font-semibold">{t.status[pricing.status]}</p>
        </div>
        <p className="mt-4 text-sm font-semibold opacity-90">
          {t.calc.recommendedPrice}
        </p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          {formatMoney(pricing.recommendedPriceMyr, currency, localeTag)}
        </p>
        <p className="text-xs opacity-80">{t.common.perKg}</p>
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">
          {t.calc.comparisonTitle}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs text-ink-muted">{t.calc.marketPrice}</p>
            <p className="mt-1 text-lg font-semibold">
              {formatMoney(pricing.marketPriceMyr, currency, localeTag)}
            </p>
            <p className="text-[11px] text-ink-muted">{t.common.perKg}</p>
            <p className="mt-1 text-[11px] text-ink-muted">
              {quote.source === "pricecatcher"
                ? `${t.radar.liveBadge} · ${formatDate(
                    quote.observedAt,
                    localeTag,
                  )}`
                : t.radar.sampleBadge}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs text-ink-muted">{t.calc.minimumPrice}</p>
            <p className="mt-1 text-lg font-semibold">
              {formatMoney(pricing.minimumPriceMyr, currency, localeTag)}
            </p>
            <p className="text-[11px] text-ink-muted">{t.common.perKg}</p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">{t.calc.adviceTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{advice}</p>

        {pricing.status === "rugi" ? (
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
