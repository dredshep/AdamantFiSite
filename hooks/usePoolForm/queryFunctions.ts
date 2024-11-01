import { queryFactoryPairs } from "@/utils/apis/getFactoryPairs";
import { queryPool } from "@/utils/apis/getPairPool";
import { getApiTokens } from "@/utils/apis/getSwappableTokens";
import { getTablePools } from "@/utils/apis/getTablePools";
import { setupPoolTokens } from "./poolTokens";
import { PairPoolData, PoolQueryResult, SelectedPoolType } from "./types";

export async function fetchPoolData(
  poolAddress: string,
  setSelectedPool: (pool: SelectedPoolType) => void
): Promise<PoolQueryResult> {
  const [poolsData, pairData, factoryPairs, tokens] = await Promise.all([
    getTablePools(),
    queryPool(poolAddress),
    queryFactoryPairs(),
    getApiTokens(),
  ]);

  if (pairData === undefined || typeof pairData !== "object") {
    throw new Error("Invalid pair data received");
  }

  const pair = factoryPairs.find((p) => p.contract_addr === poolAddress);
  if (pair) {
    setupPoolTokens(pair, tokens, poolAddress, setSelectedPool);
  }

  return {
    pools: poolsData,
    pairPoolData: pairData as PairPoolData,
    poolDetails: poolsData.find((p) => p.contract_address === poolAddress),
  };
}

export function validatePoolAddress(
  poolAddress: string | string[] | undefined
): string {
  if (typeof poolAddress !== "string") {
    throw new Error("Invalid pool address");
  }
  return poolAddress;
}
