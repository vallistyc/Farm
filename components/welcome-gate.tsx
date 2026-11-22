"use client";

import { useSettings } from "@/components/providers";
import { BrandMark } from "@/components/brand-mark";
import { CURRENCIES } from "@/lib/currency";
import { CURRENCY_LABEL_KEYS, LANGUAGES } from "@/i18n";

export function WelcomeGate() {
  const {
    t,
    locale,
    currency,
    setLocale,
    setCurrency,
    completeOnboarding,
  } = useSettings();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex flex-1 flex-col gap-6 px-5 pb-6 pt-10">
        <div className="flex items-center gap-3">
          <BrandMark size={52} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t.welcome.step}
            </p>
            <p className="text-base font-semibold">{t.app.name}</p>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.welcome.title}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t.welcome.subtitle}</p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            {t.welcome.languageLabel}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((language) => {
              const selected = language.code === locale;
              return (
                <button
                  key={language.code}
                  type="button"
                  lang={language.code}
                  aria-pressed={selected}
                  onClick={() => setLocale(language.code)}
                  className={`min-h-12 rounded-xl border px-3 text-sm transition-colors ${
                    selected
                      ? "border-brand bg-brand-soft font-semibold text-brand"
                      : "border-line bg-surface text-ink hover:border-brand/60"
                  }`}
                >
                  {language.native}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            {t.welcome.currencyLabel}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {CURRENCIES.map((item) => {
              const selected = item.code === currency;
              return (
                <button
                  key={item.code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setCurrency(item.code)}
                  className={`flex min-h-14 flex-col justify-center gap-0.5 rounded-xl border px-3 text-left transition-colors ${
                    selected
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-surface text-ink hover:border-brand/60"
                  }`}
                >
                  <span className="text-sm font-semibold">{item.code}</span>
                  <span className="w-full truncate text-xs opacity-80">
                    {t.currency[CURRENCY_LABEL_KEYS[item.code]]}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <p className="text-xs leading-relaxed text-ink-muted">
          {t.welcome.currencyNote}
        </p>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-background/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          type="button"
          onClick={() => completeOnboarding(locale, currency)}
          className="min-h-12 w-full rounded-xl bg-brand px-5 text-base font-semibold text-brand-ink transition-colors hover:bg-brand-strong"
        >
          {t.welcome.continue}
        </button>
      </div>
    </div>
  );
}
