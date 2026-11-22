"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import {
  parseMarketSnapshot,
  type MarketCommodityId,
  type MarketQuote,
  type MarketSnapshot,
} from "@/lib/market";
import { marketStore } from "@/lib/market-store";

const STORAGE_KEY = "hjp.market.v1";
const REFRESH_MS = 60 * 1000;

const MarketPricesContext = createContext<MarketSnapshot | null>(null);

export function MarketPricesProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    marketStore.subscribe,
    marketStore.getSnapshot,
    marketStore.getServerSnapshot,
  );

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cached = parseMarketSnapshot(JSON.parse(raw));
        if (cached) marketStore.set(cached);
      }
    } catch {
      // Ignore a corrupt cache and keep the seed snapshot.
    }

    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const response = await fetch("/api/market-prices", {
          cache: "no-store",
          signal: AbortSignal.timeout(60 * 1000),
        });
        if (!response.ok) return;
        const next = parseMarketSnapshot(await response.json());
        if (cancelled || !next) return;
        marketStore.set(next);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Storage can be full or blocked; the in-memory snapshot still works.
        }
      } catch {
        // Offline or slow upstream: keep the previous snapshot.
      } finally {
        inFlight = false;
      }
    };

    void load();
    const timer = setInterval(load, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <MarketPricesContext.Provider value={snapshot}>
      {children}
    </MarketPricesContext.Provider>
  );
}

export function useMarketPrices(): MarketSnapshot {
  return useContext(MarketPricesContext) ?? marketStore.getSnapshot();
}

export function useMarketQuote(commodityId: MarketCommodityId): MarketQuote {
  return useMarketPrices().quotes[commodityId];
}
