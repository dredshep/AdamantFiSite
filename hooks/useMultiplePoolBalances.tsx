import { useWalletStore } from '@/store/walletStore';
import {
  LPStakingQueryAnswer,
  LPStakingQueryMsg,
  isBalanceResponse,
  isQueryErrorResponse,
} from '@/types/secretswap/lp-staking';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SecretNetworkClient } from 'secretjs';
import { useKeplrConnection } from './useKeplrConnection';
import { useMultipleTokenBalances } from './useTokenBalance';

// Define a stable default for LP data
const DEFAULT_LP_DATA = {
  balance: '0',
  loading: true,
  needsViewingKey: false,
  error: null,
  refetch: () => {},
};

// Define a stable default for staked data
const DEFAULT_STAKED_DATA = {
  balance: '0',
  isLoading: true,
  error: false,
  needsKey: false,
};

// Define the structure for a single pool's balance data
export interface PoolBalanceData {
  lpTokenAddress: string;
  lpBalance: string;
  stakedBalance: string;
  lpLoading: boolean;
  stakedLoading: boolean;
  lpNeedsViewingKey: boolean;
  stakedNeedsViewingKey: boolean;
  lpError: boolean;
  stakedError: boolean;
  hasAnyBalance: boolean;
  retryLpBalance: () => void;
  retryStakedBalance: () => void;
}

// Define a stable NO_OP function for retries that don't exist.
const NO_OP = () => {};

// Define the config for fetching a pool's balance
export interface PoolBalanceConfig {
  lpTokenAddress: string;
  stakingContractAddress?: string | undefined;
  stakingContractCodeHash?: string | undefined;
}

// Define the hook's return type
export type MultiplePoolBalances = Record<string, PoolBalanceData>;

