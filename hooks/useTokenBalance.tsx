import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { SecretString } from '@/types';
import { useCallback, useEffect, useMemo } from 'react';

// Keep the error enum for backward compatibility
export enum TokenBalanceError {
  NO_KEPLR = 'NO_KEPLR',
  NO_VIEWING_KEY = 'NO_VIEWING_KEY',
  VIEWING_KEY_REJECTED = 'VIEWING_KEY_REJECTED',
  NO_SECRET_JS = 'NO_SECRET_JS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Helper function to convert string errors to TokenBalanceError enum
function mapStringToTokenBalanceError(errorString: string | null): TokenBalanceError | null {
  if (!errorString) return null;

  const lowerError = errorString.toLowerCase();

  if (lowerError.includes('keplr') || lowerError.includes('wallet not connected')) {
    return TokenBalanceError.NO_KEPLR;
  }
  if (lowerError.includes('viewing key') || lowerError.includes('set viewing key')) {
    return TokenBalanceError.NO_VIEWING_KEY;
  }
  if (lowerError.includes('rejected')) {
    return TokenBalanceError.VIEWING_KEY_REJECTED;
  }
  if (lowerError.includes('network')) {
    return TokenBalanceError.NETWORK_ERROR;
  }

  return TokenBalanceError.UNKNOWN_ERROR;
}

interface UseTokenBalanceReturn {
  amount: string | null; // Keep "amount" for backward compatibility, "-" becomes null, "0" stays "0"
  balance: string; // "-" for unfetched, "0" for actual zero balance, actual balance otherwise
  loading: boolean;
  error: TokenBalanceError | null; // Convert string errors back to enum for compatibility
  needsViewingKey: boolean;
  refetch: () => void;
  suggestToken: () => void;
  retryWithViewingKey: () => void;
}

// Create a stable, default object OUTSIDE the hook.
const DEFAULT_BALANCE_STATE = {
  balance: '-',
  loading: false,
  error: null,
  lastUpdated: 0,
  needsViewingKey: false,
};

/**
 * Centralized token balance hook that uses the balance fetcher store
 * Supports both regular tokens and LP tokens
 *
 * @param tokenAddress - The token address to fetch balance for
 * @param caller - The caller string for tracing purposes
 * @param autoFetch - Whether to automatically fetch balance when hook mounts (default: true)
 */
export function useTokenBalance(
  tokenAddress: SecretString | undefined,
  caller: string,
  autoFetch: boolean = true
): UseTokenBalanceReturn {
  // FIX 1: Use stable selectors instead of getState() to prevent unstable function references.
  const addToQueue = useBalanceFetcherStore((state) => state.addToQueue);
  const suggestTokenAction = useBalanceFetcherStore((state) => state.suggestToken);
  const retryWithViewingKeyAction = useBalanceFetcherStore((state) => state.retryWithViewingKey);

  // FIX 2: The root cause of the loop. The selector now returns a STABLE default object.
  const balanceState = useBalanceFetcherStore((state) => {
    if (!tokenAddress) {
      return DEFAULT_BALANCE_STATE;
    }
    return state.balances[tokenAddress] ?? DEFAULT_BALANCE_STATE;
  });

  // Memoized refetch function
  const refetch = useCallback(() => {
    if (tokenAddress) {
      addToQueue(tokenAddress, caller);
    }
  }, [tokenAddress, addToQueue, caller]);

  // Memoized suggest token function
  const suggestToken = useCallback(() => {
    if (tokenAddress) {
      void suggestTokenAction(tokenAddress);
    }
  }, [tokenAddress, suggestTokenAction]);

  // Memoized retry with viewing key function
  const retryWithViewingKey = useCallback(() => {
    if (tokenAddress) {
      void retryWithViewingKeyAction(tokenAddress);
    }
  }, [tokenAddress, retryWithViewingKeyAction]);

  // Auto-fetch balance when component mounts (if enabled)
  useEffect(() => {
    if (autoFetch && tokenAddress) {
      addToQueue(tokenAddress, caller);
    }
  }, [autoFetch, tokenAddress, addToQueue, caller]);

  // Convert balance format for backward compatibility
  const amount = balanceState.balance === '-' ? null : balanceState.balance;
  const error = mapStringToTokenBalanceError(balanceState.error);

  return {
    amount, // For backward compatibility
    balance: balanceState.balance, // New format
    loading: balanceState.loading,
    error, // Converted to enum for backward compatibility
    needsViewingKey: balanceState.needsViewingKey,
    refetch,
    suggestToken,
    retryWithViewingKey,
  };
}

/**
 * Hook for fetching multiple token balances at once
 * Returns a map of token addresses to their balance states
 *
 * @param tokenAddresses - Array of token addresses to fetch balances for
 * @param caller - The caller string for tracing purposes
 * @param autoFetch - Whether to automatically fetch balances when hook mounts (default: true)
 */
export function useMultipleTokenBalances(
  tokenAddresses: (SecretString | undefined)[],
  caller: string,
  autoFetch: boolean = true
): Record<string, UseTokenBalanceReturn> {
  // FIX 1: Use stable selectors instead of getState() here as well.
  const addToQueue = useBalanceFetcherStore((state) => state.addToQueue);
  const suggestTokenAction = useBalanceFetcherStore((state) => state.suggestToken);
  const retryWithViewingKeyAction = useBalanceFetcherStore((state) => state.retryWithViewingKey);

  // Memoize valid addresses to prevent re-renders
  const stringifiedAddresses = JSON.stringify(tokenAddresses.filter(Boolean).sort());
  const validAddresses = useMemo(
    () => tokenAddresses.filter((addr): addr is SecretString => !!addr),
    [stringifiedAddresses]
  );

  // SUBSCRIBE to the entire balances object. This is less optimal but avoids the unstable selector issue.
  const allBalances = useBalanceFetcherStore((state) => state.balances);

  // CREATE the specific slice we need for this component using useMemo.
  // This will only re-run when allBalances (from the store) or validAddresses (from props) changes.
  const balanceStates = useMemo(() => {
    const states: Record<string, (typeof allBalances)[string]> = {};
    validAddresses.forEach((address) => {
      states[address] = allBalances[address] ?? DEFAULT_BALANCE_STATE;
    });
    return states;
  }, [allBalances, validAddresses]);

  // Auto-fetch balances when component mounts (if enabled)
  useEffect(() => {
    if (autoFetch && validAddresses.length > 0) {
      validAddresses.forEach((address) => addToQueue(address, `${caller}:${address.slice(-6)}`));
    }
  }, [autoFetch, validAddresses, addToQueue, caller]);

  // FIX 3: Memoize the callback functions for each token to ensure they are stable
  const callbacks = useMemo(() => {
    const cbs: Record<
      string,
      {
        refetch: () => void;
        suggestToken: () => void;
        retryWithViewingKey: () => void;
      }
    > = {};
    validAddresses.forEach((tokenAddress) => {
      cbs[tokenAddress] = {
        refetch: () => addToQueue(tokenAddress, `${caller}:${tokenAddress.slice(-6)}`),
        suggestToken: () => void suggestTokenAction(tokenAddress),
        retryWithViewingKey: () => void retryWithViewingKeyAction(tokenAddress),
      };
    });
    return cbs;
  }, [validAddresses, caller, addToQueue, suggestTokenAction, retryWithViewingKeyAction]);

  // FIX 4: Memoize the final result object
  return useMemo(() => {
    const result: Record<string, UseTokenBalanceReturn> = {};
    validAddresses.forEach((tokenAddress) => {
      const balanceState = balanceStates[tokenAddress] ?? DEFAULT_BALANCE_STATE;
      const amount = balanceState.balance === '-' ? null : balanceState.balance;
      const error = mapStringToTokenBalanceError(balanceState.error);

      result[tokenAddress] = {
        amount, // For backward compatibility
        balance: balanceState.balance,
        loading: balanceState.loading,
        error, // Converted to enum for backward compatibility
        needsViewingKey: balanceState.needsViewingKey,
        ...(callbacks[tokenAddress] || {}), // Spread the stable callbacks
      } as UseTokenBalanceReturn;
    });
    return result;
  }, [validAddresses, balanceStates, callbacks]);
}
