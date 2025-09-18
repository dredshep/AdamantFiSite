import { getSecretNetworkEnvVars } from '@/utils/env';
import isNotNullish from '@/utils/isNotNullish';
import {
  buildKeplrChainInfo,
  getRuntimeNetworkConfig,
  onNetworkConfigChange,
} from '@/utils/network/runtimeNetwork';
import { showToastOnce } from '@/utils/toast/toastManager';
import { Window as KeplrWindow } from '@keplr-wallet/types';
import { useEffect, useState } from 'react';
import { EncryptionUtilsImpl, SecretNetworkClient } from 'secretjs';

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

function getPulsar3ChainInfo() {
  const env = getSecretNetworkEnvVars();
  const runtime = getRuntimeNetworkConfig();
  return buildKeplrChainInfo(env.CHAIN_ID, runtime.lcdUrl, runtime.rpcUrl);
}

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

// Read-only client for queries that don't require wallet (singleton)
let _secretClient: SecretNetworkClient | null = null;
export const getSecretClient = (): SecretNetworkClient => {
  if (!_secretClient) {
    _secretClient = new SecretNetworkClient({
      chainId: getSecretNetworkEnvVars().CHAIN_ID,
      url: getRuntimeNetworkConfig().lcdUrl,
    });
  }
  return _secretClient;
};

// Legacy export for backward compatibility
export const secretClient = getSecretClient();

// Function to create wallet-connected client when needed
export async function createWalletClient(): Promise<SecretNetworkClient | null> {
  try {
    const keplr = (window as unknown as KeplrWindow).keplr;
    if (!keplr) {
      throw new Error('Keplr not installed');
    }

    const env = getSecretNetworkEnvVars();
    const chainId = env.CHAIN_ID;
    const runtime = getRuntimeNetworkConfig();

    // Suggest chain info for pulsar-3 with retry
    if (chainId === 'pulsar-3') {
      await withRetry(() => keplr.experimentalSuggestChain(getPulsar3ChainInfo()));
    }

    await withRetry(() => keplr.enable(chainId));

    const offlineSigner = keplr.getOfflineSignerOnlyAmino(chainId);
    const encryptionUtils = keplr.getEnigmaUtils(chainId);
    const accounts = await withRetry(() => offlineSigner.getAccounts());

    if (!accounts[0]) {
      throw new Error('No accounts found');
    }

    return new SecretNetworkClient({
      chainId,
      url: runtime.lcdUrl,
      wallet: offlineSigner,
      walletAddress: accounts[0].address,
      encryptionUtils: encryptionUtils,
    });
  } catch (error) {
    console.error('Failed to create wallet client:', error);
    return null;
  }
}

// Function to create wallet-connected client with internal encryption utils (for transactions)
export async function createWalletClientWithInternalUtils(): Promise<SecretNetworkClient | null> {
  try {
    const keplr = (window as unknown as KeplrWindow).keplr;
    if (!keplr) {
      throw new Error('Keplr not installed');
    }

    const env = getSecretNetworkEnvVars();
    const chainId = env.CHAIN_ID;
    const runtime = getRuntimeNetworkConfig();

    // Suggest chain info for pulsar-3 with retry
    if (chainId === 'pulsar-3') {
      await withRetry(() => keplr.experimentalSuggestChain(getPulsar3ChainInfo()));
    }

    await withRetry(() => keplr.enable(chainId));

    const offlineSigner = keplr.getOfflineSignerOnlyAmino(chainId);
    const encryptionUtils = new EncryptionUtilsImpl(runtime.lcdUrl, undefined);
    const accounts = await withRetry(() => offlineSigner.getAccounts());

    if (!accounts[0]) {
      throw new Error('No accounts found');
    }

    return new SecretNetworkClient({
      chainId,
      url: runtime.lcdUrl,
      wallet: offlineSigner,
      walletAddress: accounts[0].address,
      encryptionUtils: encryptionUtils,
    });
  } catch (error) {
    console.error('Failed to create wallet client with internal utils:', error);
    return null;
  }
}

// Singleton state for the Secret Network connection
interface SecretNetworkState {
  secretjs: SecretNetworkClient | null;
  keplr: typeof window.keplr | null;
  walletAddress: string | null;
  isConnecting: boolean;
  error: SecretNetworkError | null;
  toastsShown: ToastShownState;
}

// Global singleton state
let globalState: SecretNetworkState = {
  secretjs: null,
  keplr: null,
  walletAddress: null,
  isConnecting: false,
  error: null,
  toastsShown: {
    success: false,
    noKeplr: false,
    noSigner: false,
    noAccounts: false,
    connectionFailed: false,
    networkError: false,
  },
};

// Subscribers for state changes
const subscribers = new Set<() => void>();

// Function to notify all subscribers of state changes
function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

// Function to update global state
function updateGlobalState(updates: Partial<SecretNetworkState>) {
  globalState = { ...globalState, ...updates };
  notifySubscribers();
}

// Helper function to show toasts only once
// function showToastOnceLocal(
//   type: keyof ToastShownState,
//   toastId: string,
//   message: string,
//   options?: { onClick?: () => void }
// ) {
//   if (!globalState.toastsShown[type]) {
//     // Use the new Radix toast system - it handles duplicates automatically
//     if (options?.onClick) {
//       showToastOnce(toastId, message, 'success', {
//         actionLabel: 'Open',
//         onAction: options.onClick,
//       });
//     } else {
//       showToastOnce(toastId, message, 'success');
//     }

//     updateGlobalState({
//       toastsShown: {
//         ...globalState.toastsShown,
//         [type]: true,
//       },
//     });
//   }
// }

