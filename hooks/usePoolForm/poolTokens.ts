import { ApiToken, getApiTokenAddress } from "@/utils/apis/getSwappableTokens";
import { PairInfo, SelectedPoolType } from "./types";

export function setupPoolTokens(
  pair: PairInfo,
  tokens: ApiToken[],
  poolAddress: string,
  setSelectedPool: (pool: SelectedPoolType) => void
): void {
  const token0Address = pair.asset_infos[0]?.token?.contract_addr;
  const token1Address = pair.asset_infos[1]?.token?.contract_addr;

  if (
    typeof token0Address === "string" &&
    typeof token1Address === "string" &&
    token0Address.length > 0 &&
    token1Address.length > 0
  ) {
    const token0 = tokens.find((t) => getApiTokenAddress(t) === token0Address);
    const token1 = tokens.find((t) => getApiTokenAddress(t) === token1Address);

    if (token0 && token1) {
      setSelectedPool({
        address: poolAddress,
        token0,
        token1,
        pairInfo: pair,
      });
    }
  }
}
