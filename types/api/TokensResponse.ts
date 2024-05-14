export interface TokensResponse {
  tokens: Token[];
}

export interface Token {
  src_network: string;
  src_coin: string;
  src_address: string;
  dst_network: string;
  dst_address: string;
  dst_coin?: string;
  decimals: number;
  name: string;
  display_props: DisplayProps;
  totalLocked: string;
  totalLockedNormal: string;
  totalLockedUSD: string;
  price: string;
  _id: string;
}

export interface DisplayProps {
  symbol: string;
  image: string;
  min_to_scrt: string;
  min_from_scrt: string;
  label: string;
  hidden?: boolean;
  proxy?: boolean;
  usage?: string[];
}
