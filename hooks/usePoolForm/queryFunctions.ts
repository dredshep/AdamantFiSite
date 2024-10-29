import { getTablePools } from "@/utils/apis/getTablePools";
import { queryPool } from "@/utils/apis/getPairPool";
import { queryFactoryPairs } from "@/utils/apis/getFactoryPairs";
import { getSwappableTokens } from "@/utils/apis/getSwappableTokens";
import { PoolQueryResult, PairPoolData, SelectedPoolType } from "./types";
import { setupPoolTokens } from "./poolTokens";

export async function fetchPoolData(
  poolAddress: string,
  setSelectedPool: (pool: SelectedPoolType) => void
): Promise<PoolQueryResult> {
  const [poolsData, pairData, factoryPairs, tokens] = await Promise.all([
    getTablePools(),
    queryPool(poolAddress),
    queryFactoryPairs(),
    getSwappableTokens(),
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
