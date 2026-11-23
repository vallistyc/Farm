import { isLocale, LOCALE_TAGS, type Locale } from "@/i18n";
import en from "@/i18n/en";
import { getCommodity, type CommodityId } from "@/lib/commodities";
import { formatMoney, isCurrency, type CurrencyCode } from "@/lib/currency";
import type { PriceStatus } from "@/lib/pricing";

export type CostCategoryInput = {
  label: string;
  amountMyr: number;
  sharePct: number;
};

export type MarketInput = {
  priceMyr: number;
  nativePrice: number;
  nativeCurrency: string;
  observedAt: string;
  source: string;
};

export type GeneralAdviceInput = {
  commodityId: CommodityId;
  language: Locale;
  displayCurrency: CurrencyCode;
  status: PriceStatus;
  totalCostMyr: number;
  costPerUnitMyr: number;
  minimumPriceMyr: number;
  yieldKg: number;
  lossPercent: number;
  marginPercent: number;
  costCategories: CostCategoryInput[];
  markets: { MY: MarketInput | null; ID: MarketInput | null };
};

export type GeneralAdviceOutput = { summary: string; tips: string[] };

export const MAX_TOTAL_WORDS = 50;

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  jv: "Javanese (simple ngoko, friendly and everyday)",
};

const STATUS_LABELS: Record<PriceStatus, string> = {
  aman: "Aman (safe)",
  tipis: "Tipis (thin margin)",
  rugi: "Rugi (loss)",
};

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readMarket(value: unknown): MarketInput | null {
  if (!value || typeof value !== "object") return null;
  const m = value as Record<string, unknown>;
  const priceMyr = num(m.priceMyr);
  const nativePrice = num(m.nativePrice);
  if (priceMyr === undefined || nativePrice === undefined) return null;
  return {
    priceMyr,
    nativePrice,
    nativeCurrency:
      typeof m.nativeCurrency === "string" ? m.nativeCurrency.slice(0, 4) : "MYR",
    observedAt:
      typeof m.observedAt === "string" ? m.observedAt.slice(0, 10) : "",
    source: typeof m.source === "string" ? m.source.slice(0, 20) : "seed",
  };
}

/** Validates the untrusted request body. Returns null when invalid. */
export function parseGeneralAdviceInput(
  raw: unknown,
): GeneralAdviceInput | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;

  const commodity =
    typeof body.commodityId === "string"
      ? getCommodity(body.commodityId)
      : undefined;
  if (!commodity) return null;
  if (!isLocale(body.language)) return null;

  const status = body.status;
  if (status !== "aman" && status !== "tipis" && status !== "rugi") return null;

  const displayCurrency = body.displayCurrency;
  if (!isCurrency(displayCurrency)) return null;

  const totalCostMyr = num(body.totalCostMyr);
  const costPerUnitMyr = num(body.costPerUnitMyr);
  const minimumPriceMyr = num(body.minimumPriceMyr);
  const yieldKg = num(body.yieldKg);
  const lossPercent = num(body.lossPercent);
  const marginPercent = num(body.marginPercent);
  if (
    totalCostMyr === undefined ||
    costPerUnitMyr === undefined ||
    minimumPriceMyr === undefined ||
    yieldKg === undefined ||
    lossPercent === undefined ||
    marginPercent === undefined
  ) {
    return null;
  }

  const rawCats = Array.isArray(body.costCategories) ? body.costCategories : null;
  if (!rawCats) return null;
  const costCategories: CostCategoryInput[] = [];
  for (const item of rawCats) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const amountMyr = num(c.amountMyr);
    const sharePct = num(c.sharePct);
    if (amountMyr === undefined || sharePct === undefined) continue;
    costCategories.push({
      label: typeof c.label === "string" ? c.label.slice(0, 60) : "cost",
      amountMyr,
      sharePct,
    });
  }

  const marketsRaw =
    body.markets && typeof body.markets === "object"
      ? (body.markets as Record<string, unknown>)
      : {};

  return {
    commodityId: commodity.id,
    language: body.language,
    displayCurrency,
    status,
    totalCostMyr,
    costPerUnitMyr,
    minimumPriceMyr,
    yieldKg,
    lossPercent,
    marginPercent,
    costCategories,
    markets: {
      MY: readMarket(marketsRaw.MY),
      ID: readMarket(marketsRaw.ID),
    },
  };
}

