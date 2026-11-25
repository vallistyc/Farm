import type { CommodityId } from "@/lib/commodities";
import type {
  CostLine,
  Crop,
  CropCosts,
  FarmData,
  Field,
  HiddenCostKey,
} from "@/lib/farm";

// Commodity ids are open-ended (built-ins plus farmer-added custom names), so
// any non-empty string is a valid id. Custom commodities simply have no market
// data and show "Data Komoditas Tidak Tersedia" in the comparison.

const HIDDEN_COST_KEYS: Record<HiddenCostKey, true> = {
  transport: true,
  packaging: true,
  postHarvestLoss: true,
  commission: true,
  storage: true,
  irrigation: true,
  equipment: true,
  loanInterest: true,
  certification: true,
  marketFee: true,
  familyLabour: true,
};

export type FarmRow = {
  owner_id: string;
  id: string;
  name: string;
  size_ha: number;
  location: string;
  updated_at: string;
};

export type CropRow = {
  owner_id: string;
  id: string;
  farm_id: string;
  commodity_id: CommodityId;
  planting_date: string;
  harvest_date: string;
  yield_kg: number;
  loss_percent: number;
  margin_percent: number | null;
  costs: CropCosts;
  updated_at: string;
};

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function toText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isCommodityId(value: unknown): value is CommodityId {
  return typeof value === "string" && value.trim().length > 0;
}

function parseCostLines(raw: unknown): CostLine[] {
  if (!Array.isArray(raw)) return [];
  const lines: CostLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const line = item as Record<string, unknown>;
    const label = toText(line.label);
    if (!label) continue;
    const parsed: CostLine = {
      id: toText(line.id) ?? `line-${lines.length + 1}`,
      label,
      amountMyr: toNumber(line.amountMyr, 0),
    };
    const qty = toNumber(line.qty, Number.NaN);
    if (Number.isFinite(qty) && qty > 0) {
      parsed.qty = qty;
      const unit = toText(line.unit);
      if (unit) parsed.unit = unit;
    }
    lines.push(parsed);
  }
  return lines;
}

function parseHidden(raw: unknown): Partial<Record<HiddenCostKey, number>> {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const hidden: Partial<Record<HiddenCostKey, number>> = {};
  for (const key of Object.keys(HIDDEN_COST_KEYS) as HiddenCostKey[]) {
    const value = toNumber(source[key], Number.NaN);
    if (Number.isFinite(value)) hidden[key] = value;
  }
  return hidden;
}

function parseCosts(raw: unknown): CropCosts {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    direct: parseCostLines(source.direct),
    labour: parseCostLines(source.labour),
    hidden: parseHidden(source.hidden),
  };
}

export function parseFarmRows(rows: unknown[]): Field[] {
  const fields: Field[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = toText(row.id);
    const name = toText(row.name);
    if (!id || !name) continue;
    fields.push({
      id,
      name,
      sizeHa: Math.max(0, toNumber(row.size_ha, 0)),
      location: toText(row.location) ?? "",
    });
  }
  return fields;
}

export function parseCropRows(rows: unknown[]): Crop[] {
  const crops: Crop[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = toText(row.id);
    const fieldId = toText(row.farm_id);
    const plantingDate = toText(row.planting_date);
    const harvestDate = toText(row.harvest_date);
    if (
      !id ||
      !fieldId ||
      !plantingDate ||
      !harvestDate ||
      !isCommodityId(row.commodity_id)
    ) {
      continue;
    }
    crops.push({
      id,
      fieldId,
      commodityId: row.commodity_id,
      plantingDate,
      harvestDate,
      yieldKg: Math.max(0, toNumber(row.yield_kg, 0)),
      lossPercent: toNumber(row.loss_percent, 10),
      marginPercent:
        row.margin_percent === null || row.margin_percent === undefined
          ? null
          : toNumber(row.margin_percent, 0),
      costs: parseCosts(row.costs),
      updatedAt: toText(row.updated_at) ?? new Date(0).toISOString(),
    });
  }
  return crops;
}

export function toFarmRows(
  ownerId: string,
  fields: Field[],
  updatedAt = new Date().toISOString(),
): FarmRow[] {
  return fields.map((field) => ({
    owner_id: ownerId,
    id: field.id,
    name: field.name,
    size_ha: field.sizeHa,
    location: field.location,
    updated_at: updatedAt,
  }));
}

export function toCropRows(ownerId: string, crops: Crop[]): CropRow[] {
  return crops.map((crop) => ({
    owner_id: ownerId,
    id: crop.id,
    farm_id: crop.fieldId,
    commodity_id: crop.commodityId,
    planting_date: crop.plantingDate,
    harvest_date: crop.harvestDate,
    yield_kg: crop.yieldKg,
    loss_percent: crop.lossPercent,
    margin_percent: crop.marginPercent,
    costs: crop.costs,
    updated_at: crop.updatedAt,
  }));
}

export function mergeFarmData(
  local: FarmData | undefined,
  remote: FarmData | undefined,
): FarmData {
  const fields = [...(local?.fields ?? [])];
  const fieldIds = new Set(fields.map((field) => field.id));
  for (const field of remote?.fields ?? []) {
    if (fieldIds.has(field.id)) continue;
    fields.push(field);
    fieldIds.add(field.id);
  }

  const crops = [...(local?.crops ?? [])];
  const cropIndexes = new Map(crops.map((crop, index) => [crop.id, index]));
  for (const remoteCrop of remote?.crops ?? []) {
    const index = cropIndexes.get(remoteCrop.id);
    if (index === undefined) {
      cropIndexes.set(remoteCrop.id, crops.length);
      crops.push(remoteCrop);
    } else if (remoteCrop.updatedAt > crops[index].updatedAt) {
      crops[index] = remoteCrop;
    }
  }

  return { fields, crops };
}
