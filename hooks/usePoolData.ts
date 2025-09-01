import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { FetcherTaskType, useGlobalFetcherStore } from '@/store/globalFetcherStore';
import { getAllStakingPools } from '@/utils/staking/stakingRegistry';
import { useEffect, useMemo } from 'react';

export interface PoolData {
  isLoading: boolean;
  tvlLoading: boolean; // Separate TVL loading state
  error: string | null;
  tvlError: string | null; // Separate TVL error state
  lpBalance: string | null;
  stakedBalance: string | null;
  tvl: number | null;
  hasLpBalance: boolean;
  hasStakedBalance: boolean;
  hasAnyBalance: boolean;
  lpNeedsViewingKey: boolean;
  stakedNeedsViewingKey: boolean;
  retryLpBalance: () => void;
  retryStakedBalance: () => void;
}

export function usePoolData(poolAddress: string, caller: string): PoolData {
  const enqueueTask = useGlobalFetcherStore((state) => state.enqueueTask);
  const setSecretjs = useGlobalFetcherStore((state) => state.setSecretjs);
  const { secretjs } = useKeplrConnection();

  // Update secretjs in the store when it changes
  useEffect(() => {
    setSecretjs(secretjs);
  }, [secretjs, setSecretjs]);

  // Get pool configuration
  const poolConfig = useMemo(() => {
    const pairInfo = LIQUIDITY_PAIRS.find((p) => p.pairContract === poolAddress);
    const stakingInfo = getAllStakingPools().find((s) => s.poolAddress === poolAddress);

    return {
      lpTokenAddress: pairInfo?.lpToken,
      stakingContractAddress: stakingInfo?.stakingInfo.stakingAddress,
      stakingContractCodeHash: stakingInfo?.stakingInfo.stakingCodeHash,
      pairInfo,
      stakingInfo,
    };
  }, [poolAddress]);

  // Enqueue the single bundled task on component mount
  useEffect(() => {
    if (poolConfig.lpTokenAddress && secretjs) {
      enqueueTask(
        {
          type: FetcherTaskType.POOL_DATA_BUNDLE,
          key: poolAddress,
          caller,
        },
        'high'
      ); // Use high priority for visible components
    }
  }, [poolAddress, caller, enqueueTask, poolConfig.lpTokenAddress, secretjs]);

  // FIXED: Use stable selectors instead of creating new objects
  // Subscribe to the whole, stable state objects
  const tokenBalances = useGlobalFetcherStore((state) => state.tokenBalances);
  const stakedBalances = useGlobalFetcherStore((state) => state.stakedBalances);
  const poolTvl = useGlobalFetcherStore((state) => state.poolTvl);

  // Compute the specific data we need in useMemo
  const { lpState, stakedState, tvlState } = useMemo(() => {
    return {
      lpState: poolConfig.lpTokenAddress ? tokenBalances[poolConfig.lpTokenAddress] : null,
      stakedState: poolConfig.stakingContractAddress
        ? stakedBalances[poolConfig.stakingContractAddress]
        : null,
      tvlState: poolTvl[poolAddress],
    };
  }, [
    tokenBalances,
    stakedBalances,
    poolTvl,
    poolConfig.lpTokenAddress,
    poolConfig.stakingContractAddress,
    poolAddress,
  ]);

  // Memoize the final, combined state object for the UI.
  // The component will only re-render when this combined object changes.
  return useMemo(() => {
    // FIXED: Separate TVL loading from balance loading
    // TVL should load independently of viewing key requirements
    const balancesLoading =
      (lpState?.loading ?? true) ||
      (poolConfig.stakingContractAddress ? stakedState?.loading ?? true : false);

    const tvlLoading = tvlState?.loading ?? true;

    // For the main "isLoading" state, only consider balances
    // TVL will have its own loading state that components can check separately
    const isLoading = balancesLoading;

    // Combine errors - but don't let viewing key errors from balances affect TVL
    const balanceError = lpState?.error || stakedState?.error || null;
    const tvlError = tvlState?.error || null;

    // Only show balance errors as the main error (viewing key issues shouldn't block TVL display)
    const error = balanceError;

    // Check if balances have been fetched (lastUpdated > 0)
    const hasLpBalance = (lpState?.lastUpdated ?? 0) > 0;
    const hasStakedBalance = (stakedState?.lastUpdated ?? 0) > 0;
    const hasAnyBalance = hasLpBalance || hasStakedBalance;

    // Retry functions
    const retryLpBalance = () => {
      if (poolConfig.lpTokenAddress) {
        enqueueTask(
          {
            type: FetcherTaskType.TOKEN_BALANCE,
            key: poolConfig.lpTokenAddress,
            caller: `${caller}:retry`,
          },
          'high'
        );
      }
    };

    const retryStakedBalance = () => {
      if (poolConfig.stakingContractAddress) {
        enqueueTask(
          {
            type: FetcherTaskType.POOL_DATA_BUNDLE,
            key: poolAddress,
            caller: `${caller}:retry`,
          },
          'high'
        );
      }
    };

    return {
      isLoading,
      tvlLoading,
      error,
      tvlError,
      lpBalance: lpState?.value ?? null,
      stakedBalance: stakedState?.value ?? null,
      tvl: tvlState?.value?.totalUsd ?? null,
      hasLpBalance,
      hasStakedBalance,
      hasAnyBalance,
      lpNeedsViewingKey: lpState?.needsViewingKey ?? false,
      stakedNeedsViewingKey: stakedState?.needsViewingKey ?? false,
      retryLpBalance,
      retryStakedBalance,
    };
  }, [lpState, stakedState, tvlState, poolConfig, poolAddress, caller, enqueueTask]);
}
