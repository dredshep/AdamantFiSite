// api path: https://api-bridge-mainnet.azurewebsites.net/secret_tokens
export interface SecretTokensResponse {
  tokens: SecretTokensToken[];
}

export interface SecretTokensToken {
  name: string;
  address: string;
  decimals: number;
  hidden: boolean;
  usage: string[];
  price: string;
  id: string;
  display_props: SecretTokensDisplayProps;
  dst_address?: string;
}

export interface SecretTokensDisplayProps {
  image: string;
  symbol: string;
  label: string;
}
