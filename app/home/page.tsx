"use client";

import Link from "next/link";
import { useAuth, useSettings } from "@/components/providers";
import { BrandMark } from "@/components/brand-mark";
import { GeneralAdviceCard } from "@/components/general-advice-card";
import { GlyphIcon, type ActionIconName } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { SelectField } from "@/components/form-fields";
import { useFarm } from "@/lib/farm-store";
import { resolveCommodityName, useCommodityCatalog } from "@/lib/commodity-store";
import { useMarketPrices } from "@/components/market-prices";
import {
  hasCosts,
  isPriceable,
  isRecommendable,
  latestCrop,
  priceCrop,
  type Crop,
} from "@/lib/farm";
import { ALL_FIELDS, useViewSelection } from "@/lib/view-selection";
import { LOCALE_TAGS, interpolate } from "@/i18n";
import { IDR_PER_MYR, formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/format";
import { marketSourceLabel } from "@/lib/market-display";
import { preferredMarket } from "@/lib/market-context";

const QUICK_ICONS: Record<"quickCalc" | "quickCost" | "quickMarket", ActionIconName> = {
  quickCalc: "calculator",
  quickCost: "plus",
  quickMarket: "chart",
};

export default function HomePage() {
  const { t, locale, currency, country } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const localeTag = LOCALE_TAGS[locale];
  const snapshot = useMarketPrices();
  const { custom } = useCommodityCatalog();
  const { selection, selectField, selectCrop } = useViewSelection(user?.id);

  if (!user) return null;

  const { fields, crops } = farm.data;

  const cropLabel = (crop: Crop) =>
    resolveCommodityName(
      crop.commodityId,
      custom,
      t.commodities as Record<string, string>,
    );

  // A stored field can be deleted later; fall back to the whole farm.
  const fieldInScope = fields.some((field) => field.id === selection.fieldId);
  const scopedCrops =
    selection.fieldId === ALL_FIELDS || !fieldInScope
      ? crops
      : crops.filter((crop) => crop.fieldId === selection.fieldId);

  const selectedCrop =
    scopedCrops.find((crop) => crop.id === selection.cropId) ??
    latestCrop(scopedCrops.filter(isRecommendable)) ??
    latestCrop(scopedCrops);

  const selectedField = fields.find(
    (field) => field.id === selectedCrop?.fieldId,
  );
  const selectedMarket = selectedCrop
    ? preferredMarket(country, selectedCrop.commodityId, snapshot, IDR_PER_MYR)
    : null;
  const pricing =
    selectedCrop && selectedMarket && isRecommendable(selectedCrop)
      ? priceCrop(selectedCrop, selectedMarket.priceMyr)
      : null;

  const costsHref = selectedCrop
    ? `/farm/crops/${selectedCrop.id}/costs`
    : "/farm/crops/new";
  const recommendationHref = selectedCrop
    ? `/farm/crops/${selectedCrop.id}/recommendation`
    : "/farm";

  // What to show when the picked crop cannot produce a recommendation yet.
  const guidance = !selectedCrop
    ? null
    : !hasCosts(selectedCrop)
      ? {
          text: interpolate(t.advice.recordCosts, { crop: cropLabel(selectedCrop) }),
          label: t.farm.inputCosts,
          href: costsHref,
        }
      : !isPriceable(selectedCrop)
        ? {
            text: interpolate(t.advice.recordYield, { crop: cropLabel(selectedCrop) }),
            label: t.farm.editCosts,
            href: costsHref,
          }
        : selectedCrop.marginPercent === null
          ? {
              text: t.farm.marginNeeded,
              label: t.farm.editCosts,
              href: costsHref,
            }
          : {
              text: t.farm.marketNoData,
              label: t.home.viewRecommendation,
              href: recommendationHref,
            };

  const actions: {
    key: "quickCalc" | "quickCost" | "quickMarket";
    href: string;
  }[] = [
    {
      key: "quickCalc",
      href: selectedCrop
        ? `/farm/crops/${selectedCrop.id}/calculate`
        : "/farm/crops/new",
    },
    { key: "quickCost", href: costsHref },
    { key: "quickMarket", href: "/price-radar" },
  ];

  return (
    <div className="space-y-5 pb-14">
      <header className="flex items-center gap-3 pt-2">
        <BrandMark size={40} />
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">
            {interpolate(t.home.greeting, { name: user.name })}
          </h1>
          <p className="truncate text-xs text-ink-muted">{t.home.subtitle}</p>
        </div>
      </header>

      <GeneralAdviceCard />

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{t.home.summaryTitle}</h2>
          {pricing ? (
            <StatusBadge
              status={pricing.status}
              label={t.status[pricing.status]}
            />
          ) : null}
        </div>

        {crops.length > 0 ? (
          <div className="mt-4 space-y-3">
            <SelectField
              id="home-field-filter"
              label={t.farm.cropField}
              value={selection.fieldId === ALL_FIELDS ? "" : selection.fieldId}
              onChange={(value) => selectField(value || ALL_FIELDS)}
              placeholder={t.home.allFields}
            >
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="home-crop-filter"
              label={t.farm.cropCommodity}
              value={selectedCrop?.id ?? ""}
              onChange={(value) => selectCrop(value || null)}
              placeholder={t.home.newestCrop}
            >
              {scopedCrops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {cropLabel(crop)} ·{" "}
                  {formatDate(crop.harvestDate, localeTag)}
                </option>
              ))}
            </SelectField>
          </div>
        ) : null}

        {pricing && selectedCrop ? (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t.home.selectedCrop}
            </p>
            <p className="text-base font-semibold">{cropLabel(selectedCrop)}</p>
            {selectedField ? (
              <p className="text-xs text-ink-muted">{selectedField.name}</p>
            ) : null}
            <p className="mt-3 text-xs text-ink-muted">
              {t.home.recommendedLabel}
            </p>
            <p className="text-3xl font-semibold tracking-tight">
              {formatMoney(pricing.recommendedPriceMyr, currency, localeTag)}
            </p>
            <p className="text-xs text-ink-muted">{t.common.perKg}</p>
            <p className="mt-1 text-[11px] text-ink-muted">
              {selectedMarket
                ? marketSourceLabel(selectedMarket, t, localeTag)
                : t.radar.unavailableBadge}
            </p>
            <Link
              href={recommendationHref}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
            >
              {t.home.viewRecommendation} ›
            </Link>
          </>
        ) : guidance ? (
          <>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              {guidance.text}
            </p>
            <Link
              href={guidance.href}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
            >
              {guidance.label} ›
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {t.home.summaryEmpty}
            </p>
            <Link
              href="/farm/crops/new"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
            >
              {t.farm.addCrop} ›
            </Link>
          </>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">{t.home.quickTitle}</h2>
        <div className="space-y-2">
          {actions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 text-left transition-colors hover:bg-surface-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <GlyphIcon name={QUICK_ICONS[action.key]} className="size-5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {t.home[action.key]}
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 text-lg text-ink-muted"
              >
                ›
              </span>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-ink-muted">
        {t.home.demoNote}
      </p>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex w-full max-w-md justify-end px-4">
        <Link
          href={
            selectedCrop ? `/ai-advice?crop=${selectedCrop.id}` : "/ai-advice"
          }
          aria-label={t.home.askAi}
          className="pointer-events-auto inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-brand-ink shadow-lg shadow-black/15"
        >
          <GlyphIcon name="sparkle" className="size-5" />
          {t.home.askAi}
        </Link>
      </div>
    </div>
  );
}
