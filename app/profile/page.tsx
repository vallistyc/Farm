"use client";

import { useAuth, useSettings } from "@/components/providers";
import { PageHeader } from "@/components/page-header";
import { CURRENCIES, isCurrency } from "@/lib/currency";
import { MARKET_COUNTRIES, isMarketCountry } from "@/lib/market-context";
import { CURRENCY_LABEL_KEYS, LANGUAGES, isLocale } from "@/i18n";

export default function ProfilePage() {
  const { t, locale, currency, country, setLocale, setCurrency, setCountry } =
    useSettings();
  const { user, logout, cloudStatus } = useAuth();

  if (!user) return null;

  const cloudLabel = {
    local: t.profile.cloudLocal,
    syncing: t.profile.cloudSyncing,
    synced: t.profile.cloudSynced,
    error: t.profile.cloudError,
  }[cloudStatus];

  const cloudDotClass = {
    local: "bg-ink-muted",
    syncing: "bg-brand",
    synced: "bg-aman",
    error: "bg-rugi",
  }[cloudStatus];

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <PageHeader title={t.profile.title} description={t.profile.accountTitle} />

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-base font-semibold text-brand">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{user.name}</p>
            <p className="truncate text-sm text-ink-muted">{user.email}</p>
            <p className="truncate text-xs text-ink-muted">{user.region}</p>
          </div>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">
          {t.profile.settingsTitle}
        </h2>
        <div className="space-y-4 rounded-2xl border border-line bg-surface p-5">
          <div>
            <label
              htmlFor="language"
              className="mb-1.5 block text-sm font-semibold"
            >
              {t.profile.language}
            </label>
            <select
              id="language"
              value={locale}
              onChange={(event) => {
                if (isLocale(event.target.value)) setLocale(event.target.value);
              }}
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.native}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="country"
              className="mb-1.5 block text-sm font-semibold"
            >
              {t.profile.country}
            </label>
            <select
              id="country"
              value={country}
              onChange={(event) => {
                if (isMarketCountry(event.target.value)) {
                  setCountry(event.target.value);
                }
              }}
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
            >
              {MARKET_COUNTRIES.map((code) => (
                <option key={code} value={code}>
                  {code === "MY"
                    ? t.radar.malaysiaTitle
                    : t.radar.indonesiaTitle}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              {t.profile.countryHint}
            </p>
          </div>

          <div>
            <label
              htmlFor="currency"
              className="mb-1.5 block text-sm font-semibold"
            >
              {t.profile.currency}
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(event) => {
                if (isCurrency(event.target.value)) {
                  setCurrency(event.target.value);
                }
              }}
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {t.currency[CURRENCY_LABEL_KEYS[item.code]]}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-ink-muted">{t.profile.saved}</p>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">
          {t.profile.dataTitle}
        </h2>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
          <span
            className={`size-2.5 shrink-0 rounded-full ${cloudDotClass}`}
            aria-hidden="true"
          />
          <div className="min-w-0" aria-live="polite">
            <p className="text-sm font-semibold">{cloudLabel}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
              {t.profile.cloudHint}
            </p>
          </div>
        </div>
      </section>

      <p className="mt-4 rounded-2xl border border-line bg-surface-muted/60 p-4 text-xs leading-relaxed text-ink-muted">
        {t.profile.accountNote}
      </p>

      <button
        type="button"
        onClick={logout}
        className="mt-4 min-h-12 w-full rounded-xl border border-rugi/40 bg-surface px-4 text-base font-semibold text-rugi transition-colors hover:bg-rugi/10"
      >
        {t.profile.logout}
      </button>

      <p className="mt-6 pb-2 text-center text-xs text-ink-muted">
        {t.app.version}
      </p>
    </div>
  );
}
