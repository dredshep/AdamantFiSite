import { useWalletStore } from '@/store/walletStore';
import { useCallback, useEffect, useState } from 'react';
import { getSecretClient } from './useSecretNetwork';

export interface NativeSCRTBalance {
  balance: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useNativeSCRTBalance = (): NativeSCRTBalance => {
  const { address: walletAddress } = useWalletStore();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance('0');
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = getSecretClient();
      const result = await client.query.bank.balance({
        address: walletAddress,
        denom: 'uscrt',
      });

      // Convert from uscrt (6 decimals) to SCRT
      const balanceInUSCRT = result.balance?.amount || '0';
      const balanceInSCRT = (Number(balanceInUSCRT) / 1_000_000).toString();

      // Debug logging (remove in production)
      // console.log('🐛 Native SCRT Balance Debug:', {
      //   walletAddress,
      //   rawResult: result,
      //   balanceInUSCRT,
      //   balanceInSCRT,
      // });

      setBalance(balanceInSCRT);
    } catch (err) {
      console.error('Error fetching native SCRT balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch SCRT balance');
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Auto-fetch when wallet address changes
  useEffect(() => {
    void fetchBalance();
  }, [walletAddress, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: () => void fetchBalance(),
  };
};
