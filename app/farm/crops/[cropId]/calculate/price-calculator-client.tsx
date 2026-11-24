"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSettings } from "@/components/providers";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/page-header";
import { FormError, TextField } from "@/components/form-fields";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/components/button-styles";
import { useFarm } from "@/lib/farm-store";
import { resolveCommodityName, useCommodityCatalog } from "@/lib/commodity-store";
import { cropCostTotals, priceCrop } from "@/lib/farm";
import { LOCALE_TAGS } from "@/i18n";
import { formatMoney } from "@/lib/currency";
import { parseDecimal } from "@/lib/format";

export function PriceCalculatorClient({ cropId }: { cropId: string }) {
  const router = useRouter();
  const { t, locale, currency } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const crop = user ? farm.getCrop(cropId) : undefined;
  const { custom } = useCommodityCatalog();

  const [margin, setMargin] = useState(() =>
    String(crop?.marginPercent ?? 10),
  );
  const [error, setError] = useState<string | null>(null);

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
  const marginValue = parseDecimal(margin);
  const marginError =
    margin.trim() === "" || marginValue < 0 || marginValue > 100
      ? t.calc.errorMargin
      : null;
  const pricing = priceCrop(
    { ...crop, marginPercent: marginError ? 0 : marginValue },
    0,
  );
  const localeTag = LOCALE_TAGS[locale];

  function goToRecommendation() {
    if (marginError) {
      setError(marginError);
      return;
    }
    farm.updateMargin(cropId, marginValue);
    router.push(`/farm/crops/${cropId}/recommendation`);
  }

  return (
    <div>
      <BackLink href={`/farm/crops/${cropId}`} label={t.calc.backToCrop} />

      <header className="pb-4 pt-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          {resolveCommodityName(
            crop.commodityId,
            custom,
            t.commodities as Record<string, string>,
          )}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t.calc.title}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t.calc.description}</p>
      </header>

      {totals.totalCostMyr === 0 ? (
        <div className="mb-4 rounded-2xl border border-dashed border-line bg-surface p-4">
          <p className="text-sm text-ink-muted">{t.farm.costsNotEntered}</p>
          <Link
            href={`/farm/crops/${cropId}/costs`}
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
          >
            {t.farm.inputCosts} →
          </Link>
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <TextField
          id="margin"
          label={t.calc.marginLabel}
          value={margin}
          onChange={(value) => {
            setMargin(value);
            setError(null);
          }}
          inputMode="decimal"
          suffix="%"
          hint={t.calc.marginHint}
        />

        <dl className="space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">{t.calc.effectiveYield}</dt>
            <dd className="font-medium">
              {Math.round(pricing.effectiveYieldKg * 100) / 100} {t.units.kg}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">{t.calc.totalCost}</dt>
            <dd className="font-medium">
              {formatMoney(pricing.totalCostMyr, currency, localeTag)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">{t.calc.costPerUnit}</dt>
            <dd className="font-medium">
              {formatMoney(pricing.costPerUnitMyr, currency, localeTag)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-3 rounded-2xl border border-brand/30 bg-brand-soft p-5">
        <p className="text-sm font-semibold text-brand">
          {t.calc.minimumPrice}
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-brand">
          {formatMoney(pricing.minimumPriceMyr, currency, localeTag)}
        </p>
        <p className="text-xs text-brand/80">{t.common.perKg}</p>
      </section>

      <div className="mt-4 space-y-2">
        {error ? <FormError message={error} /> : null}
        <button
          type="button"
          onClick={goToRecommendation}
          className={PRIMARY_BUTTON}
        >
          {t.calc.recommend}
        </button>
        <Link
          href={`/farm/crops/${cropId}/costs`}
          className={`${SECONDARY_BUTTON} text-sm`}
        >
          {t.farm.editCosts}
        </Link>
      </div>
    </div>
  );
}
