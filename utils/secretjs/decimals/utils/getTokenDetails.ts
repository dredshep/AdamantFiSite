import { TokenInfoResponse } from "@shadeprotocol/shadejs";
import { SecretNetworkClient } from "secretjs";

export const getTokenDetails = async (
  secretjs: SecretNetworkClient,
  contract_addr: string,
  token_code_hash: string,
  onError: (error: string) => void
) => {
  try {
    const queryMsg = {
      token_info: {},
    };

    const response = await secretjs.query.compute.queryContract({
      contract_address: contract_addr,
      code_hash: token_code_hash,
      query: queryMsg,
    });

    const tokenInfoResponse = response as TokenInfoResponse;

    if (
      tokenInfoResponse &&
      tokenInfoResponse.token_info &&
      typeof tokenInfoResponse.token_info.decimals === "number"
    ) {
      return {
        contract_addr,
        decimals: tokenInfoResponse.token_info.decimals,
      };
    } else {
      console.error("Unexpected response format:", response);
      onError("Unexpected response format");
      return null;
    }
  } catch (error) {
    console.error("Error querying token details:", error);
    onError("Error querying token details: " + (error as Error).message);
    return null;
  }
};
