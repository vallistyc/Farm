"use client";

import Link from "next/link";
import { useAuth, useSettings } from "@/components/providers";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/components/button-styles";
import { useFarm } from "@/lib/farm-store";
import { getCommodity } from "@/lib/commodities";
import { useMarketPrices } from "@/components/market-prices";
import { cropCostTotals, priceCrop } from "@/lib/farm";
import { LOCALE_TAGS, interpolate } from "@/i18n";
import { IDR_PER_MYR, formatMoney } from "@/lib/currency";
import { marketSourceLabel } from "@/lib/market-display";
import { preferredMarket } from "@/lib/market-context";
import { formatDate } from "@/lib/format";

export function CropDetailClient({ cropId }: { cropId: string }) {
  const { t, locale, currency, country } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const crop = user ? farm.getCrop(cropId) : undefined;
  const snapshot = useMarketPrices();

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

  const field = farm.getField(crop.fieldId);
  const commodity = getCommodity(crop.commodityId);
  const totals = cropCostTotals(crop.costs);
  const hasCosts = totals.totalCostMyr > 0;
  const market = commodity
    ? preferredMarket(country, crop.commodityId, snapshot, IDR_PER_MYR)
    : null;
  const pricing =
    commodity && hasCosts && market
      ? priceCrop(crop, market.priceMyr)
      : null;
  const localeTag = LOCALE_TAGS[locale];

  return (
    <div>
      <BackLink href="/farm" label={t.farm.backToFarm} />

      <header className="pb-4 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.commodities[crop.commodityId]}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {interpolate(t.farm.cropMeta, {
            field: field?.name ?? "—",
            date: formatDate(crop.harvestDate, localeTag),
          })}
        </p>
      </header>

      {pricing ? (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{t.calc.recommendedPrice}</p>
            <StatusBadge
              status={pricing.status}
              label={t.status[pricing.status]}
            />
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(pricing.recommendedPriceMyr, currency, localeTag)}
          </p>
          <p className="text-xs text-ink-muted">{t.common.perKg}</p>
          {market ? (
            <p className="mt-1 text-[11px] text-ink-muted">
              {marketSourceLabel(market, t, localeTag)}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-line bg-surface p-5">
          <p className="text-sm leading-relaxed text-ink-muted">
            {t.farm.costsNotEntered}
          </p>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">{t.farm.costSummary}</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">{t.farm.directCostsLabel}</dt>
            <dd className="font-medium">
              {formatMoney(totals.directCostsMyr, currency, localeTag)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">{t.farm.labourCostsLabel}</dt>
            <dd className="font-medium">
              {formatMoney(totals.labourCostsMyr, currency, localeTag)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">{t.farm.hiddenCostsLabel}</dt>
            <dd className="font-medium">
              {formatMoney(totals.hiddenCostsMyr, currency, localeTag)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line pt-2">
            <dt className="font-semibold">{t.farm.totalCost}</dt>
            <dd className="font-semibold">
              {formatMoney(totals.totalCostMyr, currency, localeTag)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-ink-muted">{t.farm.yieldShort}</p>
          <p className="mt-1 text-base font-semibold">
            {crop.yieldKg > 0 ? `${crop.yieldKg} ${t.units.kg}` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs text-ink-muted">{t.farm.lossShort}</p>
          <p className="mt-1 text-base font-semibold">{crop.lossPercent}%</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Link
          href={`/farm/crops/${crop.id}/costs`}
          className={PRIMARY_BUTTON}
        >
          {hasCosts ? t.farm.editCosts : t.farm.inputCosts}
        </Link>
        {pricing ? (
          <Link
            href={`/farm/crops/${crop.id}/recommendation`}
            className={SECONDARY_BUTTON}
          >
            {t.farm.nextStep}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
