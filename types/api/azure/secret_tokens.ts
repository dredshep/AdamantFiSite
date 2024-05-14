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

export interface DisplayProps {
  image: string;
  symbol: string;
  label: string;
}
