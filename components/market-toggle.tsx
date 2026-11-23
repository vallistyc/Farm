"use client";

import { useSettings } from "@/components/providers";
import { MARKET_COUNTRIES, type MarketCountry } from "@/lib/market-context";

const ACCENT: Record<MarketCountry, { selected: string; dot: string }> = {
  MY: {
    selected: "bg-[var(--country-my)] text-white shadow-sm",
    dot: "bg-[var(--country-my)]",
  },
  ID: {
    selected: "bg-[var(--country-id)] text-white shadow-sm",
    dot: "bg-[var(--country-id)]",
  },
};

export function MarketToggle({
  value,
  onChange,
  label,
  className = "",
}: {
  value: MarketCountry;
  onChange: (country: MarketCountry) => void;
  label?: string;
  className?: string;
}) {
  const { t } = useSettings();

  return (
    <div
      role="group"
      aria-label={label ?? t.radar.countryLabel}
      className={`grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1 ${className}`}
    >
      {MARKET_COUNTRIES.map((country) => {
        const selected = country === value;
        return (
          <button
            key={country}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(country)}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
              selected
                ? ACCENT[country].selected
                : "text-ink-muted hover:bg-surface"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${
                selected ? "bg-white/80" : ACCENT[country].dot
              }`}
            />
            {country === "MY" ? t.radar.malaysiaTitle : t.radar.indonesiaTitle}
          </button>
        );
      })}
    </div>
  );
}
