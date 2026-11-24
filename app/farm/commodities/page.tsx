"use client";

import { useState, type FormEvent } from "react";
import { useSettings } from "@/components/providers";
import { BackLink } from "@/components/back-link";
import { TextField } from "@/components/form-fields";
import { PRIMARY_BUTTON } from "@/components/button-styles";
import { COMMODITIES } from "@/lib/commodities";
import { useCommodityCatalog } from "@/lib/commodity-store";

export default function CommoditiesPage() {
  const { t } = useSettings();
  const { custom, add, remove } = useCommodityCatalog();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = add(name);
    if (!created) {
      setError(t.catalog.errorName);
      return;
    }
    setName("");
    setError(null);
  }

  return (
    <div className="space-y-6 pb-14">
      <BackLink href="/farm" label={t.farm.backToFarm} />

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.catalog.title}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{t.catalog.description}</p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">{t.catalog.builtInTitle}</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          {t.catalog.builtInNote}
        </p>
        <ul className="mt-3 space-y-2">
          {COMMODITIES.map((commodity) => (
            <li
              key={commodity.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-background px-3 py-2"
            >
              <span className="text-sm font-semibold">
                {t.commodities[commodity.id]}
              </span>
              <span className="text-xs text-ink-muted">
                {t.catalog.hasMarket}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">{t.catalog.customTitle}</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          {t.catalog.customNote}
        </p>

        <form onSubmit={handleAdd} className="mt-3 space-y-2">
          <TextField
            id="new-commodity"
            label={t.catalog.addLabel}
            value={name}
            onChange={(value) => {
              setName(value);
              setError(null);
            }}
            placeholder={t.catalog.addPlaceholder}
          />
          {error ? (
            <p role="alert" className="text-sm font-medium text-rugi">
              {error}
            </p>
          ) : null}
          <button type="submit" className={`${PRIMARY_BUTTON} text-sm`}>
            {t.catalog.addButton}
          </button>
        </form>

        <div className="mt-4">
          {custom.length === 0 ? (
            <p className="rounded-xl bg-surface-muted px-3 py-3 text-sm text-ink-muted">
              {t.catalog.empty}
            </p>
          ) : (
            <ul className="space-y-2">
              {custom.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-background px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm font-semibold">
                    {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-muted transition-colors hover:border-rugi/50 hover:text-rugi"
                  >
                    {t.catalog.remove}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
