import type { FarmData } from "@/lib/farm";
import {
  parseCropRows,
  parseFarmRows,
  toCropRows,
  toFarmRows,
} from "@/lib/cloud-merge";

export type CloudStatus = "local" | "syncing" | "synced" | "error";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "") ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export function isCloudEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  if (!isCloudEnabled()) throw new Error("Supabase is not configured");

  const headers = new Headers(init?.headers);
  headers.set("apikey", SUPABASE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_KEY}`);
  headers.set("Content-Type", "application/json");

  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
}

async function readTable(
  table: "farms" | "crops",
  ownerId: string,
): Promise<unknown[]> {
  const query = new URLSearchParams({ select: "*", owner_id: `eq.${ownerId}` });
  const response = await request(`${table}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Read ${table} failed with ${response.status}`);
  }
  const body: unknown = await response.json();
  return Array.isArray(body) ? body : [];
}

async function upsertRows(
  table: "farms" | "crops",
  rows: unknown[],
): Promise<void> {
  if (rows.length === 0) return;
  const response = await request(
    `${table}?on_conflict=${encodeURIComponent("owner_id,id")}`,
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    },
  );
  if (!response.ok) {
    throw new Error(`Write ${table} failed with ${response.status}`);
  }
}

export async function pullFarm(ownerId: string): Promise<FarmData> {
  const [farmRows, cropRows] = await Promise.all([
    readTable("farms", ownerId),
    readTable("crops", ownerId),
  ]);

  const fields = parseFarmRows(farmRows);
  const fieldIds = new Set(fields.map((field) => field.id));
  return {
    fields,
    crops: parseCropRows(cropRows).filter((crop) => fieldIds.has(crop.fieldId)),
  };
}

export async function pushFarm(
  ownerId: string,
  data: FarmData,
): Promise<void> {
  await upsertRows("farms", toFarmRows(ownerId, data.fields));
  await upsertRows("crops", toCropRows(ownerId, data.crops));
}
