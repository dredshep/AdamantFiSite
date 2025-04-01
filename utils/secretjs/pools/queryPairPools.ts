import { SecretNetworkClient } from "secretjs";
import { queryPool } from "./queryPairPool";
import { PoolResponse } from "@/types/secretswap/pair";
import { Pair } from "@/types/secretswap/shared";

// NOTE: Each `Pair` does not include the code_hash.
// If we can map pair addresses to code hashes, it will make these queries faster.

// NOTE: This function might not be very useful as-is. Is there a better way to structure the returned data?

export async function queryPools(
  secretjs: SecretNetworkClient,
  pairs: Pair[],
): Promise<PoolResponse[]> {
  const data: PoolResponse[] = [];

  for (const pair of pairs) {
    const poolData = await queryPool(secretjs, pair.contract_addr);
    data.push(poolData);
  }

  return data;
}
