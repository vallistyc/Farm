import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateTrends,
  buildIndonesiaSnapshot,
  buildSnapshot,
  median,
  parseBapanasInformasi,
  parseMarketSnapshot,
  parsePriceCatcherCsv,
  valueChangePercent,
  type SeedCommodity,
} from "./market.ts";

const SEED: SeedCommodity[] = [
  { id: "padi", trendStart: "2026-10-23", trendMyr: [2.48, 2.5, 2.52] },
  { id: "maize", trendStart: "2026-10-23", trendMyr: [1.38, 1.4, 1.39] },
  { id: "spinach", trendStart: "2026-10-23", trendMyr: [3.9, 3.95, 4.05] },
  { id: "chilli", trendStart: "2026-10-23", trendMyr: [11.2, 11.5, 11.8] },
  { id: "banana", trendStart: "2026-10-23", trendMyr: [3.5, 3.55, 3.6] },
];

const SEED_SNAPSHOT = buildSnapshot({}, "", SEED);

test("median handles odd, even, and empty input", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([]), 0);
});

test("valueChangePercent compares against the requested day offset", () => {
  assert.equal(valueChangePercent([10, 11, 12], 2), 20);
  assert.equal(valueChangePercent([10], 7), 0);
  assert.equal(valueChangePercent([0, 0], 1), 0);
});

test("parsePriceCatcherCsv keeps only wanted item codes", () => {
  const csv = [
    "date,premise_code,item_code,price",
    "2026-11-20,2,93,12.0",
    "2026-11-20,2,1,11.0",
    "2026-11-20,3,1556,4.5",
    "2026-11-20,3,93,13.0",
    "2026-11-20,4,93,0",
    "2026-11-20,4,93,abc",
    "",
  ].join("\n");

  const rows = parsePriceCatcherCsv(csv, new Set([93, 1556]));
  assert.deepEqual(rows, [
    { date: "2026-11-20", itemCode: 93, priceMyr: 12 },
    { date: "2026-11-20", itemCode: 1556, priceMyr: 4.5 },
    { date: "2026-11-20", itemCode: 93, priceMyr: 13 },
  ]);
});

test("aggregateTrends takes a daily median across premises", () => {
  const rows = [
    { date: "2026-11-19", itemCode: 93, priceMyr: 10 },
    { date: "2026-11-20", itemCode: 93, priceMyr: 12 },
    { date: "2026-11-20", itemCode: 94, priceMyr: 14 },
    { date: "2026-11-20", itemCode: 94, priceMyr: 16 },
    { date: "2026-11-21", itemCode: 18, priceMyr: 3.8 },
  ];

  const trends = aggregateTrends(rows);
  assert.deepEqual(trends.chilli, {
    start: "2026-11-19",
    end: "2026-11-20",
    dates: ["2026-11-19", "2026-11-20"],
    values: [10, 14],
  });
  assert.deepEqual(trends.banana, {
    start: "2026-11-21",
    end: "2026-11-21",
    dates: ["2026-11-21"],
    values: [3.8],
  });
});

test("aggregateTrends keeps the requested window", () => {
  const rows = [1, 2, 3, 4].map((day) => ({
    date: `2026-11-0${day}`,
    itemCode: 93,
    priceMyr: day,
  }));

  const trend = aggregateTrends(rows, 2).chilli;
  assert.deepEqual(trend?.values, [3, 4]);
  assert.equal(trend?.start, "2026-11-03");
});

test("buildSnapshot uses live data where available and seed elsewhere", () => {
  const snapshot = buildSnapshot(
    {
      chilli: {
        start: "2026-11-20",
        end: "2026-11-21",
        dates: ["2026-11-20", "2026-11-21"],
        values: [12.5, 12.8],
      },
    },
    "2026-11-22T00:00:00.000Z",
    SEED,
  );

  assert.equal(snapshot.liveCount, 1);
  assert.equal(snapshot.quotes.chilli.source, "pricecatcher");
  assert.equal(snapshot.quotes.chilli.priceMyr, 12.8);
  assert.equal(snapshot.quotes.chilli.observedAt, "2026-11-21");
  assert.equal(snapshot.quotes.padi.source, "seed");
  assert.equal(
    snapshot.quotes.padi.priceMyr,
    SEED_SNAPSHOT.quotes.padi.priceMyr,
  );
  assert.equal(snapshot.observedAt, "2026-11-21");
});

test("parseMarketSnapshot round-trips a valid snapshot", () => {
  const parsed = parseMarketSnapshot(SEED_SNAPSHOT);
  assert.ok(parsed);
  assert.equal(parsed.quotes.banana.priceMyr, SEED_SNAPSHOT.quotes.banana.priceMyr);
  assert.equal(parsed.trends.banana.values.length, 3);
});

test("parseMarketSnapshot rejects malformed payloads", () => {
  assert.equal(parseMarketSnapshot(null), null);
  assert.equal(parseMarketSnapshot({}), null);

  const broken = structuredClone(SEED_SNAPSHOT);
  broken.quotes.chilli.priceMyr = Number.NaN;
  assert.equal(parseMarketSnapshot(broken), null);

  const missing = structuredClone(SEED_SNAPSHOT) as unknown as Record<
    string,
    unknown
  >;
  delete (missing.quotes as Record<string, unknown>).maize;
  assert.equal(parseMarketSnapshot(missing), null);
});

