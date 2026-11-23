import test from "node:test";
import assert from "node:assert/strict";
import type { MarketSnapshot } from "./market.ts";
import { countryCurrency, isMarketCountry, resolveMarket } from "./market-context.ts";

const snapshot = {
  quotes: {
    padi: { priceMyr: 2.5, observedAt: "2026-11-21", source: "seed" },
    chilli: { priceMyr: 12, observedAt: "2026-11-21", source: "pricecatcher" },
    banana: { priceMyr: 3.5, observedAt: "2026-11-21", source: "seed" },
  },
  indonesia: {
    quotes: {
      padi: { priceIdr: 7_300_000, observedAt: "2026-11-21", source: "bapanas" },
    },
  },
} as unknown as MarketSnapshot;

test("market country guards and currency mapping", () => {
  assert.equal(isMarketCountry("MY"), true);
  assert.equal(isMarketCountry("ID"), true);
  assert.equal(isMarketCountry("SG"), false);
  assert.equal(countryCurrency("MY"), "MYR");
  assert.equal(countryCurrency("ID"), "IDR");
});

test("Malaysia resolves PriceCatcher and seed quotes", () => {
  const live = resolveMarket("MY", "chilli", snapshot, 3650);
  assert.equal(live?.priceMyr, 12);
  assert.equal(live?.source, "pricecatcher");
  assert.equal(live?.isLive, true);

  const seed = resolveMarket("MY", "padi", snapshot, 3650);
  assert.equal(seed?.source, "seed");
  assert.equal(seed?.isLive, false);
});

test("Indonesia converts Bapanas rupiah to the MYR base", () => {
  const market = resolveMarket("ID", "padi", snapshot, 3650);
  assert.ok(market);
  assert.equal(market.nativePrice, 7_300_000);
  assert.equal(market.nativeCurrency, "IDR");
  assert.ok(Math.abs(market.priceMyr - 2000) < 1e-9);
  assert.equal(market.source, "bapanas");
});

test("a market without a quote for the commodity resolves to null", () => {
  assert.equal(resolveMarket("ID", "spinach", snapshot, 3650), null);
  assert.equal(resolveMarket("ID", "chilli", snapshot, 3650), null);
  assert.equal(resolveMarket("MY", "spinach", snapshot, 3650), null);
});
