import fullApiTokenOutput from '@/outputs/fullApiTokenOutput.json';
import { SecretString } from '@/types';
export interface ApiToken {
  src_network?: SrcNetwork;
  src_coin?: string;
  src_address?: string;
  dst_network?: DstNetwork;
  dst_address?: string;
  dst_coin?: string;
  decimals: number;
  name: string;
  display_props: DisplayProps;
  totalLocked?: string;
  totalLockedNormal?: string;
  totalLockedUSD?: string;
  price: string;
  _id: string;
  address?: string;
  hidden?: boolean;
  usage?: Usage[];
  id?: string;
}

export interface DisplayProps {
  symbol: string;
  image: string;
  min_to_scrt?: string;
  min_from_scrt?: string;
  label: string;
  hidden?: boolean;
  proxy?: boolean;
  usage?: string[];
}

export enum DstNetwork {
  Secret = 'Secret',
}

export enum SrcNetwork {
  BinanceSmartChain = 'BinanceSmartChain',
  Ethereum = 'Ethereum',
}

export enum Usage {
  Lpstaking = 'LPSTAKING',
  Swap = 'SWAP',
}
export const getApiToken = async () => Promise.resolve(fullApiTokenOutput) as Promise<ApiToken[]>;

export const getApiTokenAddress = (token: ApiToken) =>
  (token.dst_address ?? token.address!) as SecretString;

export const getApiTokenSymbol = (token: ApiToken): string => token.display_props.symbol;

export const getTokenFromAddress = (address: SecretString): ApiToken | undefined =>
  (fullApiTokenOutput as ApiToken[]).find((token) => getApiTokenAddress(token) === address);
