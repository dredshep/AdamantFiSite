import ErrorToast from '@/components/app/Shared/Toasts/ErrorToast';
import { useSecretNetworkContext } from '@/contexts/SecretNetworkContext';
import { TokenService } from '@/services/secret/TokenService';
import { useTokenBalanceStore } from '@/store/tokenBalanceStore';
import { SecretString } from '@/types';
import { getTokenDecimals } from '@/utils/apis/tokenInfo';
import { getCodeHashByAddress } from '@/utils/secretjs/tokens/getCodeHashByAddress';
import { Keplr, Window } from '@keplr-wallet/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

const REFRESH_INTERVAL = 30000; // 30 seconds

export enum TokenBalanceError {
  NO_KEPLR = 'NO_KEPLR',
  NO_VIEWING_KEY = 'NO_VIEWING_KEY',
  VIEWING_KEY_REJECTED = 'VIEWING_KEY_REJECTED',
  NO_SECRET_JS = 'NO_SECRET_JS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface ErrorConfig {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface TokenBalanceHookReturn {
  amount: string | null;
  loading: boolean;
  error: TokenBalanceError | null;
  lastUpdated: number | null;
  refetch: () => Promise<void>;
  isRejected: boolean;
}

const ERROR_MESSAGES: Record<TokenBalanceError, ErrorConfig> = {
  [TokenBalanceError.NO_KEPLR]: {
    title: 'Keplr Not Found',
    message: 'Please install Keplr wallet to view your balance',
    actionLabel: 'Install Keplr',
    onAction: () => window.open('https://www.keplr.app/download', '_blank'),
  },
  [TokenBalanceError.NO_VIEWING_KEY]: {
    title: 'Viewing Key Required',
    message: 'A viewing key is needed to see your balance',
    actionLabel: 'Learn More',
    onAction: () =>
      window.open(
        'https://docs.scrt.network/secret-network-documentation/development/development-concepts/viewing-keys',
        '_blank'
      ),
  },
  [TokenBalanceError.VIEWING_KEY_REJECTED]: {
    title: 'Viewing Key Rejected',
    message: 'You rejected the viewing key request. Click to try again.',
    actionLabel: 'Try Again',
    onAction: () => {},
  },
  [TokenBalanceError.NO_SECRET_JS]: {
    title: 'Connection Error',
    message: 'Not connected to Secret Network. Please refresh the page.',
  },
  [TokenBalanceError.NETWORK_ERROR]: {
    title: 'Network Error',
    message: 'Unable to fetch your balance. Please check your connection',
  },
  [TokenBalanceError.UNKNOWN_ERROR]: {
    title: 'Unknown Error',
    message: 'An unexpected error occurred while fetching your balance',
  },
};

