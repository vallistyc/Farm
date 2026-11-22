export type MarketCommodityId =
  | "padi"
  | "maize"
  | "spinach"
  | "chilli"
  | "banana";

export const MARKET_COMMODITY_IDS: MarketCommodityId[] = [
  "padi",
  "maize",
  "spinach",
  "chilli",
  "banana",
];

export type MarketSource = "pricecatcher" | "seed";

export type MarketQuote = {
  priceMyr: number;
  observedAt: string;
  source: MarketSource;
};

export type MarketTrend = {
  start: string;
  end: string;
  dates: string[];
  values: number[];
};

export type MarketSnapshot = {
  fetchedAt: string;
  observedAt: string;
  liveCount: number;
  quotes: Record<MarketCommodityId, MarketQuote>;
  trends: Record<MarketCommodityId, MarketTrend>;
};

export type SeedCommodity = {
  id: MarketCommodityId;
  trendStart: string;
  trendMyr: number[];
};

export type PriceCatcherRow = {
  date: string;
  itemCode: number;
  priceMyr: number;
};

// PriceCatcher item codes (unit 1kg). Padi and maize have no farm-gate item in
// the dataset, so those commodities keep the seed series until a wholesale
// source (e.g. FAMA) is added.
export const PRICECATCHER_ITEMS: Partial<
  Record<MarketCommodityId, readonly number[]>
> = {
  spinach: [1556, 1557],
  chilli: [93, 94],
  banana: [18, 19],
};

export const PRICECATCHER_WANTED_ITEMS = new Set<number>(
  Object.values(PRICECATCHER_ITEMS).flat(),
);

const ITEM_TO_COMMODITY = new Map<number, MarketCommodityId>();
for (const [commodityId, items] of Object.entries(PRICECATCHER_ITEMS)) {
  for (const item of items ?? []) {
    ITEM_TO_COMMODITY.set(item, commodityId as MarketCommodityId);
  }
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function valueChangePercent(values: number[], days = 7): number {
  const current = values[values.length - 1];
  const past = values[values.length - 1 - days] ?? values[0];
  if (current === undefined || past === undefined || past === 0) return 0;
  return ((current - past) / past) * 100;
}

export function parsePriceCatcherCsv(
  csv: string,
  wanted: ReadonlySet<number> = PRICECATCHER_WANTED_ITEMS,
): PriceCatcherRow[] {
  const rows: PriceCatcherRow[] = [];
  const lines = csv.split("\n");

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;

    const [date, , itemCodeRaw, priceRaw] = line.split(",");
    if (!date || !itemCodeRaw || priceRaw === undefined) continue;

    const itemCode = Number(itemCodeRaw);
    if (!wanted.has(itemCode)) continue;

    const priceMyr = Number(priceRaw);
    if (!Number.isFinite(priceMyr) || priceMyr <= 0) continue;

    rows.push({ date, itemCode, priceMyr });
  }

  return rows;
}

