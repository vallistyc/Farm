"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useSettings } from "@/components/providers";
import { EmptyState } from "@/components/page-header";
import { FormError, TextField } from "@/components/form-fields";
import { PRIMARY_BUTTON } from "@/components/button-styles";
import {
  CostLinesEditor,
  makeCostLine,
  type CostLineDraft,
} from "@/components/farm/cost-lines-editor";
import {
  DIRECT_COST_SUGGESTIONS,
  LABOUR_COST_SUGGESTIONS,
  type DirectCostKey,
  type LabourCostKey,
} from "@/lib/cost-catalog";
import { useFarm } from "@/lib/farm-store";
import { HIDDEN_COST_KEYS, type HiddenCostKey } from "@/lib/farm";
import { LOCALE_TAGS, interpolate } from "@/i18n";
import { formatAmount, fromMyr, toMyr } from "@/lib/currency";
import { parseAmount, parseDecimal } from "@/lib/format";

const TOTAL_STEPS = 4;

type HiddenDraft = Partial<Record<HiddenCostKey, string>>;

export function CropCostsClient({ cropId }: { cropId: string }) {
  const router = useRouter();
  const { t, locale, currency } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const crop = user ? farm.getCrop(cropId) : undefined;

  const [step, setStep] = useState(0);
  const [direct, setDirect] = useState<CostLineDraft[]>(() =>
    (crop?.costs.direct ?? []).map((line) => ({
      id: line.id,
      label: line.label,
      amount: String(fromMyr(line.amountMyr, currency)),
    })),
  );
  const [labour, setLabour] = useState<CostLineDraft[]>(() =>
    (crop?.costs.labour ?? []).map((line) => ({
      id: line.id,
      label: line.label,
      amount: String(fromMyr(line.amountMyr, currency)),
    })),
  );
  const [hidden, setHidden] = useState<HiddenDraft>(() => {
    const next: HiddenDraft = {};
    if (crop) {
      for (const key of HIDDEN_COST_KEYS) {
        const value = crop.costs.hidden[key];
        if (value !== undefined) next[key] = String(fromMyr(value, currency));
      }
    }
    return next;
  });
  const [yieldKg, setYieldKg] = useState(() =>
    crop && crop.yieldKg > 0 ? String(crop.yieldKg) : "",
  );
  const [loss, setLoss] = useState(() =>
    String(crop?.lossPercent ?? 10),
  );
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  if (!crop) {
    return (
      <div>
        <EmptyState
          icon="farm"
          title={t.farm.notFoundTitle}
          description={t.farm.notFoundDescription}
        >
          <Link href="/farm" className={`${PRIMARY_BUTTON} mt-4`}>
            {t.farm.backToFarm}
          </Link>
        </EmptyState>
      </div>
    );
  }

  const localeTag = LOCALE_TAGS[locale];
  const titles = [
    t.farm.wizard.directTitle,
    t.farm.wizard.labourTitle,
    t.farm.wizard.hiddenTitle,
    t.farm.wizard.yieldTitle,
  ];
  const hints = [
    t.farm.wizard.directHint,
    t.farm.wizard.labourHint,
    t.farm.wizard.hiddenHint,
    t.farm.wizard.yieldHint,
  ];

  const linesTotal = (lines: CostLineDraft[]) =>
    lines.reduce((sum, line) => sum + parseAmount(line.amount, currency), 0);
  const hiddenTotal = HIDDEN_COST_KEYS.reduce(
    (sum, key) => sum + parseAmount(hidden[key] ?? "", currency),
    0,
  );
  const totalSoFar =
    linesTotal(direct) + linesTotal(labour) + hiddenTotal;
  const hiddenSelected = HIDDEN_COST_KEYS.filter(
    (key) => key in hidden,
  ).length;

  function goBack() {
    if (step === 0) {
      router.push(`/farm/crops/${cropId}`);
      return;
    }
    setError(null);
    setStep((current) => current - 1);
  }

  function handleNext() {
    setError(null);
    if (step < TOTAL_STEPS - 1) {
      setStep((current) => current + 1);
      return;
    }

    const yieldValue = parseDecimal(yieldKg);
    const lossValue = parseDecimal(loss);
    if (yieldValue <= 0) {
      setError(t.farm.wizard.errorYield);
      return;
    }
    if (lossValue < 0 || lossValue > 100) {
      setError(t.farm.wizard.errorLoss);
      return;
    }

    const toLines = (lines: CostLineDraft[]) =>
      lines
        .filter(
          (line) =>
            line.label.trim() || parseAmount(line.amount, currency) > 0,
        )
        .map((line) => ({
          id: line.id,
          label: line.label.trim() || "—",
          amountMyr: toMyr(
            Math.max(0, parseAmount(line.amount, currency)),
            currency,
          ),
        }));

    const hiddenValues: Partial<Record<HiddenCostKey, number>> = {};
    for (const key of HIDDEN_COST_KEYS) {
      if (key in hidden) {
        hiddenValues[key] = toMyr(
          Math.max(0, parseAmount(hidden[key] ?? "", currency)),
          currency,
        );
      }
    }

    farm.saveCosts(cropId, {
      direct: toLines(direct),
      labour: toLines(labour),
      hidden: hiddenValues,
      yieldKg: yieldValue,
      lossPercent: lossValue,
    });
    router.push(`/farm/crops/${cropId}`);
  }

  function toggleHidden(key: HiddenCostKey) {
    setHidden((current) => {
      if (key in current) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: "" };
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={goBack}
        className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true">←</span>
        {t.common.back}
      </button>

      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        {interpolate(t.farm.wizard.stepOf, {
          step: step + 1,
          total: TOTAL_STEPS,
        })}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <h1 className="mt-5 text-xl font-semibold tracking-tight">
        {titles[step]}
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        {hints[step]}
      </p>

      <p className="mt-3 inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-muted">
        {interpolate(t.farm.wizard.totalSoFar, {
          amount: formatAmount(totalSoFar, currency, localeTag),
        })}
      </p>

      <div className="mt-5">
        {step === 0 ? (
          <>
            <CostSuggestions
              keys={DIRECT_COST_SUGGESTIONS[crop.commodityId]}
              lines={direct}
              onAdd={(label) =>
                setDirect((current) => [
                  ...current,
                  { ...makeCostLine(), label },
                ])
              }
            />
            <CostLinesEditor
              lines={direct}
              onChange={setDirect}
              labelPlaceholder={t.farm.wizard.lineLabelPlaceholder}
            />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <CostSuggestions
              keys={LABOUR_COST_SUGGESTIONS}
              lines={labour}
              onAdd={(label) =>
                setLabour((current) => [
                  ...current,
                  { ...makeCostLine(), label },
                ])
              }
            />
            <CostLinesEditor
              lines={labour}
              onChange={setLabour}
              labelPlaceholder={t.farm.wizard.lineLabelPlaceholder}
            />
          </>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-ink-muted">
              {interpolate(t.farm.wizard.selectedCount, {
                count: hiddenSelected,
              })}
            </p>
            {HIDDEN_COST_KEYS.map((key) => {
              const selected = key in hidden;
              return (
                <div
                  key={key}
                  className={`rounded-xl border bg-surface ${
                    selected ? "border-brand/40" : "border-line"
                  }`}
                >
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleHidden(key)}
                      className="size-5 shrink-0 accent-[var(--brand)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {t.farm.hiddenCosts[key]}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                        {t.farm.hiddenHints[key]}
                      </span>
                    </span>
                  </label>
                  {selected ? (
                    <div className="border-t border-line px-4 py-3">
                      <TextField
                        id={`hidden-${key}`}
                        label={t.farm.wizard.lineAmount}
                        value={hidden[key] ?? ""}
                        onChange={(value) =>
                          setHidden((current) => ({
                            ...current,
                            [key]: value,
                          }))
                        }
                        inputMode="decimal"
                        suffix={currency}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <TextField
              id="crop-yield"
              label={t.farm.wizard.yieldLabel}
              value={yieldKg}
              onChange={setYieldKg}
              inputMode="decimal"
              suffix={t.units.kg}
              hint={t.farm.wizard.yieldHint}
            />
            <TextField
              id="crop-loss"
              label={t.farm.wizard.lossLabel}
              value={loss}
              onChange={setLoss}
              inputMode="decimal"
              suffix="%"
              hint={t.farm.wizard.lossHint}
            />
            <p className="text-xs leading-relaxed text-ink-muted">
              {t.farm.wizard.savedNote}
            </p>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-6 border-t border-line bg-background/95 px-4 pb-2 pt-3 backdrop-blur">
        {error ? <FormError message={error} /> : null}
        <button
          type="button"
          onClick={handleNext}
          className={`${PRIMARY_BUTTON} mt-3`}
        >
          {step === TOTAL_STEPS - 1 ? t.farm.wizard.save : t.common.next}
        </button>
      </div>
    </div>
  );
}

function CostSuggestions({
  keys,
  lines,
  onAdd,
}: {
  keys: readonly (DirectCostKey | LabourCostKey)[];
  lines: CostLineDraft[];
  onAdd: (label: string) => void;
}) {
  const { t } = useSettings();
  const labels = new Set(
    lines.map((line) => line.label.trim().toLowerCase()),
  );
  const available = keys.filter(
    (key) => !labels.has(t.farm.costItems[key].toLowerCase()),
  );

  if (available.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {t.farm.wizard.suggestionTitle}
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
        {t.farm.wizard.suggestionHint}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {available.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onAdd(t.farm.costItems[key])}
            className="min-h-11 rounded-full border border-line bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-muted"
          >
            <span aria-hidden="true" className="mr-1 text-ink-muted">
              +
            </span>
            {t.farm.costItems[key]}
          </button>
        ))}
      </div>
    </div>
  );
}


/**
 * Remounts CropCostsClient whenever the display currency changes so that the
 * cost-line drafts are always initialised in the current currency.  This is
 * the simplest fix for the stale-closure bug in the lazy useState initialisers.
 */
export function CropCostsClientWrapper({ cropId }: { cropId: string }) {
  const { currency } = useSettings();
  return <CropCostsClient key={cropId + '-' + currency} cropId={cropId} />;
}
