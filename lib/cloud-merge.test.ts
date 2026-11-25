import test from "node:test";
import assert from "node:assert/strict";
import {
  mergeFarmData,
  parseCropRows,
  parseFarmRows,
  toCropRows,
  toFarmRows,
} from "./cloud-merge.ts";
import type { Crop, Field } from "./farm.ts";

function field(overrides: Partial<Field> = {}): Field {
  return {
    id: "field-1",
    name: "Sawah Utama",
    sizeHa: 0.5,
    location: "Kedah",
    ...overrides,
  };
}

function crop(overrides: Partial<Crop> = {}): Crop {
  return {
    id: "crop-1",
    fieldId: "field-1",
    commodityId: "padi",
    plantingDate: "2026-01-01",
    harvestDate: "2026-02-01",
    yieldKg: 100,
    lossPercent: 10,
    marginPercent: 10,
    sellPriceMyr: null,
    sellQty: null,
    costs: {
      direct: [{ id: "d1", label: "Seed", amountMyr: 50 }],
      labour: [],
      hidden: { transport: 20 },
    },
    updatedAt: "2026-01-10T00:00:00.000Z",
    ...overrides,
  };
}

test("mergeFarmData unions fields, local wins on the same id", () => {
  const merged = mergeFarmData(
    { fields: [field()], crops: [] },
    {
      fields: [
        field({ name: "Remote name" }),
        field({ id: "field-2", name: "Kebun" }),
      ],
      crops: [],
    },
  );

  assert.deepEqual(
    merged.fields.map((item) => [item.id, item.name]),
    [
      ["field-1", "Sawah Utama"],
      ["field-2", "Kebun"],
    ],
  );
});

test("mergeFarmData keeps the newer crop and appends remote-only crops", () => {
  const merged = mergeFarmData(
    {
      fields: [field()],
      crops: [crop()],
    },
    {
      fields: [field()],
      crops: [
        crop({
          updatedAt: "2026-01-12T00:00:00.000Z",
          marginPercent: 25,
        }),
        crop({ id: "crop-2" }),
      ],
    },
  );

  assert.equal(merged.crops.length, 2);
  assert.equal(merged.crops[0].marginPercent, 25);
  assert.equal(merged.crops[1].id, "crop-2");
});

test("mergeFarmData keeps local crop when it is newer", () => {
  const merged = mergeFarmData(
    { fields: [field()], crops: [crop({ marginPercent: 30 })] },
    {
      fields: [field()],
      crops: [crop({ updatedAt: "2026-01-05T00:00:00.000Z" })],
    },
  );

  assert.equal(merged.crops[0].marginPercent, 30);
});

test("mergeFarmData treats missing sides as empty", () => {
  assert.deepEqual(mergeFarmData(undefined, undefined), {
    fields: [],
    crops: [],
  });
  assert.equal(mergeFarmData(undefined, { fields: [field()], crops: [] }).fields.length, 1);
  assert.equal(mergeFarmData({ fields: [field()], crops: [] }, undefined).fields.length, 1);
});

test("toFarmRows maps columns and owner", () => {
  const rows = toFarmRows("farmer-1", [field()], "2026-03-01T00:00:00.000Z");
  assert.deepEqual(rows, [
    {
      owner_id: "farmer-1",
      id: "field-1",
      name: "Sawah Utama",
      size_ha: 0.5,
      location: "Kedah",
      updated_at: "2026-03-01T00:00:00.000Z",
    },
  ]);
});

test("toCropRows maps crop costs and keeps updated_at", () => {
  const rows = toCropRows("farmer-1", [crop()]);
  assert.equal(rows[0].owner_id, "farmer-1");
  assert.equal(rows[0].farm_id, "field-1");
  assert.equal(rows[0].commodity_id, "padi");
  assert.equal(rows[0].yield_kg, 100);
  assert.deepEqual(rows[0].costs, crop().costs);
  assert.equal(rows[0].updated_at, "2026-01-10T00:00:00.000Z");
});

test("parseFarmRows skips invalid rows and coerces numbers", () => {
  const fields = parseFarmRows([
    { id: "field-1", name: "Sawah", size_ha: "0.75", location: "Kedah" },
    { id: "", name: "No id" },
    { id: "field-2" },
    null,
  ]);

  assert.deepEqual(fields, [
    { id: "field-1", name: "Sawah", sizeHa: 0.75, location: "Kedah" },
  ]);
});

test("parseCropRows keeps custom commodity ids but skips missing fields or empty commodity", () => {
  const crops = parseCropRows([
    {
      id: "crop-1",
      farm_id: "field-1",
      commodity_id: "padi",
      planting_date: "2026-01-01",
      harvest_date: "2026-02-01",
      yield_kg: "120",
      loss_percent: "10",
      margin_percent: "15",
      costs: { direct: [], labour: [], hidden: { transport: 40, bogus: 99 } },
      updated_at: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "crop-2",
      farm_id: "field-1",
      commodity_id: "terong",
      planting_date: "2026-01-01",
      harvest_date: "2026-02-01",
    },
    {
      id: "crop-3",
      farm_id: "field-1",
      commodity_id: "padi",
      planting_date: "2026-01-01",
    },
    {
      id: "crop-4",
      farm_id: "field-1",
      commodity_id: "   ",
      planting_date: "2026-01-01",
      harvest_date: "2026-02-01",
    },
  ]);

  assert.equal(crops.length, 2);
  assert.equal(crops[0].yieldKg, 120);
  assert.equal(crops[0].marginPercent, 15);
  assert.deepEqual(crops[0].costs.hidden, { transport: 40 });
  assert.equal(crops[1].commodityId, "terong");
});

test("parseCropRows drops malformed cost lines but keeps valid ones", () => {
  const crops = parseCropRows([
    {
      id: "crop-1",
      farm_id: "field-1",
      commodity_id: "padi",
      planting_date: "2026-01-01",
      harvest_date: "2026-02-01",
      costs: {
        direct: [{ id: "d1", label: "Seed", amountMyr: 50 }, { amountMyr: 10 }],
        labour: "nope",
        hidden: [],
      },
    },
  ]);

  assert.deepEqual(crops[0].costs.direct, [
    { id: "d1", label: "Seed", amountMyr: 50 },
  ]);
  assert.deepEqual(crops[0].costs.labour, []);
  assert.deepEqual(crops[0].costs.hidden, {});
});
