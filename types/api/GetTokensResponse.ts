// type of response from https://api-bridge-mainnet.azurewebsites.net/secret_tokens/?page=0&size=1000
export interface GetTokensResponse {
  tokens: ApiGetTokensToken[];
}

export enum TokenUsage {
  LPSTAKING = "LPSTAKING",
  SWAP = "SWAP",
}

export interface ApiGetTokensToken {
  name: string;
  address: string;
  decimals: number;
  hidden: boolean;
  usage: TokenUsage[];
  price: string;
  id: string;
  display_props: TokenDisplayProps;
  _id: string;
  dst_address?: string;
}

export interface TokenDisplayProps {
  image: string;
  symbol: string;
  label: string;
}
