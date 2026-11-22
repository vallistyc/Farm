import test from "node:test";
import assert from "node:assert/strict";
import {
  assessMarket,
  calculatePricing,
  clamp,
  costPerUnitMyr,
  effectiveYieldKg,
  minimumSellingPriceMyr,
  recommendedPriceMyr,
  totalCostMyr,
} from "./pricing.ts";

test("totalCostMyr adds direct, labour, and hidden costs", () => {
  assert.equal(
    totalCostMyr({
      directCostsMyr: 200,
      labourCostsMyr: 150,
      hiddenCostsMyr: 100,
    }),
    450,
  );
});

test("totalCostMyr ignores negative and non-finite values", () => {
  assert.equal(
    totalCostMyr({
      directCostsMyr: -50,
      labourCostsMyr: Number.NaN,
      hiddenCostsMyr: 30,
    }),
    30,
  );
});

test("effectiveYieldKg applies loss percentage", () => {
  assert.equal(effectiveYieldKg(120, 10), 108);
  assert.equal(effectiveYieldKg(100, 0), 100);
  assert.equal(effectiveYieldKg(100, 100), 0);
});

test("loss percentage is clamped between 0 and 100", () => {
  assert.equal(effectiveYieldKg(100, -10), 100);
  assert.equal(effectiveYieldKg(100, 150), 0);
});

test("costPerUnitMyr divides total cost by saleable yield", () => {
  const perUnit = costPerUnitMyr(450, 120, 10);
  assert.ok(Math.abs(perUnit - 450 / 108) < 1e-9);
});

test("costPerUnitMyr returns 0 when there is no saleable yield", () => {
  assert.equal(costPerUnitMyr(450, 0, 10), 0);
  assert.equal(costPerUnitMyr(450, 120, 100), 0);
});

test("minimumSellingPriceMyr applies the margin", () => {
  assert.equal(minimumSellingPriceMyr(10, 10), 11);
  assert.equal(minimumSellingPriceMyr(10, 0), 10);
});

test("assessMarket uses the 10% safe margin boundary", () => {
  assert.equal(assessMarket(10, 11), "aman");
  assert.equal(assessMarket(10, 10.99), "tipis");
  assert.equal(assessMarket(10, 10), "tipis");
  assert.equal(assessMarket(10, 9.99), "rugi");
});

test("recommended price follows the market unless the crop is at a loss", () => {
  assert.equal(recommendedPriceMyr("aman", 12, 4), 12);
  assert.equal(recommendedPriceMyr("tipis", 12, 11), 12);
  assert.equal(recommendedPriceMyr("rugi", 5, 11), 11);
});

test("calculatePricing returns the full breakdown for a safe crop", () => {
  const result = calculatePricing({
    directCostsMyr: 200,
    labourCostsMyr: 150,
    hiddenCostsMyr: 100,
    yieldKg: 120,
    lossPercent: 10,
    marginPercent: 10,
    marketPriceMyr: 12.6,
  });

  assert.equal(result.totalCostMyr, 450);
  assert.equal(result.effectiveYieldKg, 108);
  assert.ok(Math.abs(result.costPerUnitMyr - 450 / 108) < 1e-9);
  assert.ok(Math.abs(result.minimumPriceMyr - (450 / 108) * 1.1) < 1e-9);
  assert.equal(result.status, "aman");
  assert.equal(result.recommendedPriceMyr, 12.6);
});

test("calculatePricing recommends the minimum price when the market is too low", () => {
  const result = calculatePricing({
    directCostsMyr: 1000,
    labourCostsMyr: 0,
    hiddenCostsMyr: 0,
    yieldKg: 100,
    lossPercent: 0,
    marginPercent: 10,
    marketPriceMyr: 5,
  });

  assert.equal(result.minimumPriceMyr, 11);
  assert.equal(result.status, "rugi");
  assert.equal(result.recommendedPriceMyr, 11);
});

test("clamp keeps values inside a range and rejects non-finite input", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(Number.NaN, 0, 10), 0);
});
