export type CurrencyCode = "MYR" | "IDR" | "SGD" | "USD";

// Fixed fallback rates relative to MYR. A daily FX API can replace these later.
export const CURRENCIES: { code: CurrencyCode; rateFromMyr: number }[] = [
  { code: "MYR", rateFromMyr: 1 },
  { code: "IDR", rateFromMyr: 3650 },
  { code: "SGD", rateFromMyr: 0.3 },
  { code: "USD", rateFromMyr: 0.235 },
];

export const DEFAULT_CURRENCY: CurrencyCode = "MYR";

export function isCurrency(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((currency) => currency.code === value);
}

export function convertFromMyr(amountMyr: number, currency: CurrencyCode): number {
  const target = CURRENCIES.find((item) => item.code === currency);
  return amountMyr * (target?.rateFromMyr ?? 1);
}

export function formatMoney(
  amountMyr: number,
  currency: CurrencyCode,
  localeTag: string,
): string {
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(convertFromMyr(amountMyr, currency));
}

// Indonesian market prices are stored and shown in Rupiah. They are not
// converted through the MYR display setting, so the source value stays exact.
export function formatIdr(amountIdr: number, localeTag: string): string {
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amountIdr);
}
