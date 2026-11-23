"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth, useSettings } from "@/components/providers";
import { BrandMark } from "@/components/brand-mark";
import { PRIMARY_BUTTON } from "@/components/button-styles";
import { isValidEmail, type AuthError } from "@/lib/auth";

export default function RegisterPage() {
  const { t } = useSettings();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const errorText =
    error === "name"
      ? t.register.errorName
      : error === "region"
        ? t.register.errorRegion
        : error === "email"
          ? t.register.errorEmail
          : error === "password"
            ? t.register.errorPassword
            : error === "exists"
              ? t.register.errorExists
              : error === "network"
                ? t.register.errorNetwork
                : error
                  ? t.register.errorNetwork
                  : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("name");
      return;
    }
    if (!region.trim()) {
      setError("region");
      return;
    }
    if (!isValidEmail(email)) {
      setError("email");
      return;
    }
    if (password.length < 6) {
      setError("password");
      return;
    }
    setError(null);
    setBusy(true);
    const result = await register({ name, region, email, password });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.needsConfirm) {
      setSent(true);
      return;
    }
    // Email confirmation is off: a session was created and the AppShell guard
    // redirects the signed-in user to /home.
  }

  if (sent) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6 pt-6">
        <BrandMark size={56} />
        <div className="rounded-2xl border border-aman/40 bg-aman/10 p-5">
          <h1 className="text-lg font-semibold text-aman">{t.register.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {t.register.checkInbox}
          </p>
        </div>
        <Link
          href="/login"
          className={`${PRIMARY_BUTTON} text-center`}
        >
          {t.register.loginCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-start gap-6 pt-6">
        <BrandMark size={56} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.register.title}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t.register.subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
            {t.register.nameLabel}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={t.register.namePlaceholder}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/25"
          />
        </div>

        <div>
          <label
            htmlFor="region"
            className="mb-1.5 block text-sm font-semibold"
          >
            {t.register.regionLabel}
          </label>
          <input
            id="region"
            name="region"
            type="text"
            autoComplete="address-level2"
            placeholder={t.register.regionPlaceholder}
            value={region}
            onChange={(event) => {
              setRegion(event.target.value);
              setError(null);
            }}
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/25"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
            {t.register.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t.register.emailPlaceholder}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/25"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-semibold"
          >
            {t.register.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={t.register.passwordPlaceholder}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none transition-colors placeholder:text-ink-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/25"
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
          disabled={busy}
          className={`${PRIMARY_BUTTON} disabled:opacity-50`}
        >
          {t.register.submit}
        </button>
      </form>

      <p className="text-center text-sm text-ink-muted">
        {t.register.haveAccount}{" "}
        <Link
          href="/login"
          className="font-semibold text-brand hover:underline"
        >
          {t.register.loginCta}
        </Link>
      </p>
    </div>
  );
}
