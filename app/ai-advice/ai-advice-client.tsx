"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, useSettings } from "@/components/providers";
import { BackLink } from "@/components/back-link";
import { StatusBadge } from "@/components/status-badge";
import { PRIMARY_BUTTON } from "@/components/button-styles";
import { useFarm } from "@/lib/farm-store";
import { getCommodity } from "@/lib/commodities";
import { useMarketQuote } from "@/components/market-prices";
import { cropCostTotals, priceCrop } from "@/lib/farm";
import { LOCALE_TAGS } from "@/i18n";
import { formatMoney } from "@/lib/currency";

type ChatMessage = { id: string; role: "user" | "advisor"; text: string };

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AiAdviceClient({ cropId }: { cropId?: string }) {
  const { t, locale, currency } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const crop = cropId ? farm.getCrop(cropId) : undefined;
  const commodity = crop ? getCommodity(crop.commodityId) : undefined;
  const quote = useMarketQuote(crop?.commodityId ?? "padi");
  const totals = crop ? cropCostTotals(crop.costs) : undefined;
  const pricing =
    crop && commodity && totals && totals.totalCostMyr > 0 && crop.yieldKg > 0
      ? priceCrop(crop, quote.priceMyr)
      : null;
  const localeTag = LOCALE_TAGS[locale];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (!sending) return;
    const timer = setTimeout(() => setSlow(true), 12000);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [sending]);

  if (!user) return null;

  const suggestions = [
    t.ai.suggestion1,
    t.ai.suggestion2,
    t.ai.suggestion3,
  ];

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setQuestion("");
    setMessages((current) => [
      ...current,
      { id: makeId(), role: "user", text: trimmed },
    ]);
    setSending(true);

    try {
      const response = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          locale,
          currency,
          crop:
            crop && totals
              ? {
                  commodityId: crop.commodityId,
                  fieldName: farm.getField(crop.fieldId)?.name,
                  yieldKg: crop.yieldKg,
                  lossPercent: crop.lossPercent,
                  marginPercent: crop.marginPercent,
                  ...totals,
                  hiddenBreakdown: crop.costs.hidden,
                }
              : undefined,
          market: crop
            ? {
                priceMyr: quote.priceMyr,
                observedAt: quote.observedAt,
                source: quote.source,
              }
            : undefined,
        }),
        signal: AbortSignal.timeout(60000),
      });

      const data = (await response.json().catch(() => null)) as {
        reply?: unknown;
        error?: unknown;
      } | null;

      if (!response.ok) {
        setError(
          response.status === 503
            ? t.ai.errorNotConfigured
            : t.ai.errorGeneric,
        );
        return;
      }

      if (!data) {
        setError(t.ai.errorGeneric);
        return;
      }

      const reply = data.reply;
      if (typeof reply !== "string" || !reply) {
        setError(t.ai.errorGeneric);
        return;
      }

      setMessages((current) => [
        ...current,
        { id: makeId(), role: "advisor", text: reply },
      ]);
    } catch {
      setError(t.ai.errorGeneric);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <BackLink
        href={crop ? `/farm/crops/${crop.id}` : "/home"}
        label={crop ? t.calc.backToCrop : t.nav.home}
      />

      <header className="flex items-start justify-between gap-3 pb-4 pt-1">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.ai.title}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {t.ai.subtitle}
          </p>
        </div>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            className="min-h-11 shrink-0 rounded-full border border-line px-3 text-xs font-semibold text-ink-muted"
          >
            {t.ai.clear}
          </button>
        ) : null}
      </header>

      {crop ? (
        <section className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t.ai.contextTitle}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold">
                {t.commodities[crop.commodityId]}
              </p>
              {pricing ? (
                <p className="mt-0.5 text-xs text-ink-muted">
                  {formatMoney(
                    pricing.recommendedPriceMyr,
                    currency,
                    localeTag,
                  )}{" "}
                  {t.common.perKg}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-ink-muted">
                  {t.farm.costsNotEntered}
                </p>
              )}
            </div>
            {pricing ? (
              <StatusBadge
                status={pricing.status}
                label={t.status[pricing.status]}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {messages.length === 0 && !sending ? (
        <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-base font-semibold">{t.ai.emptyTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {t.ai.emptyDescription}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t.ai.suggestionsTitle}
          </p>
          <div className="mt-2 space-y-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void ask(suggestion)}
                className="flex min-h-12 w-full items-center rounded-xl border border-line bg-background px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-surface-muted"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <ol
          aria-live="polite"
          className="mt-4 space-y-3"
        >
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <li
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? "bg-brand text-brand-ink"
                      : "border border-line bg-surface"
                  }`}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {isUser ? t.ai.you : t.ai.advisor}
                  </p>
                  <p className="whitespace-pre-line break-words">
                    {message.text}
                  </p>
                </div>
              </li>
            );
          })}
          {sending ? (
            <li className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  {t.ai.advisor}
                </p>
                <p className="mt-1">{t.ai.thinking}</p>
                {slow ? (
                  <p className="mt-1 text-xs leading-relaxed">
                    {t.ai.slowNote}
                  </p>
                ) : null}
              </div>
            </li>
          ) : null}
          <li aria-hidden="true">
            <div ref={endRef} />
          </li>
        </ol>
      )}

      {error ? (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-rugi/30 bg-rugi/10 px-4 py-3 text-sm leading-relaxed text-rugi"
        >
          {error}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
        className="mt-4"
      >
        <label htmlFor="ai-question" className="sr-only">
          {t.ai.inputLabel}
        </label>
        <textarea
          id="ai-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={500}
          rows={2}
          placeholder={t.ai.placeholder}
          className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-base leading-relaxed outline-none placeholder:text-ink-muted focus:border-brand"
        />
        <button
          type="submit"
          disabled={!question.trim() || sending}
          className={`${PRIMARY_BUTTON} mt-2 disabled:opacity-50`}
        >
          {sending ? t.ai.thinking : t.ai.send}
        </button>
      </form>

      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        {t.ai.disclaimer}
      </p>
    </div>
  );
}
