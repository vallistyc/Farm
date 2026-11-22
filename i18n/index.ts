import type { CurrencyCode } from "@/lib/currency";
import en, { type Dictionary } from "./en";
import id from "./id";
import ms from "./ms";
import jv from "./jv";

export type { Dictionary } from "./en";

export type Locale = "en" | "id" | "ms" | "jv";

export const DEFAULT_LOCALE: Locale = "id";

export const dictionaries: Record<Locale, Dictionary> = { en, id, ms, jv };

export const LANGUAGES: { code: Locale; native: string }[] = [
  { code: "en", native: "English" },
  { code: "id", native: "Bahasa Indonesia" },
  { code: "ms", native: "Bahasa Melayu" },
  { code: "jv", native: "Basa Jawa" },
];

export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-MY",
  id: "id-ID",
  ms: "ms-MY",
  jv: "id-ID",
};

export const CURRENCY_LABEL_KEYS = {
  MYR: "myr",
  IDR: "idr",
  SGD: "sgd",
  USD: "usd",
} as const satisfies Record<CurrencyCode, keyof Dictionary["currency"]>;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(dictionaries, value)
  );
}

export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
