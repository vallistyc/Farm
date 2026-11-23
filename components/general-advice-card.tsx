"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useAuth, useSettings } from "@/components/providers";
import { useFarm } from "@/lib/farm-store";
import { useMarketPrices } from "@/components/market-prices";
import { cropCostTotals, latestCrop, priceCrop } from "@/lib/farm";
import { IDR_PER_MYR } from "@/lib/currency";
import { preferredMarket, resolveMarkets } from "@/lib/market-context";
import { interpolate } from "@/i18n";
import type {
  GeneralAdviceInput,
  GeneralAdviceOutput,
} from "@/lib/general-advice";
import {
  ADVICE_MAX_AGE_DAYS,
  ADVICE_REFRESH_MIN_INTERVAL_DAYS,
  daysSince,
  generateAdvice,
  hashAdviceInput,
  readCachedAdvice,
  writeCachedAdvice,
} from "@/lib/advice";

type Stage =
  | "noField"
  | "noCrop"
  | "noCosts"
  | "noYield"
  | "noMargin"
  | "calc";
type FallbackKey = "fallback_aman" | "fallback_tipis" | "fallback_rugi";

function fallbackText(
  t: ReturnType<typeof useSettings>["t"],
  status: GeneralAdviceInput["status"],
  crop: string,
): GeneralAdviceOutput {
  const key: FallbackKey =
    status === "aman"
      ? "fallback_aman"
      : status === "tipis"
        ? "fallback_tipis"
        : "fallback_rugi";
  return { summary: interpolate(t.advice[key], { crop }), tips: [] };
}

