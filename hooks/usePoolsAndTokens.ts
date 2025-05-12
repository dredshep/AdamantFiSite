import { SecretString } from '@/types';
import { Pair } from '@/types/api/Factory';
import { queryFactoryPairs } from '@/utils/apis/getFactoryPairs';
import { ApiToken, getApiToken, getTokenFromAddress } from '@/utils/apis/getSwappableTokens';
import { useEffect, useState } from 'react';

interface PoolInfo {
  pair: Pair;
  token0: Token0Class;
  token1: Token0Class;
}

interface Token0Class {
  dst_network: DstNetwork;
  decimals: number;
  name: string;
  display_props: DisplayProps;
  price: string;
  _id: string;
  address: SecretString;
  usage: Usage[];
}

interface DisplayProps {
  symbol: string;
  image: string;
  label: string;
}

enum DstNetwork {
  Secret = 'Secret',
}

enum Usage {
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
            if (pair.asset_infos[0]?.token && pair.asset_infos[1]?.token) {
              const token0Address = pair.asset_infos[0].token.contract_addr;
              const token1Address = pair.asset_infos[1].token.contract_addr;

              // Validate addresses have correct format
              if (!token0Address.startsWith('secret1') || !token1Address.startsWith('secret1')) {
                console.error('Invalid token address format:', { token0Address, token1Address });
                return null;
              }

              return {
                pair,
                token0: getTokenFromAddress(token0Address as SecretString),
                token1: getTokenFromAddress(token1Address as SecretString),
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