// Function to wait for Keplr
function waitForKeplr(): Promise<typeof window.keplr> {
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
  });
}

// Main connection function
async function connectKeplr(): Promise<void> {
  if (globalState.isConnecting || globalState.secretjs !== null) {
    return;
  }

  updateGlobalState({ isConnecting: true, error: null });

  try {
    console.log('Attempting to connect to Keplr...');

    // Wait for Keplr to be available instead of immediately checking
    const keplrInstance = await waitForKeplr().catch(
      () => (window as unknown as KeplrWindow).keplr
    );

    if (!isNotNullish(keplrInstance)) {
      console.error('Keplr not found');
      updateGlobalState({ error: SecretNetworkError.NO_KEPLR });
      showToastOnce(TOAST_IDS.NO_KEPLR, 'Please install Keplr extension', 'error', {
        message: 'Keplr wallet extension is required to use this application.',
        actionLabel: 'Install Keplr',
        onAction: () => window.open('https://www.keplr.app/download', '_blank'),
        autoClose: false,
      });
      return;
    }

    const env = getSecretNetworkEnvVars();
    const runtime = getRuntimeNetworkConfig();

    // Suggest chain info for pulsar-3 with retry
    if (env.CHAIN_ID === 'pulsar-3') {
      console.log('Suggesting chain info for pulsar-3...');
      await withRetry(() => keplrInstance.experimentalSuggestChain(getPulsar3ChainInfo()));
    }

    console.log(`Enabling Keplr for ${env.CHAIN_ID}...`);
    await withRetry(() => keplrInstance.enable(env.CHAIN_ID));
    updateGlobalState({ keplr: keplrInstance });

    const offlineSigner = keplrInstance.getOfflineSignerOnlyAmino(env.CHAIN_ID);
    const encryptionUtils = keplrInstance.getEnigmaUtils(env.CHAIN_ID);

    if (typeof offlineSigner === 'undefined' || offlineSigner === null) {
      console.error('No offline signer found');
      updateGlobalState({ error: SecretNetworkError.NO_SIGNER });
      showToastOnce(TOAST_IDS.NO_SIGNER, 'Failed to get Keplr signer', 'error', {
        message: 'Unable to access Keplr wallet signer',
      });
      return;
    }

    console.log('Getting accounts...');
    const accounts = await withRetry(() => offlineSigner.getAccounts());
    const firstAccount = accounts[0];

    if (typeof firstAccount === 'undefined' || accounts.length === 0) {
      console.error('No accounts found');
      updateGlobalState({ error: SecretNetworkError.NO_ACCOUNTS });
      showToastOnce(TOAST_IDS.NO_ACCOUNTS, 'No Keplr accounts found', 'error', {
        message: 'Please check your Keplr wallet and try again',
      });
      return;
    }

    console.log('Creating SecretNetworkClient...');
    const client = new SecretNetworkClient({
      chainId: env.CHAIN_ID,
      url: runtime.lcdUrl,
      wallet: offlineSigner,
      walletAddress: firstAccount.address,
      encryptionUtils: encryptionUtils,
    });

    console.log('Successfully connected to Secret Network');
    updateGlobalState({
      walletAddress: firstAccount.address,
      secretjs: client,
    });

    showToastOnce(TOAST_IDS.SUCCESS, 'Connected to Secret Network', 'success', {
      message: 'Balances are automatically refreshed every 10 seconds',
    });
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
      updateGlobalState({ error: SecretNetworkError.NETWORK_ERROR });
      showToastOnce(TOAST_IDS.NETWORK_ERROR, 'Network error', 'error', {
        message: 'Network error connecting to Secret Network. Check your internet connection.',
      });
    } else {
      updateGlobalState({ error: SecretNetworkError.CONNECTION_FAILED });
      showToastOnce(TOAST_IDS.CONNECTION_FAILED, 'Failed to connect to Secret Network', 'error', {
        message: 'Please refresh the page and try again.',
      });
    }
  } finally {
    updateGlobalState({ isConnecting: false });
  }
}

// Function to reset toast tracking
function resetToasts() {
  updateGlobalState({
    toastsShown: {
      success: false,
      noKeplr: false,
      noSigner: false,
      noAccounts: false,
      connectionFailed: false,
      networkError: false,
    },
  });
}

// Hook to use the singleton Secret Network connection
export function useSecretNetwork() {
  const [state, setState] = useState(globalState);

  useEffect(() => {
    // Subscribe to global state changes
    const unsubscribe = () => {
      setState({ ...globalState });
    };

    subscribers.add(unsubscribe);

    // Recreate clients on runtime network changes
    const unsubscribeNetwork = onNetworkConfigChange(() => {
      // Reset read-only client; reconnect wallet client if connected
      _secretClient = null;
      if (!globalState.isConnecting) {
        // If previously connected, attempt to reconnect with new endpoints
        if (globalState.walletAddress !== null || globalState.secretjs !== null) {
          updateGlobalState({ secretjs: null });
          void connectKeplr();
        }
      }
    });

    // Initial connection attempt
    if (globalState.secretjs === null && !globalState.isConnecting && globalState.error === null) {
      console.log('Initializing Secret Network connection...');
      void connectKeplr();
    }

    return () => {
      subscribers.delete(unsubscribe);
      unsubscribeNetwork();
    };
  }, []);

  // Reconnect on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (globalState.secretjs === null && !globalState.isConnecting) {
        console.log('Window focused, attempting to reconnect...');
        void connectKeplr();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return {
    secretjs: state.secretjs,
    walletAddress: state.walletAddress,
    keplr: state.keplr,
    isConnecting: state.isConnecting,
    error: state.error,
    connect: connectKeplr,
    resetToasts,
  };
}
