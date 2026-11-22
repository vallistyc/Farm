import { isLocale, type Locale } from "@/i18n";
import en from "@/i18n/en";
import { getCommodity, type CommodityId } from "@/lib/commodities";
import { formatMoney, isCurrency, type CurrencyCode } from "@/lib/currency";
import { HIDDEN_COST_KEYS, type HiddenCostKey } from "@/lib/farm";
import { calculatePricing } from "@/lib/pricing";

export const MAX_QUESTION_LENGTH = 500;

export type AdviceCrop = {
  commodityId: CommodityId;
  fieldName?: string;
  yieldKg: number;
  lossPercent: number;
  marginPercent: number;
  directCostsMyr: number;
  labourCostsMyr: number;
  hiddenCostsMyr: number;
  hiddenBreakdown?: Partial<Record<HiddenCostKey, number>>;
};

export type AdviceMarket = {
  priceMyr: number;
  observedAt: string;
  source: "pricecatcher" | "seed";
};

export type AdviceRequest = {
  question: string;
  locale: Locale;
  currency: CurrencyCode;
  crop?: AdviceCrop;
  market?: AdviceMarket;
};

export type AdviceError = "bad_request" | "not_configured" | "upstream";

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  jv: "Javanese (simple ngoko, friendly and everyday)",
};

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function parseAdviceRequest(raw: unknown): AdviceRequest | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;

  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > MAX_QUESTION_LENGTH) return null;
  if (!isLocale(body.locale) || !isCurrency(body.currency)) return null;

  let crop: AdviceCrop | undefined;
  if (body.crop !== undefined && body.crop !== null) {
    if (typeof body.crop !== "object") return null;
    const value = body.crop as Record<string, unknown>;
    const commodity =
      typeof value.commodityId === "string"
        ? getCommodity(value.commodityId)
        : undefined;
    const yieldKg = readNumber(value.yieldKg);
    const lossPercent = readNumber(value.lossPercent);
    const marginPercent = readNumber(value.marginPercent);
    const directCostsMyr = readNumber(value.directCostsMyr);
    const labourCostsMyr = readNumber(value.labourCostsMyr);
    const hiddenCostsMyr = readNumber(value.hiddenCostsMyr);

    if (
      !commodity ||
      yieldKg === undefined ||
      lossPercent === undefined ||
      marginPercent === undefined ||
      directCostsMyr === undefined ||
      labourCostsMyr === undefined ||
      hiddenCostsMyr === undefined
    ) {
      return null;
    }

    const hiddenBreakdown: Partial<Record<HiddenCostKey, number>> = {};
    if (value.hiddenBreakdown && typeof value.hiddenBreakdown === "object") {
      const hidden = value.hiddenBreakdown as Record<string, unknown>;
      for (const key of HIDDEN_COST_KEYS) {
        const amount = readNumber(hidden[key]);
        if (amount !== undefined && amount > 0) {
          hiddenBreakdown[key] = amount;
        }
      }
    }

    crop = {
      commodityId: commodity.id,
      fieldName:
        typeof value.fieldName === "string"
          ? value.fieldName.slice(0, 80)
          : undefined,
      yieldKg,
      lossPercent,
      marginPercent,
      directCostsMyr,
      labourCostsMyr,
      hiddenCostsMyr,
      hiddenBreakdown,
    };
  }

  let market: AdviceMarket | undefined;
  if (body.market !== undefined && body.market !== null) {
    if (typeof body.market !== "object") return null;
    const value = body.market as Record<string, unknown>;
    const priceMyr = readNumber(value.priceMyr);
    const observedAt =
      typeof value.observedAt === "string"
        ? value.observedAt.slice(0, 10)
        : undefined;
    const source =
      value.source === "pricecatcher" || value.source === "seed"
        ? value.source
        : undefined;
    if (
      priceMyr === undefined ||
      priceMyr < 0 ||
      !observedAt ||
      !source
    ) {
      return null;
    }
    market = { priceMyr, observedAt, source };
  }

  return {
    question,
    locale: body.locale,
    currency: body.currency,
    crop,
    market,
  };
}

