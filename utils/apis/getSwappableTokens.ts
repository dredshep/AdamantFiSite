import fullApiTokenOutput from '@/outputs/fullApiTokenOutput.json';
import { SecretString } from '@/types';
import { SimpleToken, simpleTokens } from './hardcoded/simpleTokens';

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

export const getApiTokenSymbol = (token: ApiToken): string => {
  return token.display_props.symbol;
};

export function tokenAddressToApiToken(address: SecretString): ApiToken | undefined {
  return (fullApiTokenOutput as ApiToken[]).find((token) => getApiTokenAddress(token) === address);
}

export function tokenAddressToSimpleToken(address: SecretString): SimpleToken | undefined {
  return simpleTokens.find((token) => token.contract_addr === address);
}

export const getTokenFromAddress = (address: SecretString): ApiToken | undefined => {
  const simpleToken = tokenAddressToSimpleToken(address);
  if (simpleToken) {
    return transformSimpleTokenToApiToken(simpleToken);
  }
  return tokenAddressToApiToken(address);
};

export const transformSimpleTokenToApiToken = (simpleToken: SimpleToken): ApiToken => {
  const knownToken = simpleTokens.find(
    (token) => token.contract_addr === simpleToken.contract_addr
  );

  return {
    dst_network: DstNetwork.Secret,
    decimals: knownToken?.decimals ?? 6,
    name: knownToken?.token_name ?? '',
    display_props: {
      symbol: knownToken?.token_name ?? '',
      image: '',
      label: knownToken?.token_name ?? '',
    },
    price: '0',
    _id: simpleToken.contract_addr,
    address: simpleToken.contract_addr,
    usage: [Usage.Swap],
  };
};