const BAPANAS = {
  status: "success",
  data: [
    {
      id: 2,
      name: "GKP Tingkat Petani",
      today: 7292,
      yesterday: 7289,
      yesterday_date: "21-11-2026",
    },
    {
      id: 7,
      name: "Jagung Pipilan Kering",
      today: 6109,
      yesterday: 6144,
      yesterday_date: "21-11-2026",
    },
    {
      id: 10,
      name: "Cabai Merah Keriting",
      today: 52575,
      yesterday: 52718,
      yesterday_date: "21-11-2026",
    },
    { id: 999, name: "Not tracked", today: 1234, yesterday: 1200 },
  ],
};

test("parseBapanasInformasi maps producer items and dates", () => {
  const day = parseBapanasInformasi(BAPANAS, "2026-11-22");
  assert.ok(day);
  assert.equal(day.observedAt, "2026-11-22");
  assert.equal(day.previousDate, "2026-11-21");
  assert.deepEqual(day.quotes, { padi: 7292, maize: 6109, chilli: 52575 });
  assert.deepEqual(day.previous, { padi: 7289, maize: 6144, chilli: 52718 });
});

test("parseBapanasInformasi rejects days without prices", () => {
  assert.equal(parseBapanasInformasi({ status: "error" }, "2026-11-22"), null);
  assert.equal(
    parseBapanasInformasi({ status: "success", data: [] }, "2026-11-22"),
    null,
  );
  assert.equal(
    parseBapanasInformasi(
      {
        status: "success",
        data: [
          {
            id: 2,
            today: 0,
            yesterday: 7289,
            yesterday_date: "21-11-2026",
          },
        ],
      },
      "2026-11-22",
    ),
    null,
  );
});

test("buildIndonesiaSnapshot seeds a two-point trend from today and yesterday", () => {
  const day = parseBapanasInformasi(BAPANAS, "2026-11-22");
  assert.ok(day);
  const snapshot = buildIndonesiaSnapshot({}, day, "2026-11-22T00:00:00.000Z");

  assert.equal(snapshot.liveCount, 3);
  assert.equal(snapshot.observedAt, "2026-11-22");
  assert.equal(snapshot.quotes.padi?.priceIdr, 7292);
  assert.deepEqual(snapshot.trends.padi, {
    start: "2026-11-21",
    end: "2026-11-22",
    dates: ["2026-11-21", "2026-11-22"],
    values: [7289, 7292],
  });
});

test("buildIndonesiaSnapshot merges live data into stored history", () => {
  const day = parseBapanasInformasi(BAPANAS, "2026-11-22");
  assert.ok(day);
  const history = {
    chilli: {
      start: "2026-11-20",
      end: "2026-11-21",
      dates: ["2026-11-20", "2026-11-21"],
      values: [50000, 52718],
    },
  };

  const snapshot = buildIndonesiaSnapshot(
    history,
    day,
    "2026-11-22T00:00:00.000Z",
  );

  assert.deepEqual(snapshot.trends.chilli?.values, [50000, 52718, 52575]);
  assert.equal(snapshot.trends.chilli?.end, "2026-11-22");
  assert.equal(snapshot.trends.padi?.values.length, 2);
});

test("buildIndonesiaSnapshot replaces a same-day quote", () => {
  const day = parseBapanasInformasi(BAPANAS, "2026-11-22");
  assert.ok(day);
  const history = {
    padi: {
      start: "2026-11-21",
      end: "2026-11-22",
      dates: ["2026-11-21", "2026-11-22"],
      values: [7289, 7000],
    },
  };

  const snapshot = buildIndonesiaSnapshot(
    history,
    day,
    "2026-11-22T00:00:00.000Z",
  );

  assert.deepEqual(snapshot.trends.padi?.values, [7289, 7292]);
});

test("parseMarketSnapshot accepts old caches without Indonesia data", () => {
  const legacy = structuredClone(SEED_SNAPSHOT) as unknown as Record<
    string,
    unknown
  >;
  delete legacy.indonesia;

  const parsed = parseMarketSnapshot(legacy);
  assert.ok(parsed);
  assert.equal(parsed.indonesia.liveCount, 0);
  assert.equal(parsed.indonesia.observedAt, "");
});

test("parseMarketSnapshot round-trips Indonesia data", () => {
  const day = parseBapanasInformasi(BAPANAS, "2026-11-22");
  assert.ok(day);
  const indonesia = buildIndonesiaSnapshot(
    {},
    day,
    "2026-11-22T00:00:00.000Z",
  );

  const parsed = parseMarketSnapshot({ ...SEED_SNAPSHOT, indonesia });
  assert.ok(parsed);
  assert.equal(parsed.indonesia.quotes.chilli?.priceIdr, 52575);
  assert.equal(parsed.indonesia.trends.padi?.values.length, 2);
});
