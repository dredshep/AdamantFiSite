import { TokenPoolMap } from "@/types/estimation";
import { FullPoolsData } from "../secretjs/decimals/types/FullPoolsData";

export const buildTokenPoolMap = (pools: FullPoolsData): TokenPoolMap => {
  const tokenPoolMap: TokenPoolMap = {};

  pools.forEach((pool) => {
    pool.query_result.assets
      .filter((asset) => asset.info.token !== undefined)
      .forEach((asset) => {
        const tokenAddr = asset.info.token!.contract_addr;
        if (!(tokenAddr in tokenPoolMap)) {
          tokenPoolMap[tokenAddr] = [];
        }
        tokenPoolMap[tokenAddr]?.push(pool.contract_address);
      });
  });

  return tokenPoolMap;
};
