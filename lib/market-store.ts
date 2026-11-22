import { SEED_SNAPSHOT } from "@/lib/market-seed";
import type { MarketSnapshot } from "@/lib/market";

let snapshot: MarketSnapshot = SEED_SNAPSHOT;
const listeners = new Set<() => void>();

export const marketStore = {
  getSnapshot(): MarketSnapshot {
    return snapshot;
  },
  getServerSnapshot(): MarketSnapshot {
    return SEED_SNAPSHOT;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set(next: MarketSnapshot): void {
    snapshot = next;
    for (const listener of listeners) listener();
  },
};
