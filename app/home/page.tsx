"use client";

import Link from "next/link";
import { useAuth, useSettings } from "@/components/providers";
import { BrandMark } from "@/components/brand-mark";
import { GlyphIcon, type ActionIconName } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { useFarm } from "@/lib/farm-store";
import { getCommodity } from "@/lib/commodities";
import { useMarketQuote } from "@/components/market-prices";
import { latestCrop, latestPriceableCrop, priceCrop } from "@/lib/farm";
import { LOCALE_TAGS, interpolate } from "@/i18n";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/format";

const QUICK_ICONS: Record<"quickCalc" | "quickCost" | "quickMarket", ActionIconName> = {
  quickCalc: "calculator",
  quickCost: "plus",
  quickMarket: "chart",
};

export default function HomePage() {
  const { t, locale, currency } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const localeTag = LOCALE_TAGS[locale];
  const pricedCrop = latestPriceableCrop(farm.data.crops);
  const pricedQuote = useMarketQuote(pricedCrop?.commodityId ?? "padi");
  const pricedCommodity = pricedCrop
    ? getCommodity(pricedCrop.commodityId)
    : undefined;

  if (!user) return null;

  const pricing =
    pricedCrop && pricedCommodity
      ? priceCrop(pricedCrop, pricedQuote.priceMyr)
      : null;
  const recentCrop = latestCrop(farm.data.crops);

  const actions: {
    key: "quickCalc" | "quickCost" | "quickMarket";
    href: string;
  }[] = [
    {
      key: "quickCalc",
      href: pricedCrop
        ? `/farm/crops/${pricedCrop.id}/calculate`
        : "/farm/crops/new",
    },
    {
      key: "quickCost",
      href: recentCrop ? `/farm/crops/${recentCrop.id}/costs` : "/farm/crops/new",
    },
    { key: "quickMarket", href: "/price-radar" },
  ];

  const emptyHref = recentCrop
    ? `/farm/crops/${recentCrop.id}/costs`
    : "/farm/crops/new";
  const emptyLabel = recentCrop ? t.farm.inputCosts : t.farm.addCrop;

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

        {pricing && pricedCrop ? (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t.home.latestCrop}
            </p>
            <p className="text-base font-semibold">
              {t.commodities[pricedCrop.commodityId]}
            </p>
            <p className="mt-3 text-xs text-ink-muted">
              {t.home.recommendedLabel}
            </p>
            <p className="text-3xl font-semibold tracking-tight">
              {formatMoney(pricing.recommendedPriceMyr, currency, localeTag)}
            </p>
            <p className="text-xs text-ink-muted">{t.common.perKg}</p>
            <p className="mt-1 text-[11px] text-ink-muted">
              {pricedQuote.source === "pricecatcher"
                ? `${t.radar.liveBadge} · ${formatDate(
                    pricedQuote.observedAt,
                    localeTag,
                  )}`
                : t.radar.sampleBadge}
            </p>
            <Link
              href={`/farm/crops/${pricedCrop.id}/recommendation`}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
            >
              {t.home.viewRecommendation} ›
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {t.home.summaryEmpty}
            </p>
            <Link
              href={emptyHref}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
            >
              {emptyLabel} ›
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
          href={pricedCrop ? `/ai-advice?crop=${pricedCrop.id}` : "/ai-advice"}
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
