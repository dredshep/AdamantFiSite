import ErrorToast from '@/components/app/Shared/Toasts/ErrorToast';
import { useSecretNetworkContext } from '@/contexts/SecretNetworkContext';
import { TokenService } from '@/services/secret/TokenService';
import { useTokenBalanceStore } from '@/store/tokenBalanceStore';
import { SecretString } from '@/types';
import { getTokenDecimals } from '@/utils/apis/tokenInfo';
import { getCodeHashByAddress } from '@/utils/secretjs/getCodeHashByAddress';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

const REFRESH_INTERVAL = 30000; // 30 seconds

export enum TokenBalanceError {
  NO_KEPLR = 'NO_KEPLR',
  NO_VIEWING_KEY = 'NO_VIEWING_KEY',
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

export function useTokenBalance(tokenAddress: SecretString | undefined) {
  const { secretjs } = useSecretNetworkContext();
  const { setBalance, getBalance, setLoading, setError } = useTokenBalanceStore();
  const [toastShown, setToastShown] = useState<string | null>(null);

  const tokenService = useMemo(() => (secretjs ? new TokenService(secretjs) : null), [secretjs]);

  const showErrorToast = useCallback(
    (errorType: TokenBalanceError, details?: string) => {
      const errorKey = `${errorType}-${details ?? ''}`;
      if (toastShown === errorKey) return;

      const errorConfig = ERROR_MESSAGES[errorType];
      toast.error(
        <ErrorToast
          title={errorConfig.title}
          message={errorConfig.message}
          details={details}
          actionLabel={errorConfig.actionLabel}
          onActionClick={errorConfig.onAction}
        />,
        {
          autoClose: 6000,
          toastId: errorKey,
        }
      );
      setToastShown(errorKey);
    },
    [toastShown]
  );

  useEffect(() => {
    if (typeof tokenAddress !== 'string' || tokenAddress.length === 0) return;
    if (!secretjs) {
      setError(tokenAddress, TokenBalanceError.NO_SECRET_JS);
      showErrorToast(TokenBalanceError.NO_SECRET_JS);
      return;
    }
    if (!tokenService) return;

    const fetchBalance = async () => {
      const currentBalance = getBalance(tokenAddress);
      if (
        currentBalance?.error === null &&
        typeof currentBalance?.lastUpdated === 'number' &&
        Date.now() - currentBalance.lastUpdated < REFRESH_INTERVAL
      ) {
        return;
      }

      setLoading(tokenAddress, true);

      try {
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

        // Clear error toast state on success
        setToastShown(null);
      } catch (err) {
        let errorType = TokenBalanceError.UNKNOWN_ERROR;
        if (err instanceof Error) {
          if (err.message.includes('Keplr not installed')) {
            errorType = TokenBalanceError.NO_KEPLR;
          } else if (err.message.includes('Viewing key required')) {
            errorType = TokenBalanceError.NO_VIEWING_KEY;
          } else if (err.message.includes('network')) {
            errorType = TokenBalanceError.NETWORK_ERROR;
          }
        }

        setError(tokenAddress, errorType);
        showErrorToast(errorType, err instanceof Error ? err.message : undefined);
      }
    };

    void fetchBalance();
    const interval = setInterval(() => void fetchBalance(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [tokenService, tokenAddress, secretjs, setBalance, setLoading, setError, showErrorToast]);

  return (
    getBalance(tokenAddress ?? '') ?? {
      amount: null,
      loading: true,
      error: null,
      lastUpdated: null,
    }
  );
}
