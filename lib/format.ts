export function formatDate(iso: string, localeTag: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
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
