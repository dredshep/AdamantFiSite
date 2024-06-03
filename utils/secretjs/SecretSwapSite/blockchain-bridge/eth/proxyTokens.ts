import { NETWORKS } from './networks';

export interface PROXY_CONTRACT {
  contract: string;
  symbol: string;
}

export const ProxyTokens = {
  WSCRT: {
    [NETWORKS.ETH]: {
      proxy: globalThis.config.WSCRT_PROXY_CONTRACT_ETH,
      token: globalThis.config.SSCRT_CONTRACT,
      proxySymbol: 'WSCRT',
    },
    [NETWORKS.BSC]: {
      proxy: globalThis.config.WSCRT_PROXY_CONTRACT_BSC,
      token: globalThis.config.SSCRT_CONTRACT,
      proxySymbol: 'WSCRT',
    },
    [NETWORKS.PLSM]: {
      proxy: undefined,
      token: undefined,
    },
  },
  SSCRT: {
    [NETWORKS.ETH]: {
      proxy: globalThis.config.WSCRT_PROXY_CONTRACT_ETH,
      token: globalThis.config.SSCRT_CONTRACT,
      proxySymbol: 'WSCRT',
      secretSymbol: 'SSCRT',
    },
    [NETWORKS.BSC]: {
      proxy: globalThis.config.WSCRT_PROXY_CONTRACT_BSC,
      token: globalThis.config.SSCRT_CONTRACT,
      proxySymbol: 'WSCRT',
      secretSymbol: 'SSCRT',
    },
    [NETWORKS.PLSM]: {
      proxy: undefined,
      token: undefined,
    },
  },
  SIENNA: {
    [NETWORKS.ETH]: {
      proxy: globalThis.config.SIENNA_PROXY_CONTRACT_ETH,
      token: globalThis.config.SIENNA_CONTRACT,
      proxySymbol: 'WSIENNA',
      secretSymbol: 'SIENNA',
    },
    [NETWORKS.BSC]: {
      proxy: globalThis.config.SIENNA_PROXY_CONTRACT_BSC,
      token: globalThis.config.SIENNA_CONTRACT,
      proxySymbol: 'WSIENNA',
      secretSymbol: 'SIENNA',
    },
    [NETWORKS.PLSM]: {
      proxy: undefined,
      token: undefined,
    },
  },
};

export const proxyContracts: PROXY_CONTRACT[] = [
  { contract: globalThis.config.WSCRT_PROXY_CONTRACT_ETH, symbol: 'SSCRT' },
  { contract: globalThis.config.WSCRT_PROXY_CONTRACT_BSC, symbol: 'SSCRT' },
  { contract: globalThis.config.SIENNA_PROXY_CONTRACT_ETH, symbol: 'SIENNA' },
  { contract: globalThis.config.SIENNA_PROXY_CONTRACT_BSC, symbol: 'SIENNA' },
];
