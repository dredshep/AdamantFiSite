// api paths:
// - https://api-bridge-mainnet.azurewebsites.net/tokens
// - https://api-bridge-mainnet.azurewebsites.net/tokens/:token
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
  usage?: string[];
}

export interface AzureTokensResponse {
  tokens: AzureTokensToken[];
}
