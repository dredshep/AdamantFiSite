import isNotNullish from "../isNotNullish";
import { queryFactoryPairs } from "./getFactoryPairs";
import { queryPool } from "./getPairPool";
import { PoolResponse } from "@/types/api/Pair";

let cachedPools: PoolResponse[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

export async function queryPools() {
  if (
    isNotNullish(cachedPools) &&
    isNotNullish(cacheTimestamp) &&
    Date.now() - cacheTimestamp < CACHE_DURATION
  ) {
    console.log("Returning cached pools.");
    return cachedPools;
  }

  const pairs = await queryFactoryPairs();

  const data: PoolResponse[] = [];
  for (const pair of pairs) {
    try {
      console.log(`querying pool for ${pair.contract_addr}`);
      const poolData = await queryPool(pair.contract_addr);
      data.push(poolData);
    } catch (error) {
      console.error(`Error querying pool for ${pair.contract_addr}:`, error);
    }
  }

  cachedPools = data;
  cacheTimestamp = Date.now();

  return data;
}
