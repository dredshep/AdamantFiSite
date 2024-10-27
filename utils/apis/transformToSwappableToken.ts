import { SecretString } from "@/types";
import { SecretToken } from "@/types/api/azure/secret_tokens";
import {
  AzureTokensToken,
  AzureTokensDisplayProps,
} from "@/types/api/azure/tokens";
import { SwappableToken } from "@/types/Token"; // Assuming Token type is defined in a separate file

export function transformToSwappableToken(
  tokens: (AzureTokensToken | SecretToken)[]
): SwappableToken[] {
  return tokens.map((token) => {
    // Determine the type of token dynamically by checking for specific properties unique to each type
    if ("dst_address" in token && "src_network" in token) {
      // AzureTokensToken structure
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
    } else {
      // SecretToken structure
      const displayProps: SecretToken["display_props"] = token.display_props;
      return {
        symbol: displayProps.symbol,
        address: token.address as SecretString,
        isNativeToken: token.address === "native" ? true : false,
        balance: "",
        viewingKey: "",
        protocol: "",
        network: "",
        decimals: token.decimals,
        iconUrl: displayProps.image,
        name: token.name,
        description: "",
        usdPrice: token.price,
        priceVsNativeToken: "",
      };
    }
  });
}
