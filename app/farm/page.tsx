"use client";

import Link from "next/link";
import { useAuth, useSettings } from "@/components/providers";
import { PageHeader, EmptyState } from "@/components/page-header";
import { GlyphIcon } from "@/components/icons";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/components/button-styles";
import { useFarm } from "@/lib/farm-store";
import { cropCostTotals } from "@/lib/farm";
import { LOCALE_TAGS, interpolate } from "@/i18n";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/format";

export default function FarmPage() {
  const { t, locale, currency } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);

  if (!user) return null;

  const { fields, crops } = farm.data;
  const localeTag = LOCALE_TAGS[locale];

  return (
    <div>
      <PageHeader title={t.farm.title} description={t.farm.description} />

      <div className="flex gap-2">
        <Link href="/farm/fields/new" className={`${PRIMARY_BUTTON} text-sm`}>
          {t.farm.addField}
        </Link>
        <Link href="/farm/crops/new" className={`${SECONDARY_BUTTON} text-sm`}>
          {t.farm.addCrop}
        </Link>
      </div>

      {fields.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon="farm"
            title={t.farm.emptyTitle}
            description={t.farm.emptyDescription}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <h2 className="text-sm font-semibold text-ink-muted">
            {t.farm.fieldsTitle}
          </h2>
          {fields.map((field) => {
            const fieldCrops = crops.filter(
              (crop) => crop.fieldId === field.id,
            );

            return (
              <section
                key={field.id}
                className="rounded-2xl border border-line bg-surface p-4"
              >
                <header>
                  <h3 className="text-base font-semibold">{field.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {interpolate(t.farm.sizeValue, { size: field.sizeHa })} ·{" "}
                    {field.location}
                  </p>
                </header>

                <div className="mt-3 space-y-2">
                  {fieldCrops.length === 0 ? (
                    <p className="rounded-xl bg-surface-muted px-3 py-3 text-sm text-ink-muted">
                      {t.farm.noCropsTitle}
                    </p>
                  ) : (
                    fieldCrops.map((crop) => {
                      const totals = cropCostTotals(crop.costs);
                      const hasCosts = totals.totalCostMyr > 0;

                      return (
                        <Link
                          key={crop.id}
                          href={`/farm/crops/${crop.id}`}
                          className="flex min-h-14 items-center gap-3 rounded-xl border border-line bg-background px-3 py-2 transition-colors hover:bg-surface-muted"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                            <GlyphIcon name="farm" className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {t.commodities[crop.commodityId]}
                            </span>
                            <span className="line-clamp-2 text-xs text-ink-muted">
                              {interpolate(t.farm.cropMeta, {
                                field: field.name,
                                date: formatDate(crop.harvestDate, localeTag),
                              })}
                            </span>
                          </span>
                          {hasCosts ? (
                            <span className="shrink-0 text-right text-xs font-semibold text-ink-muted">
                              {formatMoney(
                                totals.totalCostMyr,
                                currency,
                                localeTag,
                              )}
                            </span>
                          ) : (
                            <span
                              aria-hidden="true"
                              className="shrink-0 text-lg text-ink-muted"
                            >
                              ›
                            </span>
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {fields.length > 0 && crops.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          {t.farm.noCropsDescription}
        </p>
      ) : null}
    </div>
  );
}
