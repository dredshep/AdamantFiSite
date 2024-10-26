import { SecretNetworkClient } from "secretjs";

interface TokenInfo {
  contract_addr: string;
  token_code_hash: string;
}

interface TokenDetails {
  contract_addr: string;
  decimals: number;
}

export const getTokenDetails = async (
  secretjs: SecretNetworkClient,
  tokenInfo: TokenInfo
): Promise<TokenDetails | null> => {
  try {
    const queryMsg = {
      token_info: {},
    };

    const response: { token_info: { decimals: number } } =
      await secretjs.query.compute.queryContract({
        contract_address: tokenInfo.contract_addr,
        code_hash: tokenInfo.token_code_hash,
        query: queryMsg,
      });

    console.log(
      "Query result:",
      JSON.stringify({ response, tokenInfo }, null, 2)
    );

    if (
      response !== undefined &&
      response !== null &&
      response.token_info !== undefined &&
      typeof response.token_info.decimals === "number"
    ) {
      return {
        contract_addr: tokenInfo.contract_addr,
        decimals: response.token_info.decimals,
      };
    } else {
      console.error("Unexpected response format:", response);
      return null;
    }
  } catch (error) {
    console.error("Error querying token details:", error);
    return null;
  }
};
