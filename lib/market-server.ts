import { COMMODITIES } from "@/lib/commodities";
import {
  aggregateTrends,
  buildSnapshot,
  MARKET_COMMODITY_IDS,
  parsePriceCatcherCsv,
  type MarketCommodityId,
  type MarketSnapshot,
  type MarketTrend,
  type SeedCommodity,
} from "@/lib/market";

const PRICECATCHER_BASE = "https://storage.data.gov.my/pricecatcher";
const HISTORY_DAYS = 40;
const STALE_AFTER_DAYS = 3;
const CACHE_TTL_MS = 5 * 60 * 1000;
const DOWNLOAD_TIMEOUT_MS = 45 * 1000;

const SEED: SeedCommodity[] = COMMODITIES.map(
  ({ id, trendStart, trendMyr }) => ({ id, trendStart, trendMyr }),
);

const VALID_IDS = new Set<string>(MARKET_COMMODITY_IDS);

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function malaysiaDate(offsetDays = 0): string {
  const shifted = new Date(Date.now() + 8 * 60 * 60 * 1000);
  shifted.setUTCDate(shifted.getUTCDate() + offsetDays);
  return shifted.toISOString().slice(0, 10);
}

function malaysiaMonth(): string {
  return malaysiaDate().slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function fetchMonthCsv(month: string): Promise<string | null> {
  const response = await fetch(
    `${PRICECATCHER_BASE}/pricecatcher_${month}.csv`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`PriceCatcher ${month} failed with ${response.status}`);
  }
  return response.text();
}

export async function loadLiveTrends(
  windowDays = 30,
): Promise<Partial<Record<MarketCommodityId, MarketTrend>>> {
  const current = malaysiaMonth();
  const months = [shiftMonth(current, -1), current];
  const files = await Promise.all(months.map((month) => fetchMonthCsv(month)));
  const rows = files.flatMap((csv) =>
    csv ? parsePriceCatcherCsv(csv) : [],
  );

  if (rows.length === 0) {
    throw new Error("PriceCatcher returned no matching rows");
  }

  return aggregateTrends(rows, windowDays);
}

type HistoryRow = {
  commodity_id: string;
  observed_on: string;
  price_myr: number;
};

function rowsToTrends(
  rows: HistoryRow[],
): Partial<Record<MarketCommodityId, MarketTrend>> {
  const byCommodity = new Map<
    MarketCommodityId,
    { dates: string[]; values: number[] }
  >();

  for (const row of rows) {
    if (!VALID_IDS.has(row.commodity_id)) continue;
    if (!Number.isFinite(row.price_myr) || row.price_myr <= 0) continue;

    const commodityId = row.commodity_id as MarketCommodityId;
    let entry = byCommodity.get(commodityId);
    if (!entry) {
      entry = { dates: [], values: [] };
      byCommodity.set(commodityId, entry);
    }
    if (entry.dates[entry.dates.length - 1] === row.observed_on) continue;
    entry.dates.push(row.observed_on);
    entry.values.push(row.price_myr);
  }

  const trends: Partial<Record<MarketCommodityId, MarketTrend>> = {};
  for (const [commodityId, entry] of byCommodity) {
    if (entry.dates.length === 0) continue;
    trends[commodityId] = {
      start: entry.dates[0],
      end: entry.dates[entry.dates.length - 1],
      dates: entry.dates,
      values: entry.values,
    };
  }
  return trends;
}

function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && key ? { url, key } : null;
}

export async function readMarketHistory(): Promise<{
  trends: Partial<Record<MarketCommodityId, MarketTrend>>;
  latest: string;
} | null> {
  const config = supabaseConfig();
  if (!config) return null;

  const since = malaysiaDate(-HISTORY_DAYS);
  const query = new URLSearchParams({
    select: "commodity_id,observed_on,price_myr",
    source: "eq.pricecatcher",
    observed_on: `gte.${since}`,
    order: "observed_on.asc",
  });

  const response = await fetch(
    `${config.url}/rest/v1/market_prices?${query.toString()}`,
    {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );

  if (!response.ok) return null;

  const body: unknown = await response.json();
  if (!Array.isArray(body) || body.length === 0) return null;

  const rows = body.filter(
    (row): row is HistoryRow =>
      typeof row === "object" &&
      row !== null &&
      typeof (row as HistoryRow).commodity_id === "string" &&
      typeof (row as HistoryRow).observed_on === "string" &&
      typeof (row as HistoryRow).price_myr === "number",
  );

  const trends = rowsToTrends(rows);
  const latest = rows.reduce(
    (max, row) => (row.observed_on > max ? row.observed_on : max),
    "",
  );

  return latest ? { trends, latest } : null;
}

export async function saveMarketTrends(
  trends: Partial<Record<MarketCommodityId, MarketTrend>>,
): Promise<number> {
  const config = supabaseConfig();
  if (!config) return 0;

  const rows = (
    Object.entries(trends) as [MarketCommodityId, MarketTrend][]
  ).flatMap(([commodityId, trend]) =>
    trend.dates.flatMap((date, index) => {
      const price = trend.values[index];
      if (!Number.isFinite(price) || price <= 0) return [];
      return [
        {
          commodity_id: commodityId,
          observed_on: date,
          price_myr: price,
          source: "pricecatcher",
        },
      ];
    }),
  );

  if (rows.length === 0) return 0;

  const response = await fetch(
    `${config.url}/rest/v1/market_prices?on_conflict=${encodeURIComponent(
      "commodity_id,observed_on",
    )}`,
    {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
      signal: AbortSignal.timeout(20000),
    },
  );

  if (!response.ok) {
    console.error("Market history write failed", response.status);
    return 0;
  }
  return rows.length;
}

let memory: { at: number; snapshot: MarketSnapshot } | null = null;

function snapshotFrom(
  trends: Partial<Record<MarketCommodityId, MarketTrend>>,
  fetchedAt: string,
): MarketSnapshot {
  return buildSnapshot(trends, fetchedAt, SEED);
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const now = Date.now();
  if (memory && now - memory.at < CACHE_TTL_MS) {
    return memory.snapshot;
  }

  const history = await readMarketHistory().catch(() => null);
  const historyIsFresh =
    history !== null && history.latest >= addDays(malaysiaDate(), -STALE_AFTER_DAYS);

  if (history && historyIsFresh) {
    const snapshot = snapshotFrom(history.trends, new Date(now).toISOString());
    memory = { at: now, snapshot };
    return snapshot;
  }

  try {
    const trends = await loadLiveTrends();
    const snapshot = snapshotFrom(trends, new Date(now).toISOString());
    memory = { at: now, snapshot };
    return snapshot;
  } catch (error) {
    console.error(
      "PriceCatcher unavailable, using fallback",
      error instanceof Error ? error.message : "unknown",
    );
    const snapshot = snapshotFrom(
      history?.trends ?? {},
      new Date(now).toISOString(),
    );
    memory = { at: now, snapshot };
    return snapshot;
  }
}

export async function refreshMarketHistory(): Promise<{
  saved: number;
  snapshot: MarketSnapshot;
}> {
  const trends = await loadLiveTrends();
  const snapshot = snapshotFrom(trends, new Date().toISOString());
  const saved = await saveMarketTrends(trends);
  memory = { at: Date.now(), snapshot };
  return { saved, snapshot };
}

export async function backfillMonth(month: string): Promise<number> {
  const csv = await fetchMonthCsv(month);
  if (!csv) return 0;
  const trends = aggregateTrends(parsePriceCatcherCsv(csv), 31);
  return saveMarketTrends(trends);
}
