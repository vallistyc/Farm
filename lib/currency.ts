export type CurrencyCode = "MYR" | "IDR" | "SGD" | "USD";

// Fixed reference rates relative to MYR. Costs are stored in MYR, while
// cross-border comparisons (e.g. an Indonesian crop sold into Malaysia) use
// these rates. They are stated in the UI wherever a converted value matters.
export const CURRENCIES: { code: CurrencyCode; rateFromMyr: number }[] = [
  { code: "MYR", rateFromMyr: 1 },
  { code: "IDR", rateFromMyr: 3650 },
  { code: "SGD", rateFromMyr: 0.3 },
  { code: "USD", rateFromMyr: 0.235 },
];

export const DEFAULT_CURRENCY: CurrencyCode = "MYR";

export const IDR_PER_MYR =
  CURRENCIES.find((currency) => currency.code === "IDR")?.rateFromMyr ?? 3650;

export function isCurrency(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((currency) => currency.code === value);
}

export function rateFor(currency: CurrencyCode): number {
  return CURRENCIES.find((item) => item.code === currency)?.rateFromMyr ?? 1;
}

export function roundNative(amount: number, currency: CurrencyCode): number {
  const factor = currency === "IDR" ? 1 : 100;
  return Math.round(amount * factor) / factor;
}

export function convertFromMyr(amountMyr: number, currency: CurrencyCode): number {
  return amountMyr * rateFor(currency);
}

export function convertToMyr(amount: number, currency: CurrencyCode): number {
  return amount / rateFor(currency);
}

/** MYR base amount -> amount in the requested currency, rounded for input. */
export function fromMyr(amountMyr: number, currency: CurrencyCode): number {
  return roundNative(convertFromMyr(amountMyr, currency), currency);
}

export function formatMoney(
  amountMyr: number,
  currency: CurrencyCode,
  localeTag: string,
): string {
  return formatAmount(convertFromMyr(amountMyr, currency), currency, localeTag);
}

/** Formats an amount that is already in the given currency. */
export function formatAmount(
  amount: number,
  currency: CurrencyCode,
  localeTag: string,
): string {
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(amount);
}

/**
 * Alias for convertToMyr — converts an amount in the given currency back to
 * the MYR base used by the pricing and farm-store modules.
 */
export function toMyr(amount: number, currency: CurrencyCode): number {
  return convertToMyr(amount, currency);
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