export function GeneralAdviceCard() {
  const { t, locale, currency, country } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const snapshot = useMarketPrices();

  const fields = farm.data.fields;
  const crops = farm.data.crops;
  const recentCrop = latestCrop(crops);
  const totals = recentCrop ? cropCostTotals(recentCrop.costs) : null;
  const markets = recentCrop
    ? resolveMarkets(recentCrop.commodityId, snapshot, IDR_PER_MYR)
    : null;
  const homeMarket =
    recentCrop && markets
      ? preferredMarket(country, recentCrop.commodityId, snapshot, IDR_PER_MYR)
      : null;
  const pricing =
    recentCrop &&
    totals &&
    totals.totalCostMyr > 0 &&
    recentCrop.yieldKg > 0 &&
    recentCrop.marginPercent !== null
      ? priceCrop(recentCrop, homeMarket?.priceMyr ?? 0)
      : null;

  const cropName = recentCrop ? t.commodities[recentCrop.commodityId] : "";

  let stage: Stage;
  if (fields.length === 0) stage = "noField";
  else if (!recentCrop) stage = "noCrop";
  else if (!totals || totals.totalCostMyr <= 0) stage = "noCosts";
  else if (recentCrop.yieldKg <= 0) stage = "noYield";
  else if (recentCrop.marginPercent === null) stage = "noMargin";
  else stage = "calc";

  const input = useMemo<GeneralAdviceInput | null>(() => {
    if (stage !== "calc" || !recentCrop || !totals || !pricing || !markets) {
      return null;
    }
    const total = totals.totalCostMyr || 1;
    const categories = [
      {
        label: "Direct materials",
        amountMyr: totals.directCostsMyr,
        sharePct: (totals.directCostsMyr / total) * 100,
      },
      {
        label: "Labour",
        amountMyr: totals.labourCostsMyr,
        sharePct: (totals.labourCostsMyr / total) * 100,
      },
      {
        label: "Hidden costs",
        amountMyr: totals.hiddenCostsMyr,
        sharePct: (totals.hiddenCostsMyr / total) * 100,
      },
    ].filter((category) => category.amountMyr > 0);

    const toMarket = (market: (typeof markets)["MY"]) =>
      market
        ? {
            priceMyr: market.priceMyr,
            nativePrice: market.nativePrice,
            nativeCurrency: market.nativeCurrency,
            observedAt: market.observedAt,
            source: market.source,
          }
        : null;

    return {
      commodityId: recentCrop.commodityId,
      language: locale,
      displayCurrency: currency,
      status: pricing.status,
      totalCostMyr: totals.totalCostMyr,
      costPerUnitMyr: pricing.costPerUnitMyr,
      minimumPriceMyr: pricing.minimumPriceMyr,
      yieldKg: recentCrop.yieldKg,
      lossPercent: recentCrop.lossPercent,
      marginPercent: recentCrop.marginPercent ?? 0,
      costCategories: categories,
      markets: { MY: toMarket(markets.MY), ID: toMarket(markets.ID) },
    };
  }, [stage, recentCrop, totals, pricing, markets, locale, currency]);

  const inputHash = input ? hashAdviceInput(input) : "";
  const cropId = recentCrop?.id ?? "";
  const userId = user?.id ?? "";

  // Latest values for the async effect without re-running it on every price
  // poll. Refs are synced inside an effect (never during render).
  const inputRef = useRef(input);
  const tRef = useRef(t);
  const cropNameRef = useRef(cropName);

  useEffect(() => {
    inputRef.current = input;
    tRef.current = t;
    cropNameRef.current = cropName;
  });

  const [result, setResult] = useState<GeneralAdviceOutput | null>(null);
  const [canRefresh, setCanRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (stage !== "calc" || !inputHash || !userId) return;

    let cancelled = false;

    void (async () => {
      const current = inputRef.current;
      if (!current) return;

      const cached = await readCachedAdvice(userId, cropId, locale);
      if (cancelled) return;

      if (cached) {
        setResult(cached.advice);
        const age = daysSince(cached.generated_at);
        setCanRefresh(
          cached.input_hash !== inputHash &&
            age >= ADVICE_REFRESH_MIN_INTERVAL_DAYS,
        );
        if (age >= ADVICE_MAX_AGE_DAYS) {
          try {
            const generated = await generateAdvice(current);
            if (cancelled) return;
            await writeCachedAdvice(
              userId,
              cropId,
              locale,
              inputHash,
              generated,
            );
            if (!cancelled) {
              setResult(generated);
              setCanRefresh(false);
            }
          } catch {
            // Keep the stale cached advice as the fallback.
          }
        }
        return;
      }

      try {
        const generated = await generateAdvice(current);
        if (cancelled) return;
        await writeCachedAdvice(userId, cropId, locale, inputHash, generated);
        if (!cancelled) {
          setResult(generated);
          setCanRefresh(false);
        }
      } catch {
        if (!cancelled) {
          setResult(fallbackText(tRef.current, current.status, cropNameRef.current));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-runs only when the meaningful inputs change, not on every price poll.
  }, [stage, inputHash, userId, cropId, locale]);

  async function handleRefresh() {
    const current = inputRef.current;
    if (!canRefresh || !current || !userId) return;
    setRefreshing(true);
    try {
      const generated = await generateAdvice(current);
      await writeCachedAdvice(userId, cropId, locale, inputHash, generated);
      setResult(generated);
      setCanRefresh(false);
    } catch {
      // keep the current advice
    } finally {
      setRefreshing(false);
    }
  }

  if (!user) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <Image
          src="/mascot.png"
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-full bg-surface-muted"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t.advice.title}
          </p>

          {stage === "noField" ? (
            <p className="mt-1 text-sm leading-relaxed">{t.advice.startField}</p>
          ) : null}

          {stage === "noCrop" ? (
            <p className="mt-1 text-sm leading-relaxed">{t.advice.startCrop}</p>
          ) : null}

          {stage === "noCosts" ? (
            <p className="mt-1 text-sm leading-relaxed">
              {interpolate(t.advice.recordCosts, { crop: cropName })}
            </p>
          ) : null}

          {stage === "noYield" ? (
            <p className="mt-1 text-sm leading-relaxed">
              {interpolate(t.advice.recordYield, { crop: cropName })}
            </p>
          ) : null}

          {stage === "noMargin" ? (
            <p className="mt-1 text-sm leading-relaxed">
              {interpolate(t.advice.setMargin, { crop: cropName })}
            </p>
          ) : null}

          {stage === "calc" ? (
            result ? (
              <div className="mt-1 space-y-2">
                <p className="text-sm leading-relaxed">{result.summary}</p>
                {result.tips.length > 0 ? (
                  <ul className="space-y-1 text-sm leading-relaxed text-ink-muted">
                    {result.tips.map((tip) => (
                      <li key={tip} className="flex gap-2">
                        <span aria-hidden="true" className="text-brand">
                          •
                        </span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={!canRefresh || refreshing}
                  className="mt-1 min-h-9 rounded-full border border-line px-3 text-xs font-semibold text-ink-muted transition-colors hover:border-brand/60 disabled:opacity-40"
                >
                  {refreshing ? t.advice.loading : t.advice.refresh}
                </button>
              </div>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {t.advice.loading}
              </p>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}