// Custom hook to fetch balances for multiple pools
export const useMultiplePoolBalances = (configs: PoolBalanceConfig[]): MultiplePoolBalances => {
  const { address: walletAddress } = useWalletStore();
  const { secretjs } = useKeplrConnection();

  // 1. Fetch all LP token balances using the existing hook
  const lpTokenAddresses = useMemo(
    () => configs.map((c) => c.lpTokenAddress as `secret1${string}`),
    [configs]
  );
  const lpBalances = useMultipleTokenBalances(lpTokenAddresses, 'useMultiplePoolBalances');

  // 2. State for staked balances
  const [stakedBalances, setStakedBalances] = useState<
    Record<string, { balance: string; isLoading: boolean; error: boolean; needsKey: boolean }>
  >(
    Object.fromEntries(
      configs.map((c) => [
        c.lpTokenAddress,
        { balance: '0', isLoading: true, error: false, needsKey: false },
      ])
    )
  );

  // 3. Memoize configs for stable dependencies
  const stringifiedConfigs = JSON.stringify(configs);
  const memoizedConfigs = useMemo(
    () => JSON.parse(stringifiedConfigs) as PoolBalanceConfig[],
    [stringifiedConfigs]
  );

  // 4. Function to fetch staked balances
  const fetchStakedBalances = useCallback(
    async (client: SecretNetworkClient, address: string, configsToFetch: PoolBalanceConfig[]) => {
      setStakedBalances((prev) => {
        const next = { ...prev };
        for (const config of configsToFetch) {
          if (config.stakingContractAddress) {
            const current = prev[config.lpTokenAddress] || {
              balance: '0',
              isLoading: true,
              error: false,
              needsKey: false,
            };
            next[config.lpTokenAddress] = {
              ...current,
              isLoading: true,
              error: false,
              needsKey: false,
            };
          }
        }
        return next;
      });

      for (const config of configsToFetch) {
        if (!config.stakingContractAddress || !config.stakingContractCodeHash) {
          setStakedBalances((prev) => ({
            ...prev,
            [config.lpTokenAddress]: {
              balance: '0',
              isLoading: false,
              error: false,
              needsKey: false,
            },
          }));
          continue;
        }

        try {
          // Try to get viewing key from Keplr
          const keplr = (window as any).keplr;
          if (!keplr) {
            throw new Error('Keplr not found');
          }

          let viewingKey: string;
          try {
            viewingKey = await keplr.getSecret20ViewingKey(
              'secret-4',
              config.stakingContractAddress
            );
          } catch (viewingKeyError) {
            // If no viewing key, set needsKey flag
            setStakedBalances((prev) => ({
              ...prev,
              [config.lpTokenAddress]: {
                balance: '0',
                isLoading: false,
                error: false,
                needsKey: true,
              },
            }));
            continue;
          }

          const queryMsg: LPStakingQueryMsg = {
            balance: {
              address: address,
              key: viewingKey,
            },
          };

          const result = await client.query.compute.queryContract({
            contract_address: config.stakingContractAddress,
            code_hash: config.stakingContractCodeHash,
            query: queryMsg,
          });

          const parsedResult = result as LPStakingQueryAnswer;

          if (isBalanceResponse(parsedResult)) {
            // Convert from raw balance to human-readable format (assuming 6 decimals)
            const rawBalance = parsedResult.balance.amount;
            const humanBalance = (Number(rawBalance) / 1_000_000).toString();

            setStakedBalances((prev) => ({
              ...prev,
              [config.lpTokenAddress]: {
                balance: humanBalance,
                isLoading: false,
                error: false,
                needsKey: false,
              },
            }));
          } else if (isQueryErrorResponse(parsedResult)) {
            throw new Error(`Query error: ${parsedResult.query_error.msg}`);
          } else {
            throw new Error(`Unexpected response format: ${JSON.stringify(result)}`);
          }
        } catch (e: unknown) {
          console.error(`Failed to fetch staked balance for ${config.lpTokenAddress}`, e);
          const needsKey =
            e instanceof Error &&
            (e.message?.toLowerCase().includes('viewing key') ||
              e.message?.toLowerCase().includes('unauthorized'));
          setStakedBalances((prev) => ({
            ...prev,
            [config.lpTokenAddress]: {
              balance: '0',
              isLoading: false,
              error: true,
              needsKey: !!needsKey,
            },
          }));
        }
      }
    },
    []
  );

  // 5. Effect to trigger staked balance fetch
  useEffect(() => {
    if (secretjs && walletAddress) {
      const configsWithStaking = memoizedConfigs.filter((c) => c.stakingContractAddress);
      if (configsWithStaking.length > 0) {
        fetchStakedBalances(secretjs, walletAddress, configsWithStaking);
      }
    } else {
      setStakedBalances((prev) => {
        const next = { ...prev };
        for (const key in prev) {
          const current = prev[key];
          next[key] = {
            balance: current?.balance || '0',
            isLoading: false,
            error: current?.error || false,
            needsKey: current?.needsKey || false,
          };
        }
        return next;
      });
    }
  }, [secretjs, walletAddress, memoizedConfigs, fetchStakedBalances]);

  // Create stable retry functions for each staked balance
  const retryStakedFunctions = useMemo(() => {
    const functions: Record<string, () => void> = {};
    memoizedConfigs.forEach((config) => {
      if (config.stakingContractAddress) {
        functions[config.lpTokenAddress] = () => {
          if (secretjs && walletAddress) {
            fetchStakedBalances(secretjs, walletAddress, [config]);
          }
        };
      }
    });
    return functions;
  }, [memoizedConfigs, fetchStakedBalances, secretjs, walletAddress]);

  // 6. Combine LP and Staked balances into the final result
  const combinedBalances = useMemo((): MultiplePoolBalances => {
    return Object.fromEntries(
      memoizedConfigs.map((config) => {
        const lpData = lpBalances[config.lpTokenAddress] || DEFAULT_LP_DATA;
        const stakedData = stakedBalances[config.lpTokenAddress] || DEFAULT_STAKED_DATA;

        const hasLp = parseFloat(lpData.balance) > 0;
        const hasStaked = parseFloat(stakedData.balance) > 0;

        return [
          config.lpTokenAddress,
          {
            lpTokenAddress: config.lpTokenAddress,
            lpBalance: lpData.balance,
            stakedBalance: stakedData.balance,
            lpLoading: lpData.loading,
            stakedLoading: stakedData.isLoading,
            lpNeedsViewingKey: lpData.needsViewingKey,
            stakedNeedsViewingKey: stakedData.needsKey,
            lpError: !!lpData.error,
            stakedError: stakedData.error,
            hasAnyBalance: hasLp || hasStaked,
            retryLpBalance: lpData.refetch,
            retryStakedBalance: retryStakedFunctions[config.lpTokenAddress] || NO_OP,
          },
        ];
      })
    );
  }, [lpBalances, stakedBalances, memoizedConfigs, retryStakedFunctions]);

  return combinedBalances;
};
