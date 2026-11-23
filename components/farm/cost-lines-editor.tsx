"use client";

import { useSettings } from "@/components/providers";
import { TextField } from "@/components/form-fields";
import { SECONDARY_BUTTON } from "@/components/button-styles";

export type CostLineDraft = {
  id: string;
  label: string;
  amount: string;
};

export function makeCostLine(): CostLineDraft {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { id, label: "", amount: "" };
}

export function CostLinesEditor({
  lines,
  onChange,
  labelPlaceholder,
}: {
  lines: CostLineDraft[];
  onChange: (lines: CostLineDraft[]) => void;
  labelPlaceholder: string;
}) {
  const { t, currency } = useSettings();

  function updateLine(id: string, patch: Partial<CostLineDraft>) {
    onChange(
      lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  return (
    <div className="space-y-3">
      {lines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface-muted/60 px-4 py-3 text-sm text-ink-muted">
          {t.farm.wizard.noLines}
        </p>
      ) : null}

      {lines.map((line) => (
        <div
          key={line.id}
          className="rounded-xl border border-line bg-surface p-3"
        >
          <div className="space-y-3">
            <TextField
              id={`${line.id}-label`}
              label={t.farm.wizard.lineLabel}
              value={line.label}
              onChange={(value) => updateLine(line.id, { label: value })}
              placeholder={labelPlaceholder}
            />
            <TextField
              id={`${line.id}-amount`}
              label={t.farm.wizard.lineAmount}
              value={line.amount}
              onChange={(value) => updateLine(line.id, { amount: value })}
              inputMode="decimal"
              suffix={currency}
            />
          </div>
          <button
            type="button"
            onClick={() =>
              onChange(lines.filter((item) => item.id !== line.id))
            }
            className="mt-2 inline-flex min-h-11 items-center px-1 text-sm font-semibold text-rugi"
          >
            {t.common.remove}
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...lines, makeCostLine()])}
        className={`${SECONDARY_BUTTON} text-sm`}
      >
        <span aria-hidden="true" className="mr-1.5 text-base">
          +
        </span>
        {t.farm.wizard.addLine}
      </button>
    </div>
  );
}
