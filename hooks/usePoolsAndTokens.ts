import { ConfigToken, TOKENS } from '@/config/tokens';
import { SecretString } from '@/types';
import { Pair } from '@/types/api/Factory';
import { queryFactoryPairs } from '@/utils/apis/getFactoryPairs';
import { useEffect, useState } from 'react';

interface PoolInfo {
  pair: Pair;
  token0: ConfigToken;
  token1: ConfigToken;
}

// Helper function to get token from address using our TOKENS config
const getConfigTokenFromAddress = (address: SecretString): ConfigToken | undefined => {
  return TOKENS.find((token) => token.address === address);
};

export function usePoolsAndTokens() {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPoolsAndTokens = async () => {
      try {
        setLoading(true);
        // Only fetch pairs, we already have tokens from config
        const pairs = await queryFactoryPairs();

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

              const token0 = getConfigTokenFromAddress(token0Address);
              const token1 = getConfigTokenFromAddress(token1Address);

              if (!token0 || !token1) {
                console.warn('Token not found in config:', {
                  token0Address,
                  token1Address,
                  token0Found: token0 !== undefined,
                  token1Found: token1 !== undefined,
                });
                return null;
              }

              return {
                pair,
                token0,
                token1,
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
