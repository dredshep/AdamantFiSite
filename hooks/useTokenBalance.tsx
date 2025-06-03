import { TokenService } from '@/services/secret/TokenService';
import { useTokenBalanceStore } from '@/store/tokenBalanceStore';
import { useTokenStore } from '@/store/tokenStore';
import { SecretString } from '@/types';
import { getSecretNetworkEnvVars, LoadBalancePreference } from '@/utils/env';
import { toastManager } from '@/utils/toast/toastManager';
import { getTokenDecimals } from '@/utils/token/tokenInfo';
import { Keplr, Window } from '@keplr-wallet/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useSecretNetwork } from './useSecretNetwork';

const REFRESH_INTERVAL = 30000; // 30 seconds

export enum TokenBalanceError {
  NO_KEPLR = 'NO_KEPLR',
  NO_VIEWING_KEY = 'NO_VIEWING_KEY',
  VIEWING_KEY_REJECTED = 'VIEWING_KEY_REJECTED',
  NO_SECRET_JS = 'NO_SECRET_JS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// interface ErrorConfig {
//   title: string;
//   message: string;
//   actionLabel?: string;
//   onAction?: () => void;
// }

interface TokenBalanceHookReturn {
  amount: string | null;
  loading: boolean;
  error: TokenBalanceError | null;
  lastUpdated: number | null;
  refetch: () => Promise<void>;
  isRejected: boolean;
}

// const ERROR_MESSAGES: Record<TokenBalanceError, ErrorConfig> = {
//   [TokenBalanceError.NO_KEPLR]: {
//     title: 'Keplr Not Found',
//     message: 'Please install Keplr wallet to view your balance',
//     actionLabel: 'Install Keplr',
//     onAction: () => window.open('https://www.keplr.app/download', '_blank'),
//   },
//   [TokenBalanceError.NO_VIEWING_KEY]: {
//     title: 'Viewing Key Required',
//     message: 'A viewing key is needed to see your balance',
//     actionLabel: 'Learn More',
//     onAction: () =>
//       window.open(
//         'https://docs.scrt.network/secret-network-documentation/development/development-concepts/viewing-keys',
//         '_blank'
//       ),
//   },
//   [TokenBalanceError.VIEWING_KEY_REJECTED]: {
//     title: 'Viewing Key Rejected',
//     message: 'You rejected the viewing key request. Click to try again.',
//     actionLabel: 'Try Again',
//     onAction: () => {},
//   },
//   [TokenBalanceError.NO_SECRET_JS]: {
//     title: 'Connection Error',
//     message: 'Not connected to Secret Network. Please refresh the page.',
//   },
//   [TokenBalanceError.NETWORK_ERROR]: {
//     title: 'Network Error',
//     message: 'Unable to fetch your balance. Please check your connection',
//   },
//   [TokenBalanceError.UNKNOWN_ERROR]: {
//     title: 'Unknown Error',
//     message: 'An unexpected error occurred while fetching your balance',
//   },
// };

export function useTokenBalance(
  tokenAddress: SecretString | undefined,
  autoFetch: boolean = false
): TokenBalanceHookReturn {
  const { secretjs } = useSecretNetwork();
  const { setBalance, getBalance, setLoading, setError } = useTokenBalanceStore();
  const [isRejected, setIsRejected] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const lastFetchTime = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rate limiting: minimum 2 seconds between calls for the same token
  const RATE_LIMIT_MS = 2000;

  const tokenService = useMemo(() => (secretjs ? new TokenService() : null), [secretjs]);

  useEffect(() => {
    const handleKeplrReady = () => {
      if (isRejected) {
        setIsRejected(false);
        toast.info('Keplr is ready. You can try fetching balance again.', {
          autoClose: 3000,
          toastId: 'keplr-ready',
        });
      }
    };

    window.addEventListener('keplr_keystorechange', handleKeplrReady);
    return () => window.removeEventListener('keplr_keystorechange', handleKeplrReady);
  }, [isRejected]);

  const fetchBalance = useCallback(async () => {
    if (
      typeof tokenAddress !== 'string' ||
      tokenAddress.length === 0 ||
      !secretjs ||
      !tokenService
    ) {
      return;
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastFetchTime.current < RATE_LIMIT_MS) {
      return; // Skip if called too recently
    }

    // Prevent concurrent calls
    if (isFetching) {
      return;
    }

    if (isRejected) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    setIsFetching(true);
    lastFetchTime.current = now;
    setIsRejected(false);
    setLoading(tokenAddress, true);

    try {
      tokenService.clearRejectedViewingKey(tokenAddress);

      // Get token from token store
      const token = useTokenStore.getState().getTokenByAddress(tokenAddress);

      if (!token || !token.codeHash) {
        console.error(`Code hash not found for token: ${tokenAddress}`);
        setError(tokenAddress, TokenBalanceError.UNKNOWN_ERROR);
        return;
      }

      const tokenCodeHash = token.codeHash;
      const rawAmount = await tokenService.getBalance(tokenAddress, tokenCodeHash);
      const decimals = getTokenDecimals(tokenAddress);
      const value = Number(rawAmount) / Math.pow(10, decimals);

      setBalance(tokenAddress, {
        amount: value.toString(),
        loading: false,
        lastUpdated: Date.now(),
        error: null,
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log('Error caught in useTokenBalance:', err.message);

        if (err.message.includes('Viewing key request rejected')) {
          toastManager.viewingKeyRejected(() => {
            setIsRejected(false);
            void fetchBalance();
          });
          setBalance(tokenAddress, {
            amount: null,
            loading: false,
            lastUpdated: 0,
            error: null,
          });
          return;
        }

        let errorType = TokenBalanceError.UNKNOWN_ERROR;
        if (err.message.includes('Keplr not installed')) {
          errorType = TokenBalanceError.NO_KEPLR;
          toastManager.keplrNotInstalled();
        } else if (err.message.includes('Viewing key required')) {
          errorType = TokenBalanceError.NO_VIEWING_KEY;
          toastManager.viewingKeyRequired();
        } else if (err.message.includes('network')) {
          errorType = TokenBalanceError.NETWORK_ERROR;
          toastManager.networkError();
        } else {
          toastManager.balanceFetchError();
        }

        setError(tokenAddress, errorType);
      }
    } finally {
      setIsFetching(false);
    }
  }, [tokenService, tokenAddress, secretjs, setBalance, setLoading, setError, isRejected]);

  // const showErrorToast = useCallback(
  //   (errorType: TokenBalanceError, details?: string) => {
  //     const errorKey = `${errorType}-${details ?? ''}`;
  //     console.log('Toast state:', { errorType, errorKey, toastShown });
  //     if (toastShown === errorKey) return;

  //     const errorConfig = { ...ERROR_MESSAGES[errorType] };

  //     if (
  //       errorType === TokenBalanceError.VIEWING_KEY_REJECTED &&
  //       tokenService &&
  //       typeof tokenAddress === 'string' &&
  //       tokenAddress.length > 0
  //     ) {
  //       errorConfig.onAction = () => {
  //         tokenService.clearRejectedViewingKey(tokenAddress);
  //         setToastShown(null);
  //         void fetchBalance();
  //       };
  //     }

  //     toast.error(
  //       <ErrorToast
  //         title={errorConfig.title}
  //         message={errorConfig.message}
  //         details={details}
  //         actionLabel={errorConfig.actionLabel}
  //         onActionClick={errorConfig.onAction}
  //       />,
  //       {
  //         autoClose: errorType === TokenBalanceError.VIEWING_KEY_REJECTED ? false : 6000,
  //         toastId: errorKey,
  //       }
  //     );
  //     setToastShown(errorKey);
  //   },
  //   [toastShown, tokenService, tokenAddress, fetchBalance]
  // );

  const checkViewingKey = useCallback(async () => {
    if (
      typeof tokenAddress !== 'string' ||
      tokenAddress.length === 0 ||
      !secretjs ||
      !tokenService
    ) {
      return;
    }

    try {
      const keplr: Keplr | undefined = (window as unknown as Window).keplr;

      if (!keplr) {
        toastManager.keplrNotInstalled();
        return;
      }

      try {
        const viewingKey = await keplr
          .getSecret20ViewingKey('secret-4', tokenAddress)
          .catch(() => null);

        if (typeof viewingKey === 'string' && viewingKey.length > 0) {
          // Just verify we have a viewing key, don't automatically fetch balance
          // The regular polling will handle balance fetching
          return true;
        }
      } catch (error) {
        console.log('Viewing key check failed:', error);
      }
    } catch (error) {
      console.log('Keplr check failed:', error);
    }
    return false;
  }, [tokenAddress, secretjs, tokenService]);

  useEffect(() => {
    // Only check viewing key if load balance preference allows it
    try {
      const envVars = getSecretNetworkEnvVars();
      if (envVars.LOAD_BALANCE_PREFERENCE !== LoadBalancePreference.None) {
        void checkViewingKey();
      }
    } catch (error) {
      // If env vars are not set, don't check viewing key
      console.warn('Environment variables not set, skipping viewing key check:', error);
    }
  }, [checkViewingKey]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Check environment preference first
    try {
      const envVars = getSecretNetworkEnvVars();
      const shouldFetch =
        autoFetch && envVars.LOAD_BALANCE_PREFERENCE !== LoadBalancePreference.None;

      if (!shouldFetch) return;
    } catch (error) {
      // If env vars are not set, default to not fetching
      console.warn('Environment variables not set, disabling auto-fetch:', error);
      return;
    }

    if (typeof tokenAddress !== 'string' || tokenAddress.length === 0) return;

    // Initial fetch
    void fetchBalance();

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (!isRejected && !isFetching) {
        void fetchBalance();
      }
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tokenAddress, autoFetch, isRejected, isFetching]);

  const currentBalance = getBalance(tokenAddress ?? '');

  return {
    amount: currentBalance?.amount ?? null,
    loading: currentBalance?.loading ?? false,
    error: currentBalance?.error ?? null,
    lastUpdated: currentBalance?.lastUpdated ?? null,
    refetch: fetchBalance,
    isRejected,
  };
}