export function useTokenBalance(
  tokenAddress: SecretString | undefined,
  autoFetch: boolean = false
): TokenBalanceHookReturn {
  const { secretjs } = useSecretNetworkContext();
  const { setBalance, getBalance, setLoading, setError } = useTokenBalanceStore();
  const [toastShown, setToastShown] = useState<string | null>(null);
  const [isRejected, setIsRejected] = useState(false);

  const tokenService = useMemo(() => (secretjs ? new TokenService(secretjs) : null), [secretjs]);

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

    if (isRejected) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    setIsRejected(false);
    setLoading(tokenAddress, true);

    try {
      tokenService.clearRejectedViewingKey(tokenAddress);

      const tokenCodeHash = getCodeHashByAddress(tokenAddress);
      const rawAmount = await tokenService.getBalance(tokenAddress, tokenCodeHash);
      const decimals = getTokenDecimals(tokenAddress);
      const value = Number(rawAmount) / Math.pow(10, decimals);

      setBalance(tokenAddress, {
        amount: value.toString(),
        loading: false,
        lastUpdated: Date.now(),
        error: null,
      });

      setToastShown(null);
    } catch (err) {
      if (err instanceof Error) {
        console.log('Error caught in useTokenBalance:', err.message);

        if (err.message.includes('Viewing key request rejected')) {
          const toastKey = 'viewing-key-rejected';
          if (toastShown !== toastKey) {
            toast.info('Please wait a few seconds before trying again...', {
              autoClose: 5000,
              toastId: toastKey,
            });
            setToastShown(toastKey);
          }
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
        } else if (err.message.includes('Viewing key required')) {
          errorType = TokenBalanceError.NO_VIEWING_KEY;
        } else if (err.message.includes('network')) {
          errorType = TokenBalanceError.NETWORK_ERROR;
        }

        setError(tokenAddress, errorType);
        showErrorToast(errorType, err.message);
      }
    }
  }, [tokenService, tokenAddress, secretjs, setBalance, setLoading, setError, toastShown]);

  const showErrorToast = useCallback(
    (errorType: TokenBalanceError, details?: string) => {
      const errorKey = `${errorType}-${details ?? ''}`;
      console.log('Toast state:', { errorType, errorKey, toastShown });
      if (toastShown === errorKey) return;

      const errorConfig = { ...ERROR_MESSAGES[errorType] };

      if (
        errorType === TokenBalanceError.VIEWING_KEY_REJECTED &&
        tokenService &&
        typeof tokenAddress === 'string' &&
        tokenAddress.length > 0
      ) {
        errorConfig.onAction = () => {
          tokenService.clearRejectedViewingKey(tokenAddress);
          setToastShown(null);
          void fetchBalance();
        };
      }

      toast.error(
        <ErrorToast
          title={errorConfig.title}
          message={errorConfig.message}
          details={details}
          actionLabel={errorConfig.actionLabel}
          onActionClick={errorConfig.onAction}
        />,
        {
          autoClose: errorType === TokenBalanceError.VIEWING_KEY_REJECTED ? false : 6000,
          toastId: errorKey,
        }
      );
      setToastShown(errorKey);
    },
    [toastShown, tokenService, tokenAddress, fetchBalance]
  );

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
        toast.error('Keplr not installed', {
          toastId: 'keplr-not-installed',
        });
        return;
      }

      try {
        const viewingKey = await keplr
          .getSecret20ViewingKey('secret-4', tokenAddress)
          .catch(() => null);

        if (typeof viewingKey === 'string' && viewingKey.length > 0) {
          // Try to fetch balance with the viewing key
          const tokenCodeHash = getCodeHashByAddress(tokenAddress);
          const response = await tokenService
            .getBalance(tokenAddress, tokenCodeHash)
            .catch((err: unknown) => {
              // Type guard for Error objects
              if (err instanceof Error) {
                const errorMessage = err.message;
                // Explicit string comparison
                if (
                  typeof errorMessage === 'string' &&
                  (errorMessage.includes('unauthorized') || errorMessage.includes('viewing key'))
                ) {
                  return null;
                }
              }
              throw err; // Re-throw other errors
            });

          if (response !== null) {
            void fetchBalance();
          }
        }
      } catch (error) {
        console.log('Viewing key check failed:', error);
      }
    } catch (error) {
      console.log('Keplr check failed:', error);
    }
  }, [tokenAddress, secretjs, tokenService, fetchBalance]);

  useEffect(() => {
    void checkViewingKey();
  }, [checkViewingKey]);

  useEffect(() => {
    if (!autoFetch) return;
    if (typeof tokenAddress !== 'string' || tokenAddress.length === 0) return;
    if (!secretjs) {
      setError(tokenAddress, TokenBalanceError.NO_SECRET_JS);
      showErrorToast(TokenBalanceError.NO_SECRET_JS);
      return;
    }
    if (!tokenService) return;

    void fetchBalance();
    const interval = setInterval(() => {
      if (!isRejected) {
        void fetchBalance();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [
    tokenService,
    tokenAddress,
    secretjs,
    fetchBalance,
    isRejected,
    setError,
    showErrorToast,
    autoFetch,
  ]);

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
