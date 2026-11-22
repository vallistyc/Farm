import { COMMODITIES } from "@/lib/commodities";
import {
  aggregateTrends,
  buildIndonesiaSnapshot,
  buildSnapshot,
  INDONESIA_COMMODITY_IDS,
  MARKET_COMMODITY_IDS,
  parseBapanasInformasi,
  parsePriceCatcherCsv,
  type BapanasDay,
  type IndonesiaCommodityId,
  type IndonesiaMarketSnapshot,
  type MarketCommodityId,
  type MarketSnapshot,
  type MarketTrend,
  type SeedCommodity,
} from "@/lib/market";

const PRICECATCHER_BASE = "https://storage.data.gov.my/pricecatcher";
const BAPANAS_BASE = "https://api-panelhargav2.badanpangan.go.id/api";
const HISTORY_DAYS = 40;
const STALE_AFTER_DAYS = 3;
const CACHE_TTL_MS = 5 * 60 * 1000;
const INDONESIA_CACHE_TTL_MS = 10 * 60 * 1000;
const DOWNLOAD_TIMEOUT_MS = 45 * 1000;
const BAPANAS_TIMEOUT_MS = 20 * 1000;

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

function jakartaDate(offsetDays = 0): string {
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000);
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

type IndonesiaHistoryRow = {
  commodity_id: string;
  observed_on: string;
  price_idr: number;
};

