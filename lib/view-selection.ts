"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createLocalStore, type LocalStore } from "@/lib/local-store";

export const ALL_FIELDS = "all";

export type ViewSelection = {
  /** ALL_FIELDS means every field is in scope. */
  fieldId: string;
  /** null means "newest recommendable crop inside the current field scope". */
  cropId: string | null;
};

const DEFAULT_SELECTION: ViewSelection = {
  fieldId: ALL_FIELDS,
  cropId: null,
};

function parse(raw: unknown): ViewSelection {
  if (!raw || typeof raw !== "object") return DEFAULT_SELECTION;
  const value = raw as Partial<ViewSelection>;
  return {
    fieldId: typeof value.fieldId === "string" ? value.fieldId : ALL_FIELDS,
    cropId: typeof value.cropId === "string" ? value.cropId : null,
  };
}

const stores = new Map<string, LocalStore<ViewSelection>>();

function storeFor(userId: string): LocalStore<ViewSelection> {
  const existing = stores.get(userId);
  if (existing) return existing;
  const created = createLocalStore<ViewSelection>(
    `hjp.view.${userId}.v1`,
    DEFAULT_SELECTION,
    parse,
  );
  stores.set(userId, created);
  return created;
}

/** Used before anyone signs in so the hook keeps a stable store identity. */
const anonymousStore = createLocalStore<ViewSelection>(
  "hjp.view.anonymous.v1",
  DEFAULT_SELECTION,
  parse,
);

/**
 * Remembers which field and crop the farmer is looking at, per account, so the
 * home summary is not stuck on the most recently edited crop.
 */
export function useViewSelection(userId: string | undefined) {
  const store = useMemo(
    () => (userId ? storeFor(userId) : anonymousStore),
    [userId],
  );

  const selection = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const selectField = useCallback(
    (fieldId: string) => {
      // Changing the scope drops the explicit crop pick so the newest crop in
      // the new scope is shown instead of a crop that is no longer visible.
      store.set({ fieldId, cropId: null });
    },
    [store],
  );

  const selectCrop = useCallback(
    (cropId: string | null) => {
      store.set({ ...store.getSnapshot(), cropId });
    },
    [store],
  );

  return { selection, selectField, selectCrop };
}
