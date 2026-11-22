"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSettings } from "@/components/providers";
import { BrandMark } from "@/components/brand-mark";
import { DEMO_ACCOUNTS, type DemoAccount, type LoginError } from "@/lib/auth";
import { interpolate } from "@/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useSettings();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<LoginError | null>(null);

  const errorText =
    error === "phone"
      ? t.login.errorPhone
      : error === "pin"
        ? t.login.errorPin
        : error === "invalid"
          ? t.login.errorInvalid
          : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = login(phone, pin);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    router.replace("/home");
  }

  function fillDemo(account: DemoAccount) {
    setPhone(account.phone);
    setPin(account.pin);
    setError(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-start gap-6 pt-6">
        <BrandMark size={56} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.login.title}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t.login.subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-semibold"
          >
            {t.login.phoneLabel}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t.login.phonePlaceholder}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setError(null);
            }}
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/25"
          />
        </div>

        <div>
          <label htmlFor="pin" className="mb-1.5 block text-sm font-semibold">
            {t.login.pinLabel}
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={4}
            placeholder={t.login.pinPlaceholder}
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
              setError(null);
            }}
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base tracking-[0.5em] outline-none transition-colors placeholder:text-ink-muted/60 placeholder:tracking-normal focus:border-brand focus:ring-2 focus:ring-brand/25"
          />
        </div>

        {errorText ? (
          <p
            role="alert"
            className="rounded-xl border border-rugi/30 bg-rugi/10 px-4 py-3 text-sm font-medium text-rugi"
          >
            {errorText}
          </p>
        ) : null}

        <button
          type="submit"
          className="min-h-12 w-full rounded-xl bg-brand px-5 text-base font-semibold text-brand-ink transition-colors hover:bg-brand-strong"
        >
          {t.login.submit}
        </button>
      </form>

      <section
        aria-labelledby="demo-heading"
        className="rounded-2xl border border-line bg-surface p-4"
      >
        <h2 id="demo-heading" className="text-sm font-semibold">
          {t.login.demoTitle}
        </h2>
        <p className="mt-1 text-xs text-ink-muted">{t.login.demoHint}</p>
        <div className="mt-3 space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => fillDemo(account)}
              className="min-h-12 w-full rounded-xl border border-line bg-surface-muted px-3 py-2 text-left text-sm transition-colors hover:border-brand/60"
            >
              <span className="block font-semibold">{account.name}</span>
              <span className="block text-xs text-ink-muted">
                {interpolate(t.login.demoTap, {
                  phone: account.phone,
                  pin: account.pin,
                })}
              </span>
            </button>
          ))}
        </div>
      </section>

      <p className="pb-4 text-center text-xs text-ink-muted">
        {t.login.footer}
      </p>
    </div>
  );
}
