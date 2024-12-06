import { SecretString } from '@/types';
// import { Pair } from '@/types/api/Factory';
import { queryFactoryPairs } from '@/utils/apis/getFactoryPairs';
import { ApiToken, getApiToken, getTokenFromAddress } from '@/utils/apis/getSwappableTokens';
import { useEffect, useState } from 'react';

// export interface PoolInfo {
//   pair: Pair;
//   token0?: ApiToken;
//   token1?: ApiToken;
// }

export interface PoolInfo {
  pair: Pair;
  token0: Token0Class;
  token1: Token0Class;
}

export interface Pair {
  asset_infos: AssetInfo[];
  contract_addr: SecretString;
  liquidity_token: string;
  token_code_hash: string;
  asset0_volume: string;
  asset1_volume: string;
  factory: Factory;
}

export interface AssetInfo {
  token: TokenClass;
}

export interface TokenClass {
  contract_addr: SecretString;
  token_code_hash: string;
  viewing_key: string;
}

// export enum ViewingKey {
//   SecretSwap = 'SecretSwap',
// }

export interface Factory {
  address: string;
  code_hash: string;
}

export interface Token0Class {
  dst_network: DstNetwork;
  decimals: number;
  name: string;
  display_props: DisplayProps;
  price: string;
  _id: string;
  address: SecretString;
  usage: Usage[];
}

export interface DisplayProps {
  symbol: string;
  image: string;
  label: string;
}

export enum DstNetwork {
  Secret = 'Secret',
}

export enum Usage {
  Swap = 'SWAP',
}

export function usePoolsAndTokens() {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPoolsAndTokens = async () => {
      try {
        setLoading(true);
        const [pairs]: [Pair[], ApiToken[]] = await Promise.all([
          queryFactoryPairs(),
          getApiToken(),
        ]);

        const poolsWithTokenInfo = pairs
          .map((pair) => {
            if (pair.asset_infos[0] !== undefined && pair.asset_infos[1] !== undefined) {
              const token0Address = pair.asset_infos[0].token?.contract_addr;
              const token1Address = pair.asset_infos[1].token?.contract_addr;

              return {
                pair,
                token0: getTokenFromAddress(token0Address),
                token1: getTokenFromAddress(token1Address),
              };
            }
            return null;
          })
          .filter(
            (pool) => pool !== null && pool.token0 !== undefined && pool.token1 !== undefined
          ) as PoolInfo[];

        setPools(poolsWithTokenInfo);
      } catch (error) {
        console.error('Error fetching pools and tokens:', error);
        setError(error instanceof Error ? error : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    void fetchPoolsAndTokens();
  }, []);

  return { pools, loading, error };
}