export function buildSystemPrompt(locale: Locale): string {
  return [
    "You are a practical farming and selling-price advisor for smallholder farmers in Malaysia and Indonesia.",
    "Answer only questions about farming, harvest costs, selling prices, and market decisions.",
    "If the question is about anything else, politely decline in one short sentence and invite a farming question.",
    `Answer in ${LOCALE_NAMES[locale]} only. Never mix languages.`,
    "Use simple, everyday words and short sentences. No jargon.",
    "Keep the answer under 120 words.",
    "Questions about when or where to sell a harvest, prices, costs, or profit are farming questions. Always answer them.",
    "Use the farmer's crop and cost context when provided.",
    "Market prices may come from official PriceCatcher retail data or from sample data. State the source given in the context; never call sample data live.",
    "PriceCatcher is retail data, so it can differ from the farm-gate price the farmer receives.",
    "Never promise guaranteed profit or a guaranteed sale.",
  ].join(" ");
}

export function buildUserPrompt(request: AdviceRequest): string {
  const money = (amountMyr: number) =>
    formatMoney(amountMyr, request.currency, "en-MY");
  const lines = [`Farmer question: ${request.question}`];

  if (!request.crop) {
    lines.push(
      "",
      "No crop context was provided. If numbers are needed, ask the farmer to add a crop and its costs.",
    );
    return lines.join("\n");
  }

  const crop = request.crop;
  const commodity = getCommodity(crop.commodityId);
  const marketPrice =
    request.market?.priceMyr ?? (commodity ? (commodity.trendMyr.at(-1) ?? 0) : 0);
  const marketLabel = request.market
    ? request.market.source === "pricecatcher"
      ? `official PriceCatcher retail data, observed ${request.market.observedAt}`
      : `sample data, observed ${request.market.observedAt}`
    : "sample data";
  const pricing = calculatePricing({
    directCostsMyr: crop.directCostsMyr,
    labourCostsMyr: crop.labourCostsMyr,
    hiddenCostsMyr: crop.hiddenCostsMyr,
    yieldKg: crop.yieldKg,
    lossPercent: crop.lossPercent,
    marginPercent: crop.marginPercent,
    marketPriceMyr: marketPrice,
  });

  lines.push(
    "",
    `Crop context: ${commodity ? en.commodities[commodity.id] : crop.commodityId}${
      crop.fieldName ? ` (field: ${crop.fieldName})` : ""
    }`,
    `- Expected harvest: ${crop.yieldKg} kg, post-harvest loss ${crop.lossPercent}%, profit margin ${crop.marginPercent}%`,
    `- Total cost: ${money(pricing.totalCostMyr)} (direct ${money(
      pricing.directCostsMyr,
    )}, labour ${money(pricing.labourCostsMyr)}, hidden ${money(
      pricing.hiddenCostsMyr,
    )})`,
  );

  for (const key of HIDDEN_COST_KEYS) {
    const amount = crop.hiddenBreakdown?.[key];
    if (amount && amount > 0) {
      lines.push(`  - Hidden ${en.farm.hiddenCosts[key]}: ${money(amount)}`);
    }
  }

  lines.push(
    `- Cost per kg: ${money(pricing.costPerUnitMyr)}`,
    `- Minimum selling price: ${money(pricing.minimumPriceMyr)} per kg`,
    `- Market price: ${money(pricing.marketPriceMyr)} per kg (${marketLabel})`,
    `- Market status: ${en.status[pricing.status]}`,
    `- Recommended selling price: ${money(pricing.recommendedPriceMyr)} per kg`,
    `- Amounts are in ${request.currency}, converted from MYR at a fixed demo rate.`,
  );

  return lines.join("\n");
}
