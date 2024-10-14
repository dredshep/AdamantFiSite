import { queryFactoryPairs } from "./getFactoryPairs";
import { queryPool } from "./getPairPool";
import { PoolResponse } from "@/types/api/Pair";
import pLimit from "p-limit";

const limit = pLimit(5); // Limit concurrent requests

let cachedPools: PoolResponse[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

export async function queryPools() {
  if (
    cachedPools &&
    cacheTimestamp &&
    Date.now() - cacheTimestamp < CACHE_DURATION
  ) {
    console.log("Returning cached pools.");
    return cachedPools;
  }

  const pairs = await queryFactoryPairs();
  const data = await Promise.all(
    pairs.map((pair) => limit(async () => await queryPool(pair.contract_addr))),
  );

  cachedPools = data;
  cacheTimestamp = Date.now();

  return data;
}