function rowsToIndonesiaTrends(
  rows: IndonesiaHistoryRow[],
): Partial<Record<IndonesiaCommodityId, MarketTrend>> {
  const validIds = new Set<string>(INDONESIA_COMMODITY_IDS);
  const byCommodity = new Map<
    IndonesiaCommodityId,
    { dates: string[]; values: number[] }
  >();

  for (const row of rows) {
    if (!validIds.has(row.commodity_id)) continue;
    if (!Number.isFinite(row.price_idr) || row.price_idr <= 0) continue;

    const commodityId = row.commodity_id as IndonesiaCommodityId;
    let entry = byCommodity.get(commodityId);
    if (!entry) {
      entry = { dates: [], values: [] };
      byCommodity.set(commodityId, entry);
    }
    if (entry.dates[entry.dates.length - 1] === row.observed_on) continue;
    entry.dates.push(row.observed_on);
    entry.values.push(row.price_idr);
  }

  const trends: Partial<Record<IndonesiaCommodityId, MarketTrend>> = {};
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

export async function readIndonesiaHistory(): Promise<{
  trends: Partial<Record<IndonesiaCommodityId, MarketTrend>>;
  latest: string;
} | null> {
  const config = supabaseConfig();
  if (!config) return null;

  const since = jakartaDate(-HISTORY_DAYS);
  const query = new URLSearchParams({
    select: "commodity_id,observed_on,price_idr",
    source: "eq.bapanas",
    observed_on: `gte.${since}`,
    order: "observed_on.asc",
  });

  const response = await fetch(
    `${config.url}/rest/v1/market_prices_indonesia?${query.toString()}`,
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
    (row): row is IndonesiaHistoryRow =>
      typeof row === "object" &&
      row !== null &&
      typeof (row as IndonesiaHistoryRow).commodity_id === "string" &&
      typeof (row as IndonesiaHistoryRow).observed_on === "string" &&
      typeof (row as IndonesiaHistoryRow).price_idr === "number",
  );

  const trends = rowsToIndonesiaTrends(rows);
  const latest = rows.reduce(
    (max, row) => (row.observed_on > max ? row.observed_on : max),
    "",
  );

  return latest ? { trends, latest } : null;
}

export async function saveIndonesiaTrends(
  trends: Partial<Record<IndonesiaCommodityId, MarketTrend>>,
): Promise<number> {
  const config = supabaseConfig();
  if (!config) return 0;

  const rows = (
    Object.entries(trends) as [IndonesiaCommodityId, MarketTrend][]
  ).flatMap(([commodityId, trend]) =>
    trend.dates.flatMap((date, index) => {
      const price = trend.values[index];
      if (!Number.isFinite(price) || price <= 0) return [];
      return [
        {
          commodity_id: commodityId,
          observed_on: date,
          price_idr: price,
          source: "bapanas",
        },
      ];
    }),
  );

  if (rows.length === 0) return 0;

  const response = await fetch(
    `${config.url}/rest/v1/market_prices_indonesia?on_conflict=${encodeURIComponent(
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
    console.error("Indonesia market history write failed", response.status);
    return 0;
  }
  return rows.length;
}

async function fetchBapanasDay(date: string): Promise<BapanasDay | null> {
  const query = new URLSearchParams({
    level_harga_id: "1",
    date,
  });
  const response = await fetch(
    `${BAPANAS_BASE}/front/harga-pangan-informasi?${query.toString()}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "FarmPriceRadar/1.0 (competition prototype; github.com/vallistyc/Farm)",
      },
      signal: AbortSignal.timeout(BAPANAS_TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    throw new Error(`Bapanas ${date} failed with ${response.status}`);
  }
  return parseBapanasInformasi(await response.json(), date);
}

async function fetchBapanasLatest(): Promise<BapanasDay | null> {
  for (const offset of [0, -1, -2]) {
    const day = await fetchBapanasDay(jakartaDate(offset));
    if (day) return day;
  }
  return null;
}

let indonesiaMemory: {
  at: number;
  snapshot: IndonesiaMarketSnapshot;
} | null = null;

export async function getIndonesiaSnapshot(): Promise<IndonesiaMarketSnapshot> {
  const now = Date.now();
  if (
    indonesiaMemory &&
    now - indonesiaMemory.at < INDONESIA_CACHE_TTL_MS
  ) {
    return indonesiaMemory.snapshot;
  }

  const history = await readIndonesiaHistory().catch(() => null);
  let live: BapanasDay | null = null;

  try {
    live = await fetchBapanasLatest();
  } catch (error) {
    console.error(
      "Bapanas unavailable, using stored history",
      error instanceof Error ? error.message : "unknown",
    );
  }

  const snapshot = buildIndonesiaSnapshot(
    history?.trends ?? {},
    live,
    new Date(now).toISOString(),
  );
  indonesiaMemory = { at: now, snapshot };
  return snapshot;
}

export async function refreshIndonesiaHistory(): Promise<{
  saved: number;
  snapshot: IndonesiaMarketSnapshot;
}> {
  const live = await fetchBapanasLatest();
  if (!live) throw new Error("Bapanas returned no rows");

  const trends = buildIndonesiaSnapshot({}, live, new Date().toISOString())
    .trends;
  const saved = await saveIndonesiaTrends(trends);
  const snapshot = buildIndonesiaSnapshot(
    trends,
    live,
    new Date().toISOString(),
  );
  indonesiaMemory = { at: Date.now(), snapshot };
  return { saved, snapshot };
}

export async function backfillIndonesia(days = 30): Promise<number> {
  const latest = await fetchBapanasLatest();
  if (!latest) return 0;

  const end = new Date(`${latest.observedAt}T00:00:00Z`);
  const trends: Partial<Record<IndonesiaCommodityId, MarketTrend>> = {};

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - offset);
    const dateString = date.toISOString().slice(0, 10);

    const day =
      offset === 0
        ? latest
        : await fetchBapanasDay(dateString).catch(() => null);
    if (!day) continue;

    for (const [commodityId, value] of Object.entries(day.quotes) as [
      IndonesiaCommodityId,
      number,
    ][]) {
      if (!Number.isFinite(value) || value <= 0) continue;

      let trend = trends[commodityId];
      if (!trend) {
        trend = {
          start: dateString,
          end: dateString,
          dates: [],
          values: [],
        };
        trends[commodityId] = trend;
      }
      trend.dates.push(dateString);
      trend.values.push(value);
    }
  }

  for (const trend of Object.values(trends)) {
    if (!trend) continue;
    trend.dates.reverse();
    trend.values.reverse();
    trend.start = trend.dates[0] ?? trend.start;
    trend.end = trend.dates[trend.dates.length - 1] ?? trend.end;
  }

  indonesiaMemory = null;
  return saveIndonesiaTrends(trends);
}

let memory: { at: number; snapshot: MarketSnapshot } | null = null;

function snapshotFrom(
  trends: Partial<Record<MarketCommodityId, MarketTrend>>,
  fetchedAt: string,
): MarketSnapshot {
  return buildSnapshot(trends, fetchedAt, SEED);
}

async function getMalaysiaSnapshot(): Promise<MarketSnapshot> {
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

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const [malaysia, indonesia] = await Promise.all([
    getMalaysiaSnapshot(),
    getIndonesiaSnapshot(),
  ]);
  return { ...malaysia, indonesia };
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
