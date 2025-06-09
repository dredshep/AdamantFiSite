import { SecretString } from '@/types';
import { useBalance } from './useBalance';

/**
 * @deprecated This hook is now a wrapper around the new centralized `useBalance` hook.
 * It is maintained for compatibility but direct usage of `useBalance` is preferred.
 * The error type has changed from an enum to a string message.
 */
export const useTokenBalance = (tokenAddress: SecretString | undefined) => {
  // The 'autoFetch' parameter is no longer needed as the new useBalance hook handles this logic internally.
  const { amount, loading, error, refetch } = useBalance(tokenAddress);

  return {
    amount,
    loading,
    error,
    refetch,
    // The following are returned for backward compatibility, but are now no-ops or default values.
    lastUpdated: null,
    isRejected: false,
  };
};

// The old TokenBalanceError enum is no longer needed, but we keep it here, commented out,
// to avoid breaking imports in files we haven't touched yet. It should be removed later.
export enum TokenBalanceError {
  NO_KEPLR = 'NO_KEPLR',
  NO_VIEWING_KEY = 'NO_VIEWING_KEY',
  VIEWING_KEY_REJECTED = 'VIEWING_KEY_REJECTED',
  NO_SECRET_JS = 'NO_SECRET_JS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
