import { SecretNetworkClient } from "secretjs";
import { Snip20TokenInfo } from "./types/Snip20TokenInfo";

export const GetSnip20Params = async (params: {
  secretjs: SecretNetworkClient;
  address: string;
  codeHash: string;
}): Promise<Snip20TokenInfo> => {
  const { secretjs, address, codeHash } = params;

  try {
    const response = await secretjs.query.compute.queryContract({
      contract_address: address,
      code_hash: codeHash,
      query: {
        token_info: {},
      },
    });

    const tokenInfo = response as { token_info: Snip20TokenInfo };

    return {
      name: tokenInfo.token_info.name,
      symbol: tokenInfo.token_info.symbol,
      decimals: tokenInfo.token_info.decimals,
      total_supply: tokenInfo.token_info.total_supply,
    };
  } catch (e) {
    console.error("Failed to get token info", e);
    throw Error("Failed to get info");
  }
};
