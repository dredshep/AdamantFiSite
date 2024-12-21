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

export const getApiTokenFromJson = async () =>
  Promise.resolve(fullApiTokenOutput) as Promise<ApiToken[]>;

export const getApiTokenAddressFromJson = (token: ApiToken) =>
  (token.dst_address ?? token.address!) as SecretString;

export const getApiTokenSymbolFromJson = (token: ApiToken): string => {
  return token.display_props.symbol;
};

export const tokenAddressToApiTokenFromJson = (address: SecretString): ApiToken | undefined => {
  return (fullApiTokenOutput as ApiToken[]).find(
    (token) => getApiTokenAddressFromJson(token) === address
  );
};

export const getApiToken = (): Promise<ApiToken[]> => {
  const tokens = simpleTokens.map(
    (token): ApiToken => ({
      decimals: token.decimals,
      name: token.token_name,
      display_props: {
        symbol: token.token_name,
        image: '', // SimpleTokens don't have images
        label: token.token_name,
      },
      price: '0', // SimpleTokens don't have price info
      _id: token.contract_addr,
      address: token.contract_addr,
      usage: [Usage.Swap],
    })
  );

  return Promise.resolve(tokens);
};

export const getApiTokenAddress = (token: ApiToken): SecretString => token.address as SecretString;

export const getApiTokenSymbol = (token: ApiToken): string => token.display_props.symbol;

export const tokenAddressToApiToken = (address: SecretString): ApiToken | undefined => {
  const simpleToken = simpleTokens.find((token) => token.contract_addr === address);
  if (!simpleToken) return undefined;

  return {
    decimals: simpleToken.decimals,
    name: simpleToken.token_name,
    display_props: {
      symbol: simpleToken.token_name,
      image: '',
      label: simpleToken.token_name,
    },
    price: '0',
    _id: simpleToken.contract_addr,
    address: simpleToken.contract_addr,
    usage: [Usage.Swap],
  };
};

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
