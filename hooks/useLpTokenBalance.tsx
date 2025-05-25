import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { SecretString } from '@/types';
import { getSecretNetworkEnvVars, LoadBalancePreference } from '@/utils/env';
import { Window } from '@keplr-wallet/types';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useSecretNetwork } from './useSecretNetwork';

export enum LpTokenBalanceError {
  NO_KEPLR = 'NO_KEPLR',
  NO_VIEWING_KEY = 'NO_VIEWING_KEY',
  VIEWING_KEY_REJECTED = 'VIEWING_KEY_REJECTED',
  NO_SECRET_JS = 'NO_SECRET_JS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  LP_TOKEN_NOT_FOUND = 'LP_TOKEN_NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface LpTokenBalanceHookReturn {
  amount: string | null;
  loading: boolean;
  error: LpTokenBalanceError | null;
  refetch: () => Promise<void>;
  suggestToken: () => Promise<void>;
}

export function useLpTokenBalance(
  lpTokenAddress: SecretString | undefined
): LpTokenBalanceHookReturn {
  const { secretjs } = useSecretNetwork();
  const [amount, setAmount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LpTokenBalanceError | null>(null);

  // Find LP token info from LIQUIDITY_PAIRS config
  const lpTokenInfo = lpTokenAddress
    ? LIQUIDITY_PAIRS.find((pair) => pair.lpToken === lpTokenAddress)
    : null;

  const suggestToken = useCallback(async () => {
    if (!lpTokenAddress || !lpTokenInfo) {
      setError(LpTokenBalanceError.LP_TOKEN_NOT_FOUND);
      return;
    }

    try {
      const keplr = (window as unknown as Window).keplr;
      if (!keplr) {
        setError(LpTokenBalanceError.NO_KEPLR);
        toast.error('Please install the Keplr extension');
        return;
      }

      await keplr.suggestToken('secret-4', lpTokenAddress);
      toast.success('LP token suggested to Keplr successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        setError(LpTokenBalanceError.VIEWING_KEY_REJECTED);
        toast.error('Token suggestion was rejected');
      } else {
        setError(LpTokenBalanceError.UNKNOWN_ERROR);
        toast.error('Failed to suggest LP token to Keplr');
      }
    }
  }, [lpTokenAddress, lpTokenInfo]);

  const fetchBalance = useCallback(
    async (isManual = false) => {
      if (!lpTokenAddress || !lpTokenInfo || !secretjs) {
        return;
      }

      // Check environment preference (only for automatic fetches)
      if (!isManual) {
        try {
          const envVars = getSecretNetworkEnvVars();
          if (envVars.LOAD_BALANCE_PREFERENCE === LoadBalancePreference.None) {
            return;
          }
        } catch (error) {
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const keplr = (window as unknown as Window).keplr;
        if (!keplr) {
          setError(LpTokenBalanceError.NO_KEPLR);
          return;
        }

        let viewingKey = await keplr
          .getSecret20ViewingKey('secret-4', lpTokenAddress)
          .catch(() => null);

        if (viewingKey === null) {
          await keplr.suggestToken('secret-4', lpTokenAddress);
          viewingKey = await keplr
            .getSecret20ViewingKey('secret-4', lpTokenAddress)
            .catch(() => null);
        }

        if (viewingKey === null) {
          setError(LpTokenBalanceError.NO_VIEWING_KEY);
          return;
        }

        const balance = await secretjs.query.snip20.getBalance({
          contract: {
            address: lpTokenAddress,
            code_hash: lpTokenInfo.lpTokenCodeHash,
          },
          address: secretjs.address,
          auth: { key: viewingKey },
        });

        if (
          balance !== undefined &&
          balance !== null &&
          typeof balance === 'object' &&
          'balance' in balance &&
          balance.balance !== undefined &&
          balance.balance !== null &&
          typeof balance.balance === 'object' &&
          'amount' in balance.balance &&
          typeof balance.balance.amount === 'string'
        ) {
          const rawAmount = parseInt(balance.balance.amount);
          const displayAmount = (rawAmount / 1_000_000).toString();
          setAmount(displayAmount);
          setError(null);
        } else {
          setError(LpTokenBalanceError.UNKNOWN_ERROR);
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('viewing key')) {
            setError(LpTokenBalanceError.NO_VIEWING_KEY);
          } else if (error.message.includes('network')) {
            setError(LpTokenBalanceError.NETWORK_ERROR);
          } else {
            setError(LpTokenBalanceError.UNKNOWN_ERROR);
          }
        } else {
          setError(LpTokenBalanceError.UNKNOWN_ERROR);
        }
      } finally {
        setLoading(false);
      }
    },
    [lpTokenAddress, lpTokenInfo, secretjs]
  );

  // Auto-fetch balance when dependencies are ready
  useEffect(() => {
    if (lpTokenAddress && lpTokenInfo && secretjs) {
      void fetchBalance();
    }
  }, [fetchBalance]);

  return {
    amount,
    loading,
    error,
    refetch: () => fetchBalance(true),
    suggestToken,
  };
}
