import { useWalletStore } from '@/store/walletStore';
import {
  LPStakingQueryAnswer,
  LPStakingQueryMsg,
  isBalanceResponse,
  isQueryErrorResponse,
} from '@/types/secretswap/lp-staking';
import { Window as KeplrWindow } from '@keplr-wallet/types';
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
  lastUpdated: 0,
  refetch: () => {},
};

// Define a stable default for staked data
const DEFAULT_STAKED_DATA = {
  balance: '0',
  isLoading: true,
  error: false,
  needsKey: false,
  lastUpdated: 0,
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
  hasLpBalance: boolean;
  hasStakedBalance: boolean;
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
    Record<
      string,
      {
        balance: string;
        isLoading: boolean;
        error: boolean;
        needsKey: boolean;
        lastUpdated: number;
      }
    >
  >(
    Object.fromEntries(
      configs.map((c) => [
        c.lpTokenAddress,
        {
          balance: '0',
          // Only set loading to true if there's actually a staking contract to fetch from
          isLoading: !!(c.stakingContractAddress && c.stakingContractCodeHash),
          error: false,
          needsKey: false,
          lastUpdated: 0,
        },
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
          if (config.stakingContractAddress && config.stakingContractCodeHash) {
            const current = prev[config.lpTokenAddress] || {
              balance: '0',
              isLoading: true,
              error: false,
              needsKey: false,
              lastUpdated: 0,
            };
            next[config.lpTokenAddress] = {
              ...current,
              isLoading: true,
              error: false,
              needsKey: false,
            };
          } else {
            // For tokens without staking contracts, ensure they're not loading
            next[config.lpTokenAddress] = {
              balance: '0',
              isLoading: false,
              error: false,
              needsKey: false,
              lastUpdated: 0,
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
              ...(prev[config.lpTokenAddress] || DEFAULT_STAKED_DATA),
              isLoading: false,
            },
          }));
          continue;
        }

        try {
          // Try to get viewing key from Keplr
          const { keplr } = window as unknown as KeplrWindow;
          if (!keplr) {
            throw new Error('Keplr not found');
          }

          let viewingKey: string;
          try {
            viewingKey = await keplr.getSecret20ViewingKey(
              'secret-4',
              config.stakingContractAddress
            );
          } catch (_viewingKeyError) {
            // If no viewing key, set needsKey flag
            setStakedBalances((prev) => ({
              ...prev,
              [config.lpTokenAddress]: {
                ...(prev[config.lpTokenAddress] || DEFAULT_STAKED_DATA),
                isLoading: false,
                needsKey: true,
                lastUpdated: Date.now(),
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
                lastUpdated: Date.now(),
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
              ...(prev[config.lpTokenAddress] || DEFAULT_STAKED_DATA),
              isLoading: false,
              error: true,
              needsKey: !!needsKey,
              lastUpdated: Date.now(),
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
      const configsWithStaking = memoizedConfigs.filter(
        (c) => c.stakingContractAddress && c.stakingContractCodeHash
      );
      if (configsWithStaking.length > 0) {
        void fetchStakedBalances(secretjs, walletAddress, configsWithStaking);
      }
    } else {
      setStakedBalances((prev) => {
        const next = { ...prev };
        for (const config of memoizedConfigs) {
          const current = prev[config.lpTokenAddress];
          next[config.lpTokenAddress] = {
            balance: current?.balance || '0',
            // Only keep loading state if there's a staking contract and we just don't have connection yet
            isLoading:
              !!(config.stakingContractAddress && config.stakingContractCodeHash) && !secretjs,
            error: current?.error || false,
            needsKey: current?.needsKey || false,
            lastUpdated: current?.lastUpdated || 0,
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
      if (config.stakingContractAddress && config.stakingContractCodeHash) {
        functions[config.lpTokenAddress] = () => {
          if (secretjs && walletAddress) {
            void fetchStakedBalances(secretjs, walletAddress, [config]);
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

        // Simplified state derivation
        const isLoading = lpData.loading || stakedData.isLoading;

        // Consolidate error states
        const hasLpError = lpData.lastUpdated > 0 && !!lpData.error;
        const hasStakedError = stakedData.lastUpdated > 0 && stakedData.error;

        // Consolidate viewing key requirements
        const needsLpKey = lpData.needsViewingKey;
        const needsStakingKey = stakedData.needsKey;

        // A balance is considered "present" if it has been fetched (lastUpdated > 0).
        const hasLpBalance = lpData.lastUpdated > 0;
        const hasStakedBalance = stakedData.lastUpdated > 0;
        const hasAnyBalance = hasLpBalance || hasStakedBalance;

        return [
          config.lpTokenAddress,
          {
            lpTokenAddress: config.lpTokenAddress,
            lpBalance: lpData.balance,
            stakedBalance: stakedData.balance,
            lpLoading: isLoading, // Use the combined loading state
            stakedLoading: isLoading, // Use the combined loading state
            lpNeedsViewingKey: needsLpKey,
            stakedNeedsViewingKey: needsStakingKey,
            lpError: hasLpError,
            stakedError: hasStakedError,
            hasAnyBalance,
            hasLpBalance,
            hasStakedBalance,
            retryLpBalance: lpData.refetch,
            retryStakedBalance: retryStakedFunctions[config.lpTokenAddress] || NO_OP,
          },
        ];
      })
    );
  }, [lpBalances, stakedBalances, memoizedConfigs, retryStakedFunctions]);

  return combinedBalances;
};
