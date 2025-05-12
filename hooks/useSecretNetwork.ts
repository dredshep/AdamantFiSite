import { useSecretNetworkStore } from '@/store/secretNetworkStore';
import { getSecretNetworkEnvVars } from '@/utils/env';
import isNotNullish from '@/utils/isNotNullish';
import { Window as KeplrWindow } from '@keplr-wallet/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast, ToastOptions } from 'react-toastify';
import { SecretNetworkClient } from 'secretjs';

enum SecretNetworkError {
  NO_KEPLR = 'NO_KEPLR',
  NO_ACCOUNTS = 'NO_ACCOUNTS',
  NO_SIGNER = 'NO_SIGNER',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

// Maximum number of retries for network operations
const MAX_RETRIES = 3;
// Delay between retries (in ms)
const RETRY_DELAY = 1000;

// Track if each toast has been shown
interface ToastShownState {
  success: boolean;
  noKeplr: boolean;
  noSigner: boolean;
  noAccounts: boolean;
  connectionFailed: boolean;
  networkError: boolean;
}

// Toast ID references to prevent duplicates
const TOAST_IDS = {
  SUCCESS: 'secret-network-connected',
  NO_KEPLR: 'secret-network-no-keplr',
  NO_SIGNER: 'secret-network-no-signer',
  NO_ACCOUNTS: 'secret-network-no-accounts',
  CONNECTION_FAILED: 'secret-network-connection-failed',
  NETWORK_ERROR: 'secret-network-network-error',
};

const PULSAR_3_CHAIN_INFO = {
  chainId: 'pulsar-3',
  chainName: 'Secret Network Testnet',
  rpc: getSecretNetworkEnvVars().RPC_URL,
  rest: getSecretNetworkEnvVars().LCD_URL,
  bip44: {
    coinType: 529,
  },
  bech32Config: {
    bech32PrefixAccAddr: 'secret',
    bech32PrefixAccPub: 'secretpub',
    bech32PrefixValAddr: 'secretvaloper',
    bech32PrefixValPub: 'secretvaloperpub',
    bech32PrefixConsAddr: 'secretvalcons',
    bech32PrefixConsPub: 'secretvalconspub',
  },
  currencies: [
    {
      coinDenom: 'SCRT',
      coinMinimalDenom: 'uscrt',
      coinDecimals: 6,
      coinGeckoId: 'secret',
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'SCRT',
      coinMinimalDenom: 'uscrt',
      coinDecimals: 6,
      coinGeckoId: 'secret',
    },
  ],
  stakeCurrency: {
    coinDenom: 'SCRT',
    coinMinimalDenom: 'uscrt',
    coinDecimals: 6,
    coinGeckoId: 'secret',
  },
  gasPriceStep: {
    low: 0.25,
    average: 0.5,
    high: 1,
  },
  features: ['secretwasm'],
};

// Helper function to add delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry function for network operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = MAX_RETRIES,
  retryDelay = RETRY_DELAY
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Operation failed, attempt ${attempt}/${maxRetries}`, error);
      lastError = error;

      if (attempt < maxRetries) {
        // Wait before next retry with exponential backoff
        await delay(retryDelay * attempt);
      }
    }
  }

  throw lastError;
}

export function useSecretNetwork() {
  const {
    secretjs,
    keplr,
    walletAddress,
    isConnecting,
    setSecretjs,
    setKeplr,
    setWalletAddress,
    setIsConnecting,
  } = useSecretNetworkStore();

  const [error, setError] = useState<SecretNetworkError | null>(null);
  const toastsShown = useRef<ToastShownState>({
    success: false,
    noKeplr: false,
    noSigner: false,
    noAccounts: false,
    connectionFailed: false,
    networkError: false,
  });
  const env = getSecretNetworkEnvVars();
  const keplrCheckInterval = useRef<number | null>(null);

  // Helper function to show toasts only once
  const showToastOnce = useCallback(
    (
      type: keyof ToastShownState,
      toastId: string,
      message: string,
      options?: { onClick?: () => void }
    ) => {
      if (!toastsShown.current[type]) {
        // Dismiss any existing toast with this ID first
        toast.dismiss(toastId);

        // Create toast options with proper type handling
        const toastOptions: ToastOptions = {
          position: 'bottom-right',
          toastId,
        };

        // Only add onClick if it exists
        if (options?.onClick) {
          toastOptions.onClick = () => {
            options.onClick?.();
          };
        }

        // Show the toast
        toast[type === 'success' ? 'success' : 'error'](message, toastOptions);

        // Mark as shown
        toastsShown.current[type] = true;
      }
    },
    []
  );

  // Function to check if Keplr is ready in the window object
  const waitForKeplr = useCallback((): Promise<typeof window.keplr> => {
    return new Promise((resolve, reject) => {
      // If Keplr is already available, resolve immediately
      if (window.keplr) {
        return resolve(window.keplr);
      }

      // Check every 500ms for up to 10 seconds
      let attempts = 0;
      const maxAttempts = 20;

      const checkInterval = setInterval(() => {
        attempts++;

        if (window.keplr) {
          clearInterval(checkInterval);
          return resolve(window.keplr);
        }

        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error('Keplr not found after waiting'));
        }
      }, 500);

      // Store the interval ID so we can clear it if needed
      keplrCheckInterval.current = checkInterval as unknown as number;
    });
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (keplrCheckInterval.current !== null) {
        clearInterval(keplrCheckInterval.current);
      }
    };
  }, []);

  // Reset toast tracking on component mount
  useEffect(() => {
    return () => {
      // Reset toast tracking on unmount
      toastsShown.current = {
        success: false,
        noKeplr: false,
        noSigner: false,
        noAccounts: false,
        connectionFailed: false,
        networkError: false,
      };
    };
  }, []);

  const connectKeplr = useCallback(async () => {
    if (isConnecting || secretjs !== null) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('Attempting to connect to Keplr...');

      // Wait for Keplr to be available instead of immediately checking
      const keplrInstance = await waitForKeplr().catch(
        () => (window as unknown as KeplrWindow).keplr
      );

      if (!isNotNullish(keplrInstance)) {
        console.error('Keplr not found');
        setError(SecretNetworkError.NO_KEPLR);
        showToastOnce('noKeplr', TOAST_IDS.NO_KEPLR, 'Please install Keplr extension', {
          onClick: () => window.open('https://www.keplr.app/download', '_blank'),
        });
        return;
      }

      // Suggest chain info for pulsar-3 with retry
      if (env.CHAIN_ID === 'pulsar-3') {
        console.log('Suggesting chain info for pulsar-3...');
        await withRetry(() => keplrInstance.experimentalSuggestChain(PULSAR_3_CHAIN_INFO));
      }

      console.log(`Enabling Keplr for ${env.CHAIN_ID}...`);
      await withRetry(() => keplrInstance.enable(env.CHAIN_ID));
      setKeplr(keplrInstance);

      const offlineSigner = keplrInstance.getOfflineSignerOnlyAmino(env.CHAIN_ID);
      const enigmaUtils = keplrInstance.getEnigmaUtils(env.CHAIN_ID);

      if (typeof offlineSigner === 'undefined' || offlineSigner === null) {
        console.error('No offline signer found');
        setError(SecretNetworkError.NO_SIGNER);
        showToastOnce('noSigner', TOAST_IDS.NO_SIGNER, 'Failed to get Keplr signer');
        return;
      }

      console.log('Getting accounts...');
      const accounts = await withRetry(() => offlineSigner.getAccounts());
      const firstAccount = accounts[0];

      if (typeof firstAccount === 'undefined' || accounts.length === 0) {
        console.error('No accounts found');
        setError(SecretNetworkError.NO_ACCOUNTS);
        showToastOnce('noAccounts', TOAST_IDS.NO_ACCOUNTS, 'No Keplr accounts found');
        return;
      }

      console.log('Creating SecretNetworkClient...');
      const client = new SecretNetworkClient({
        chainId: env.CHAIN_ID,
        url: env.LCD_URL,
        wallet: offlineSigner,
        walletAddress: firstAccount.address,
        encryptionUtils: enigmaUtils,
      });

      // Verify connection with retry
      try {
        await withRetry(() =>
          client.query.bank.balance({
            address: firstAccount.address,
            denom: 'uscrt',
          })
        );
      } catch (e) {
        console.error('Failed to verify connection:', e);
        setError(SecretNetworkError.CONNECTION_FAILED);
        showToastOnce(
          'connectionFailed',
          TOAST_IDS.CONNECTION_FAILED,
          'Failed to connect to Secret Network'
        );
        return;
      }

      console.log('Successfully connected to Secret Network');
      setWalletAddress(firstAccount.address);
      setSecretjs(client);

      showToastOnce('success', TOAST_IDS.SUCCESS, 'Connected to Secret Network');
    } catch (error) {
      console.error('Error connecting to Secret Network:', error);
      // Check for network-related errors specifically
      const errorString = String(error);
      if (
        errorString.includes('NetworkError') ||
        errorString.includes('fetch') ||
        errorString.includes('network') ||
        errorString.includes('timeout')
      ) {
        setError(SecretNetworkError.NETWORK_ERROR);
        showToastOnce(
          'networkError',
          TOAST_IDS.NETWORK_ERROR,
          'Network error connecting to Secret Network. Check your internet connection.'
        );
      } else {
        setError(SecretNetworkError.CONNECTION_FAILED);
        showToastOnce(
          'connectionFailed',
          TOAST_IDS.CONNECTION_FAILED,
          'Failed to connect to Secret Network'
        );
      }
    } finally {
      setIsConnecting(false);
    }
  }, [
    isConnecting,
    secretjs,
    setIsConnecting,
    setKeplr,
    setSecretjs,
    setWalletAddress,
    env,
    waitForKeplr,
    showToastOnce,
  ]);

  useEffect(() => {
    const initConnection = async () => {
      if (secretjs === null && !isConnecting && error === null) {
        console.log('Initializing Secret Network connection...');
        await connectKeplr();
      }
    };

    void initConnection();
  }, [connectKeplr, secretjs, isConnecting, error]);

  // Reconnect on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (secretjs === null && !isConnecting) {
        console.log('Window focused, attempting to reconnect...');
        void connectKeplr();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [connectKeplr, secretjs, isConnecting]);

  // Provide a method to reset toast tracking
  const resetToasts = useCallback(() => {
    toastsShown.current = {
      success: false,
      noKeplr: false,
      noSigner: false,
      noAccounts: false,
      connectionFailed: false,
      networkError: false,
    };
  }, []);

  return {
    secretjs,
    walletAddress,
    keplr,
    isConnecting,
    error,
    connect: connectKeplr,
    resetToasts,
  };
}
