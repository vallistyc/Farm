import test from "node:test";
import assert from "node:assert/strict";
import {
  IDR_PER_MYR,
  convertToMyr,
  formatAmount,
  fromMyr,
  roundNative,
} from "./currency.ts";

const plain = (value: string) => value.replace(/\u00a0/g, " ");

test("IDR conversion round-trips a cost without drift", () => {
  const entered = 500_000;
  const storedMyr = convertToMyr(entered, "IDR");
  assert.ok(Math.abs(storedMyr - entered / 3650) < 1e-9);
  assert.equal(fromMyr(storedMyr, "IDR"), entered);
});

test("amounts are rounded for input by currency", () => {
  assert.equal(roundNative(123.456, "MYR"), 123.46);
  assert.equal(roundNative(0.2345, "SGD"), 0.23);
  assert.equal(roundNative(136.4, "IDR"), 136);
});

test("fromMyr uses the published rate", () => {
  assert.equal(fromMyr(1, "IDR"), IDR_PER_MYR);
  assert.equal(fromMyr(2, "MYR"), 2);
});

test("formatAmount does not convert the value again", () => {
  assert.equal(plain(formatAmount(500_000, "IDR", "id-ID")), "Rp 500.000");
  assert.equal(plain(formatAmount(12.5, "MYR", "en-MY")), "RM 12.50");
});
