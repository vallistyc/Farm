export function formatDate(iso: string, localeTag: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTime(iso: string, localeTag: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatPercentChange(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

export function parseDecimal(value: string): number {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return 0;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const DIGITS_AND_SEPARATORS = /[^0-9.,-]/g;

/**
 * Reads a money amount typed by a farmer in any common format.
 * "1.500.000" and "1500000" both mean 1,500,000 in Rupiah, while "12,50"
 * and "12.50" both mean 12.5 in Ringgit.
 */
export function parseAmount(value: string, currency: "IDR" | "MYR" | "SGD" | "USD"): number {
  let text = value.replace(DIGITS_AND_SEPARATORS, "");
  if (!text || text === "-") return 0;

  const negative = text.startsWith("-");
  text = text.replace(/-/g, "");

  const lastDot = text.lastIndexOf(".");
  const lastComma = text.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    const decimalMark = lastDot > lastComma ? "." : ",";
    const thousandsMark = decimalMark === "." ? "," : ".";
    text = text.split(thousandsMark).join("");
    text = text.replace(decimalMark, ".");
  } else {
    const mark = lastDot !== -1 ? "." : lastComma !== -1 ? "," : "";
    if (mark) {
      const parts = text.split(mark);
      if (parts.length > 2) {
        // "1.500.000" or "1,500,000": every separator groups thousands.
        text = parts.join("");
      } else if (mark === "." && parts[1].length === 3 && currency === "IDR") {
        text = parts.join("");
      } else {
        text = `${parts[0]}.${parts[1]}`;
      }
    }
  }

  const parsed = Number.parseFloat(text);
  if (!Number.isFinite(parsed)) return 0;
  return negative ? -parsed : parsed;
}
