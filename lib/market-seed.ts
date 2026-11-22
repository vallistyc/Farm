import { COMMODITIES } from "./commodities";
import { buildSnapshot, type SeedCommodity } from "./market";

const SEED: SeedCommodity[] = COMMODITIES.map(
  ({ id, trendStart, trendMyr }) => ({ id, trendStart, trendMyr }),
);

export const SEED_SNAPSHOT = buildSnapshot({}, "", SEED);
