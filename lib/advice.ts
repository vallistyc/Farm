import { getSupabase } from "@/lib/supabase";
import type { GeneralAdviceInput, GeneralAdviceOutput } from "@/lib/general-advice";

export type CachedAdviceRow = {
  advice: GeneralAdviceOutput;
  input_hash: string;
  generated_at: string;
};

export const ADVICE_MAX_AGE_DAYS = 30;
export const ADVICE_REFRESH_MIN_INTERVAL_DAYS = 1;

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor;
}

function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** Stable fingerprint of the numeric inputs, rounded to dampen live-price jitter. */
export function hashAdviceInput(input: GeneralAdviceInput): string {
  const parts = [
    input.commodityId,
    input.language,
    input.displayCurrency,
    input.status,
    round(input.totalCostMyr, 2),
    round(input.costPerUnitMyr, 2),
    round(input.minimumPriceMyr, 2),
    round(input.yieldKg, 1),
    round(input.lossPercent, 1),
    round(input.marginPercent, 1),
    input.costCategories
      .map((cat) => `${cat.label}:${round(cat.amountMyr, 2)}`)
      .join("|"),
    input.markets.MY ? round(input.markets.MY.priceMyr, 2) : "-",
    input.markets.ID ? round(input.markets.ID.priceMyr, 2) : "-",
  ];
  return fnv1a(parts.join("~"));
}

export function daysSince(iso: string): number {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return (Date.now() - time) / 86_400_000;
}

export async function readCachedAdvice(
  userId: string,
  cropId: string,
  language: string,
): Promise<CachedAdviceRow | null> {
  try {
    const { data, error } = await getSupabase()
      .from("advice_cache")
      .select("advice,input_hash,generated_at")
      .eq("user_id", userId)
      .eq("crop_id", cropId)
      .eq("language", language)
      .maybeSingle();
    if (error || !data) return null;
    return data as unknown as CachedAdviceRow;
  } catch {
    return null;
  }
}

export async function writeCachedAdvice(
  userId: string,
  cropId: string,
  language: string,
  inputHash: string,
  advice: GeneralAdviceOutput,
): Promise<void> {
  try {
    await getSupabase().from("advice_cache").upsert(
      {
        user_id: userId,
        crop_id: cropId,
        language,
        input_hash: inputHash,
        advice,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,crop_id,language" },
    );
  } catch {
    // Cache write is best-effort; a failure only costs a future regeneration.
  }
}

export async function generateAdvice(
  input: GeneralAdviceInput,
): Promise<GeneralAdviceOutput> {
  const response = await fetch("/api/general-advice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`general-advice failed with ${response.status}`);
  }

  const data = (await response.json().catch(() => null)) as {
    summary?: unknown;
    tips?: unknown;
  } | null;

  if (!data || typeof data.summary !== "string" || !Array.isArray(data.tips)) {
    throw new Error("general-advice returned an unexpected shape");
  }

  return {
    summary: data.summary.trim(),
    tips: data.tips
      .filter((tip): tip is string => typeof tip === "string" && tip.trim() !== "")
      .slice(0, 2),
  };
}