export function buildGeneralSystemPrompt(locale: Locale): string {
  return [
    "You are a practical selling-price advisor for smallholder farmers in Malaysia and Indonesia.",
    `Reply ONLY in ${LOCALE_NAMES[locale]}. Never mix languages.`,
    'Respond with STRICT valid JSON only, no markdown, no code fences, no extra text, in exactly this shape: {"summary": "one sentence", "tips": ["tip", "tip"]}.',
    '"summary" is one short sentence. "tips" is an array of 1 or 2 short practical tips.',
    "Use at most 50 words in total across summary and tips. Use simple everyday words a farmer understands.",
    "Use ONLY the numbers present in the provided data. Never invent prices, yields, or costs.",
    "Express every money amount in the currency stated in the data (the farmer's display currency); never convert to another currency or invent a different currency symbol.",
    "When discussing costs, refer to each cost's share of the total cost. Never say a cost is too expensive.",
    "Suggest low-cost or no-cost actions first.",
    "Mention capital-intensive options (for example a solar pump) only as a long-term option that needs upfront investment.",
    "Never make brand, price, or subsidy claims, and never promise guaranteed profit or a guaranteed sale.",
    "If the data is not about farming, set summary to a one-sentence polite decline and tips to an empty array.",
  ].join(" ");
}

export function buildGeneralUserPrompt(input: GeneralAdviceInput): string {
  const label = en.commodities[input.commodityId] ?? input.commodityId;
  const localeTag = LOCALE_TAGS[input.language];
  // Costs are stored in MYR; render them in the farmer's own display currency
  // (IDR for an Indonesian farmer, MYR for a Malaysian one) so the advice reads
  // naturally to them.
  const money = (amountMyr: number) =>
    formatMoney(amountMyr, input.displayCurrency, localeTag);
  const lines: string[] = [
    `Crop: ${label}`,
    `Market status: ${STATUS_LABELS[input.status]}`,
    `Currency for the farmer's costs: ${input.displayCurrency}`,
    `Total cost: ${money(input.totalCostMyr)}`,
    `Cost per kg: ${money(input.costPerUnitMyr)}`,
    `Minimum selling price: ${money(input.minimumPriceMyr)} per kg (margin ${input.marginPercent}%)`,
    `Expected harvest: ${input.yieldKg} kg (post-harvest loss ${input.lossPercent}%)`,
    "",
    "Cost categories (amount and % share of total cost):",
  ];
  for (const cat of input.costCategories) {
    lines.push(`- ${cat.label}: ${money(cat.amountMyr)} (${cat.sharePct.toFixed(0)}% of total)`);
  }

  lines.push("", "Market prices per kg:");
  if (input.markets.MY) {
    lines.push(
      `- Malaysia (PriceCatcher retail, ${input.markets.MY.source}, observed ${input.markets.MY.observedAt}): RM${input.markets.MY.priceMyr.toFixed(2)}`,
    );
  } else {
    lines.push("- Malaysia: no official price available");
  }
  if (input.markets.ID) {
    lines.push(
      `- Indonesia (Bapanas producer, ${input.markets.ID.source}, observed ${input.markets.ID.observedAt}): ${input.markets.ID.nativePrice} ${input.markets.ID.nativeCurrency} (~RM${input.markets.ID.priceMyr.toFixed(2)})`,
    );
  } else {
    lines.push("- Indonesia: no official price available");
  }

  lines.push(
    "",
    "Retail (Malaysia) and producer-level (Indonesia) prices may differ from the farm-gate price. Note this only if it matters.",
    `Use ${input.displayCurrency} for the farmer's own costs and minimum price. Malaysia market figures are in MYR and Indonesia market figures are in IDR; do not convert between them.`,
    `Reply in ${LOCALE_NAMES[input.language]} as the JSON object described.`,
  );
  return lines.join("\n");
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Parses the model reply into the validated output, or null on any failure. */
export function parseGeneralAdviceReply(text: string): GeneralAdviceOutput | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
  const tipsRaw = Array.isArray(obj.tips) ? obj.tips : [];
  const tips = tipsRaw
    .filter((tip): tip is string => typeof tip === "string" && tip.trim() !== "")
    .map((tip) => tip.trim())
    .slice(0, 2);

  if (!summary) return null;
  if (countWords(summary) + tips.reduce((n, tip) => n + countWords(tip), 0) > MAX_TOTAL_WORDS) {
    return null;
  }
  return { summary, tips };
}
