import { PoolData, PoolQueryResponse } from "@/types/estimation";
import Decimal from "decimal.js";
import { SecretNetworkClient } from "secretjs";
import { getTokenDecimals } from "../apis/tokenInfo";
import isNotNullish from "../isNotNullish";

export const getPoolData = async (
  secretjs: SecretNetworkClient,
  poolAddress: string
): Promise<PoolData> => {
  const response: PoolQueryResponse =
    await secretjs.query.compute.queryContract({
      contract_address: poolAddress,
      code_hash:
        "0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490",
      query: { pool: {} },
    });

  if (typeof response !== "object" || response === null) {
    throw new Error("Invalid response from pool contract");
  }

  const reserves = response.assets.reduce(
    (acc: { [key: string]: { amount: Decimal; decimals: number } }, asset) => {
      if (!isNotNullish(asset.info.token)) {
        return acc;
      }
      const decimals =
        asset.info.token?.contract_addr ===
        "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek"
          ? 6
          : getTokenDecimals(asset.info.token.contract_addr) ?? 0;
      // console.log({ decimals });
      acc[asset.info.token.contract_addr] = {
        amount: new Decimal(asset.amount),
        decimals,
      };
      return acc;
    },
    {}
  );

  return {
    reserves,
    fee: 0.003, // Assuming a fee of 0.3%
  };
};
