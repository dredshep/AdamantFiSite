import { balanceService } from '@/services/balanceService';
import { useBalanceStore } from '@/store/balanceStore';
import { SecretString } from '@/types';
import { useCallback, useEffect, useMemo } from 'react';

// How long to consider a balance fresh before potentially re-fetching
const BALANCE_CACHE_DURATION = 30000; // 30 seconds

/**
 * Provides the balance for a given token address from the central store.
 * It automatically requests a fetch if the balance is missing or stale.
 *
 * @param address The secret-1 address of the token.
 * @returns The balance status { amount, loading, error } and a refetch function.
 */
export const useBalance = (address: SecretString | undefined) => {
  const balanceData = useBalanceStore((state) => (address ? state.balances[address] : undefined));

  useEffect(() => {
    if (!address) {
      return;
    }

    // Don't fetch if it's already loading
    if (balanceData?.loading) {
      return;
    }

    // Determine if data is stale
    const isStale =
      !balanceData?.lastUpdated || Date.now() - balanceData.lastUpdated > BALANCE_CACHE_DURATION;

    // Fetch if the data doesn't exist or is stale
    if (!balanceData || isStale) {
      balanceService.requestBalanceFetch(address);
    }
  }, [address, balanceData]);

  const refetch = useCallback(() => {
    if (address && !balanceData?.loading) {
      balanceService.requestBalanceFetch(address);
    }
  }, [address, balanceData?.loading]);

  return useMemo(
    () => ({
      amount: balanceData?.amount ?? null,
      loading: balanceData?.loading ?? false,
      error: balanceData?.error ?? null,
      refetch,
    }),
    [balanceData, refetch]
  );
};
