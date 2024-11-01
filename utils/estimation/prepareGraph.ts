import { PoolData, TokenPoolMap } from "@/types/estimation";
import Decimal from "decimal.js";
import { SecretNetworkClient } from "secretjs";
import { calculateSingleHopOutput, fetchPoolData, getPoolData } from ".";

interface Edge {
  from: string;
  to: string;
  poolAddress: string;
  weight: number;
}

export const prepareGraph = async (
  tokenPoolMap: TokenPoolMap,
  secretjs: SecretNetworkClient
): Promise<{ edges: Edge[]; tokens: Set<string> }> => {
  const fullPoolsData = await fetchPoolData();
  const poolDataCache: { [poolAddress: string]: PoolData } = {};
  const edges: Edge[] = [];
  const tokens = new Set<string>();

  // Fetch and cache pool data
  for (const pool of fullPoolsData) {
    const poolAddress = pool.contract_address;
    const data = await getPoolData(secretjs, poolAddress);
    poolDataCache[poolAddress] = data;
  }

  // Calculate edge weights synchronously
  for (const token in tokenPoolMap) {
    const pools = tokenPoolMap[token];
    tokens.add(token);

    for (const poolAddress of pools as string[]) {
      const poolData = fullPoolsData.find(
        (p) => p.contract_address === poolAddress
      );
      const poolTokens = poolData?.query_result.assets
        .filter((asset) => asset.info.token !== undefined)
        .map((asset) => asset.info.token!.contract_addr);

      for (const nextToken of poolTokens || []) {
        if (nextToken !== token) {
          const weight = calculateEdgeWeightSync(
            token,
            nextToken,
            // poolAddress,
            poolDataCache[poolAddress]!
          );
          edges.push({
            from: token,
            to: nextToken,
            poolAddress,
            weight,
          });
        }
      }
    }
  }

  return { edges, tokens };
};

const calculateEdgeWeightSync = (
  inputToken: string,
  outputToken: string,
  // poolAddress: string,
  poolData: PoolData
): number => {
  const amountIn = new Decimal(1); // Unit amount for estimation

  const { output } = calculateSingleHopOutput(
    amountIn,
    poolData,
    inputToken,
    outputToken
  );

  if (output.isZero()) {
    return Infinity;
  }

  const weight = -Math.log(output.toNumber());
  return weight;
};
