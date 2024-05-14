// utils/transform.ts

import { SecretString } from "@/types";
import {
  AzureTokensToken,
  AzureTokensDisplayProps,
} from "@/types/api/azure/tokens";
import { SwappableToken } from "@/types/Token"; // Assuming Token type is defined in a separate file

export function transformAzureTokenIntoSwappableToken(
  tokens: AzureTokensToken[]
): SwappableToken[] {
  return tokens.map((token) => {
    const displayProps: AzureTokensDisplayProps = token.display_props;
    return {
      symbol: displayProps.symbol,
      address: token.dst_address as SecretString,
      isNativeToken: token.dst_address === "native" ? true : false,
      balance: token.totalLocked,
      viewingKey: "",
      protocol: token.src_network,
      network: token.dst_network,
      decimals: token.decimals,
      iconUrl: displayProps.image,
      name: token.name,
      description: "",
      usdPrice: "",
      priceVsNativeToken: "",
    };
  });
}
