"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth, useSettings } from "@/components/providers";
import { BrandMark } from "@/components/brand-mark";
import { PRIMARY_BUTTON } from "@/components/button-styles";
import { isValidEmail, type AuthError } from "@/lib/auth";

export default function LoginPage() {
  const { t } = useSettings();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<AuthError | null>(null);
  const [busy, setBusy] = useState(false);

  const errorText =
    error === "email"
      ? t.login.errorEmail
      : error === "password"
        ? t.login.errorPassword
        : error === "network"
          ? t.login.errorNetwork
          : error === "invalid"
            ? t.login.errorInvalid
            : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError("email");
      return;
    }
    if (!password) {
      setError("password");
      return;
    }
    setError(null);
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // On success the AppShell auth guard redirects the signed-in user to /home.
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
            htmlFor="email"
            className="mb-1.5 block text-sm font-semibold"
          >
            {t.login.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t.login.emailPlaceholder}
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
            {t.login.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder={t.login.passwordPlaceholder}
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
          {t.login.submit}
        </button>
      </form>

      <p className="text-center text-sm text-ink-muted">
        {t.login.noAccount}{" "}
        <Link
          href="/register"
          className="font-semibold text-brand hover:underline"
        >
          {t.login.registerCta}
        </Link>
      </p>

      <p className="pb-4 text-center text-xs text-ink-muted">{t.login.footer}</p>
    </div>
  );
}