export function aggregateTrends(
  rows: PriceCatcherRow[],
  windowDays = 30,
): Partial<Record<MarketCommodityId, MarketTrend>> {
  const byCommodity = new Map<MarketCommodityId, Map<string, number[]>>();

  for (const row of rows) {
    const commodityId = ITEM_TO_COMMODITY.get(row.itemCode);
    if (!commodityId) continue;

    let byDate = byCommodity.get(commodityId);
    if (!byDate) {
      byDate = new Map();
      byCommodity.set(commodityId, byDate);
    }
    const prices = byDate.get(row.date);
    if (prices) {
      prices.push(row.priceMyr);
    } else {
      byDate.set(row.date, [row.priceMyr]);
    }
  }

  const trends: Partial<Record<MarketCommodityId, MarketTrend>> = {};

  for (const [commodityId, byDate] of byCommodity) {
    const dates = [...byDate.keys()].sort().slice(-windowDays);
    const values = dates.map((date) => {
      const price = median(byDate.get(date) ?? []);
      return Math.round(price * 100) / 100;
    });
    if (values.length === 0) continue;

    trends[commodityId] = {
      start: dates[0],
      end: dates[dates.length - 1],
      dates,
      values,
    };
  }

  return trends;
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function seedTrend(commodity: SeedCommodity): MarketTrend {
  const values = commodity.trendMyr;
  const dates = values.map((_, index) => addDays(commodity.trendStart, index));
  return {
    start: dates[0] ?? commodity.trendStart,
    end: dates[dates.length - 1] ?? commodity.trendStart,
    dates,
    values,
  };
}

export function buildSnapshot(
  pricecatcher: Partial<Record<MarketCommodityId, MarketTrend>>,
  fetchedAt: string,
  seed: readonly SeedCommodity[],
): MarketSnapshot {
  const quotes = {} as Record<MarketCommodityId, MarketQuote>;
  const trends = {} as Record<MarketCommodityId, MarketTrend>;
  let liveCount = 0;
  let observedAt = "";

  for (const commodity of seed) {
    const live = pricecatcher[commodity.id];
    if (live && live.values.length > 0) {
      liveCount += 1;
      trends[commodity.id] = live;
      quotes[commodity.id] = {
        priceMyr: live.values[live.values.length - 1],
        observedAt: live.end,
        source: "pricecatcher",
      };
    } else {
      const trend = seedTrend(commodity);
      trends[commodity.id] = trend;
      quotes[commodity.id] = {
        priceMyr: trend.values[trend.values.length - 1] ?? 0,
        observedAt: trend.end,
        source: "seed",
      };
    }

    if (quotes[commodity.id].observedAt > observedAt) {
      observedAt = quotes[commodity.id].observedAt;
    }
  }

  return { fetchedAt, observedAt, liveCount, quotes, trends };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSource(value: unknown): value is MarketSource {
  return value === "pricecatcher" || value === "seed";
}

function parseTrend(value: unknown): MarketTrend | null {
  if (!isRecord(value)) return null;
  const { start, end, dates, values } = value;
  if (typeof start !== "string" || typeof end !== "string") return null;
  if (!Array.isArray(dates) || dates.length === 0) return null;
  if (!dates.every((item) => typeof item === "string")) return null;
  if (!Array.isArray(values) || values.length !== dates.length) return null;
  if (
    !values.every(
      (item) => typeof item === "number" && Number.isFinite(item) && item >= 0,
    )
  ) {
    return null;
  }
  return { start, end, dates: dates as string[], values: values as number[] };
}

export function parseMarketSnapshot(raw: unknown): MarketSnapshot | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.fetchedAt !== "string") return null;
  if (typeof raw.observedAt !== "string") return null;
  if (typeof raw.liveCount !== "number") return null;
  if (!isRecord(raw.quotes) || !isRecord(raw.trends)) return null;

  const quotes = {} as Record<MarketCommodityId, MarketQuote>;
  const trends = {} as Record<MarketCommodityId, MarketTrend>;

  for (const commodityId of MARKET_COMMODITY_IDS) {
    const quote = raw.quotes[commodityId];
    if (!isRecord(quote)) return null;
    if (
      typeof quote.priceMyr !== "number" ||
      !Number.isFinite(quote.priceMyr) ||
      quote.priceMyr < 0
    ) {
      return null;
    }
    if (typeof quote.observedAt !== "string" || !isSource(quote.source)) {
      return null;
    }

    const trend = parseTrend(raw.trends[commodityId]);
    if (!trend) return null;

    quotes[commodityId] = {
      priceMyr: quote.priceMyr,
      observedAt: quote.observedAt,
      source: quote.source,
    };
    trends[commodityId] = trend;
  }

  return {
    fetchedAt: raw.fetchedAt,
    observedAt: raw.observedAt,
    liveCount: raw.liveCount,
    quotes,
    trends,
  };
}
