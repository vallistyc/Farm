"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/local-store";
import { isBuiltInCommodity, type CommodityId } from "@/lib/commodities";

export type CustomCommodity = {
  id: CommodityId;
  name: string;
};

const KEY = "hjp.commodities.v1";

function parse(raw: unknown): CustomCommodity[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is CustomCommodity =>
        !!item &&
        typeof item === "object" &&
        typeof (item as CustomCommodity).id === "string" &&
        typeof (item as CustomCommodity).name === "string",
    )
    .map((item) => ({ id: item.id, name: item.name }));
}

const store = createLocalStore<CustomCommodity[]>(KEY, [], parse);

function slugify(name: string): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "komoditas";
  return isBuiltInCommodity(base) ? `${base}-custom` : base;
}

/** Adds a custom commodity and returns it (id is a slug, unique per name). */
export function addCustomCommodity(name: string): CustomCommodity | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = store.getSnapshot();
  const duplicate = existing.find(
    (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) return duplicate;

  let id = slugify(trimmed);
  const ids = new Set(existing.map((item) => item.id));
  if (ids.has(id)) id = `${id}-${Date.now().toString(36)}`;

  const item: CustomCommodity = { id, name: trimmed };
  store.set([...existing, item]);
  return item;
}

export function removeCustomCommodity(id: string): void {
  store.set(store.getSnapshot().filter((item) => item.id !== id));
}

export function useCommodityCatalog() {
  const custom = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const list = useMemo<CustomCommodity[]>(() => custom ?? [], [custom]);

  const add = useCallback((name: string) => addCustomCommodity(name), []);
  const remove = useCallback((id: string) => removeCustomCommodity(id), []);

  return { custom: list, add, remove };
}

/**
 * Resolves a display label for any commodity id: built-ins use the translated
 * catalog, custom commodities use their stored name, otherwise the raw id.
 */
export function resolveCommodityName(
  id: string,
  custom: readonly CustomCommodity[],
  commodities: Record<string, string>,
): string {
  if (isBuiltInCommodity(id)) return commodities[id] ?? id;
  return custom.find((item) => item.id === id)?.name ?? id;
}
