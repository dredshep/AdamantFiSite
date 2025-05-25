import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { SecretString } from '@/types';
import { getSecretNetworkEnvVars, LoadBalancePreference } from '@/utils/env';
import { Window } from '@keplr-wallet/types';
import { useCallback, useEffect, useRef, useState } from 'react';
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

// Global cache for LP token balances to prevent duplicate requests
const lpBalanceCache = new Map<
  string,
  { amount: string | null; timestamp: number; error: LpTokenBalanceError | null }
>();
const pendingLpRequests = new Map<string, Promise<void>>();

// Cache duration: 30 seconds
const LP_BALANCE_CACHE_DURATION = 30000;

export function useLpTokenBalance(
  lpTokenAddress: SecretString | undefined
): LpTokenBalanceHookReturn {
  const { secretjs } = useSecretNetwork();
  const [amount, setAmount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LpTokenBalanceError | null>(null);
  const lastFetchTime = useRef<number>(0);

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

      const cacheKey = `${lpTokenAddress}-${secretjs.address}`;

      // Check cache first (unless manual refresh)
      if (!isManual) {
        const cached = lpBalanceCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < LP_BALANCE_CACHE_DURATION) {
          console.log(`Using cached LP balance for ${lpTokenAddress}`);
          setAmount(cached.amount);
          setError(cached.error);
          return;
        }
      }

      // Check if request is already pending
      const pendingRequest = pendingLpRequests.get(cacheKey);
      if (pendingRequest) {
        console.log(`Waiting for pending LP balance request for ${lpTokenAddress}`);
        await pendingRequest;
        return;
      }

      // Rate limiting: don't fetch more than once every 5 seconds
      const now = Date.now();
      if (!isManual && now - lastFetchTime.current < 5000) {
        console.log('Rate limiting LP balance fetch');
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
      lastFetchTime.current = now;

      // Create and cache the promise
      const requestPromise = (async () => {
        try {
          // Add random delay to prevent rate limiting
          if (!isManual) {
            await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));
          }

          const keplr = (window as unknown as Window).keplr;
          if (!keplr) {
            const error = LpTokenBalanceError.NO_KEPLR;
            setError(error);
            lpBalanceCache.set(cacheKey, { amount: null, timestamp: now, error });
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
            const error = LpTokenBalanceError.NO_VIEWING_KEY;
            setError(error);
            lpBalanceCache.set(cacheKey, { amount: null, timestamp: now, error });
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

            // Cache the successful result
            lpBalanceCache.set(cacheKey, { amount: displayAmount, timestamp: now, error: null });
          } else {
            const error = LpTokenBalanceError.UNKNOWN_ERROR;
            setError(error);
            lpBalanceCache.set(cacheKey, { amount: null, timestamp: now, error });
          }
        } catch (error) {
          let errorType = LpTokenBalanceError.UNKNOWN_ERROR;

          if (error instanceof Error) {
            if (error.message.includes('viewing key')) {
              errorType = LpTokenBalanceError.NO_VIEWING_KEY;
            } else if (error.message.includes('network')) {
              errorType = LpTokenBalanceError.NETWORK_ERROR;
            }
          }

          setError(errorType);
          lpBalanceCache.set(cacheKey, { amount: null, timestamp: now, error: errorType });
        } finally {
          setLoading(false);
          pendingLpRequests.delete(cacheKey);
        }
      })();

      // Cache the promise
      pendingLpRequests.set(cacheKey, requestPromise);
      await requestPromise;
    },
    [lpTokenAddress, lpTokenInfo, secretjs]
  );

  // Auto-fetch balance when dependencies are ready (with rate limiting)
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
