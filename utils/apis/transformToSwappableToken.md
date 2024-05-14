```ts
// @/utils/apis/transformAzureTokenIntoSwappableToken.ts

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

// @/utils/apis/getSwappableTokens.ts
import { Token } from "@/types";

import { transformToSwappableToken } from "./transformAzureTokenIntoSwappableToken";
import { AzureTokensResponse } from "@/types/api/azure";
import getUrl from "./getUrl";

export const getSwappableTokens = async (): Promise<Token[]> => {
  const response = await fetch(getUrl("/api/tokens"));
  const data = (await response.json()) as AzureTokensResponse;
  return transformToSwappableToken(data.tokens);
};
```

```ts
// api paths:
// - https://api-bridge-mainnet.azurewebsites.net/tokens
// - https://api-bridge-mainnet.azurewebsites.net/tokens/:token

// - https://bridge-bsc-mainnet.azurewebsites.net/tokens/?page=0&size=1000
// - https://bridge-bsc-mainnet.azurewebsites.net/tokens/:token
export interface AzureTokensToken {
  src_network: string;
  src_coin: string;
  src_address: string;
  dst_network: string;
  dst_address: string;
  dst_coin?: string;
  decimals: number;
  name: string;
  display_props: AzureTokensDisplayProps;
  totalLocked: string;
  totalLockedNormal: string;
  totalLockedUSD: string;
  price: string;
  _id: string;
}

export interface AzureTokensDisplayProps {
  symbol: string;
  image: string;
  min_to_scrt: string;
  min_from_scrt: string;
  label: string;
  hidden?: boolean;
  proxy?: boolean;
  usage?: "BRIDGE" | "SWAP" | "LPSTAKING";
}

export interface AzureTokensResponse {
  tokens: AzureTokensToken[];
}
```

```ts
// @/types/api/azure/tokens.ts

// api paths:
// - https://api-bridge-mainnet.azurewebsites.net/tokens
// - https://api-bridge-mainnet.azurewebsites.net/tokens/:token

// - https://bridge-bsc-mainnet.azurewebsites.net/tokens/?page=0&size=1000
// - https://bridge-bsc-mainnet.azurewebsites.net/tokens/:token
export interface AzureSecretTokensResponse {
  tokens: SecretToken[];
}

export interface SecretToken {
  name: string;
  address: string;
  decimals: number;
  hidden: boolean;
  usage: string[];
  price: string;
  id: string;
  display_props: DisplayProps;
  _id: string;
  dst_address?: string;
}
export interface AzureTokensToken {
  src_network: string;
  src_coin: string;
  src_address: string;
  dst_network: string;
  dst_address: string;
  dst_coin?: string;
  decimals: number;
  name: string;
  display_props: AzureTokensDisplayProps;
  totalLocked: string;
  totalLockedNormal: string;
  totalLockedUSD: string;
  price: string;
  _id: string;
}

export interface AzureTokensDisplayProps {
  symbol: string;
  image: string;
  min_to_scrt: string;
  min_from_scrt: string;
  label: string;
  hidden?: boolean;
  proxy?: boolean;
  usage?: "BRIDGE" | "SWAP" | "LPSTAKING";
}

export interface AzureTokensResponse {
  tokens: AzureTokensToken[];
}
```
