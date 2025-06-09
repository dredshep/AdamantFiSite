import { balanceService } from '@/services/balanceService';
import { SecretString } from '@/types';
import { useCallback } from 'react';
import { useBalance } from './useBalance';

/**
 * @deprecated This hook is now a wrapper around the new centralized `useBalance` hook.
 * It is maintained for compatibility but direct usage of `useBalance` is preferred.
 * The error type has changed from an enum to a string message.
 */
export function useLpTokenBalance(lpTokenAddress: SecretString | undefined) {
  const { amount, loading, error, refetch } = useBalance(lpTokenAddress);

  const suggestToken = useCallback(async () => {
    if (lpTokenAddress) {
      await balanceService.requestTokenSuggestion(lpTokenAddress);
      // After suggesting, we should probably trigger a refetch
      refetch();
    }
  }, [lpTokenAddress, refetch]);

  return {
    amount,
    loading,
    error,
    refetch,
    suggestToken,
  };
}
