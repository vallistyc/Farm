"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import seed from "@/data/farm-seed.json";
import type { CommodityId } from "@/lib/commodities";
import {
  emptyCosts,
  type Crop,
  type CropCostInput,
  type FarmData,
  type Field,
} from "@/lib/farm";
import { createLocalStore } from "@/lib/local-store";

const FARM_KEY = "hjp.farm.v1";

type FarmStoreShape = Record<string, FarmData>;

const SEED = seed as unknown as FarmData;

function cloneSeed(): FarmData {
  return structuredClone(SEED);
}

function parseFarmStore(raw: unknown): FarmStoreShape {
  if (!raw || typeof raw !== "object") return {};
  return raw as FarmStoreShape;
}

const farmStore = createLocalStore<FarmStoreShape>(FARM_KEY, {}, parseFarmStore);

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const EMPTY_FARM: FarmData = { fields: [], crops: [] };

export function getFarmData(userId: string): FarmData | undefined {
  return farmStore.getSnapshot()[userId];
}

export function setFarmData(userId: string, data: FarmData): void {
  farmStore.set({ ...farmStore.getSnapshot(), [userId]: data });
}

export function subscribeFarmData(listener: () => void): () => void {
  return farmStore.subscribe(listener);
}

export type NewFieldInput = {
  name: string;
  sizeHa: number;
  location: string;
};

export type NewCropInput = {
  fieldId: string;
  commodityId: CommodityId;
  plantingDate: string;
  harvestDate: string;
};

export function useFarm(userId: string | undefined) {
  const all = useSyncExternalStore(
    farmStore.subscribe,
    farmStore.getSnapshot,
    farmStore.getServerSnapshot,
  );

  const data = useMemo<FarmData>(() => {
    if (!userId) return EMPTY_FARM;
    return all[userId] ?? cloneSeed();
  }, [all, userId]);

  const write = useCallback(
    (updater: (current: FarmData) => FarmData) => {
      if (!userId) return;
      const current = getFarmData(userId) ?? cloneSeed();
      setFarmData(userId, updater(current));
    },
    [userId],
  );

  const addField = useCallback(
    (input: NewFieldInput): Field => {
      const field: Field = { id: makeId("field"), ...input };
      write((current) => ({ ...current, fields: [...current.fields, field] }));
      return field;
    },
    [write],
  );

  const addCrop = useCallback(
    (input: NewCropInput): Crop => {
      const crop: Crop = {
        id: makeId("crop"),
        fieldId: input.fieldId,
        commodityId: input.commodityId,
        plantingDate: input.plantingDate,
        harvestDate: input.harvestDate,
        yieldKg: 0,
        lossPercent: 10,
        marginPercent: null,
        sellPriceMyr: null,
        sellQty: null,
        costs: emptyCosts(),
        updatedAt: new Date().toISOString(),
      };
      write((current) => ({ ...current, crops: [...current.crops, crop] }));
      return crop;
    },
    [write],
  );

  const saveCosts = useCallback(
    (cropId: string, input: CropCostInput) => {
      write((current) => ({
        ...current,
        crops: current.crops.map((crop) =>
          crop.id === cropId
            ? {
                ...crop,
                costs: {
                  direct: input.direct,
                  labour: input.labour,
                  hidden: input.hidden,
                },
                yieldKg: input.yieldKg,
                lossPercent: input.lossPercent,
                marginPercent: input.marginPercent,
                sellPriceMyr: input.sellPriceMyr,
                sellQty: input.sellQty,
                updatedAt: new Date().toISOString(),
              }
            : crop,
        ),
      }));
    },
    [write],
  );

  const updateMargin = useCallback(
    (cropId: string, marginPercent: number) => {
      write((current) => ({
        ...current,
        crops: current.crops.map((crop) =>
          crop.id === cropId
            ? { ...crop, marginPercent, updatedAt: new Date().toISOString() }
            : crop,
        ),
      }));
    },
    [write],
  );

  const getField = useCallback(
    (fieldId: string) => data.fields.find((field) => field.id === fieldId),
    [data.fields],
  );

  const getCrop = useCallback(
    (cropId: string) => data.crops.find((crop) => crop.id === cropId),
    [data.crops],
  );

  return { data, addField, addCrop, saveCosts, updateMargin, getField, getCrop };
}
