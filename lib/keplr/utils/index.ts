import { getSecretNetworkEnvVars } from '@/utils/env';
import { SecretNetworkClient } from 'secretjs';

// Define Keplr error types for better error handling
export enum KeplrErrorType {
  NOT_INSTALLED = 'NOT_INSTALLED',
  NOT_UNLOCKED = 'NOT_UNLOCKED',
  REJECTED_BY_USER = 'REJECTED_BY_USER',
  CHAIN_NOT_FOUND = 'CHAIN_NOT_FOUND',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNEXPECTED = 'UNEXPECTED',
}

// Interface for chain info
export interface ChainInfo {
  chainId: string;
  chainName: string;
  rpc: string;
  rest: string;
  networkType: 'mainnet' | 'testnet' | 'devnet';
}

// Keep track of extension availability
let keplrChecked = false;
let keplrAvailable = false;

// Enhanced error debugging
export type KeplrDebugInfo = {
  timestamp: string;
  browserInfo: string;
  extendedInfo: {
    message: string;
    keplrAvailable?: boolean;
    keplrVersion?: string;
    isNetworkError?: boolean;
    responseStatus?: number;
    responseStatusText?: string;
    stackTrace?: Array<{
      function?: string | undefined;
      file?: string | undefined;
      line?: number | undefined;
      column?: number | undefined;
      originalLine: string;
    }>;
    context?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

// Extended error interface
export interface EnhancedKeplrError extends Error {
  __keplrDebugInfo?: KeplrDebugInfo;
}

/**
 * Get a standardized error with type based on the error message
 */
export function getKeplrError(error: unknown): {
  type: KeplrErrorType;
  message: string;
  originalError: unknown;
} {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Identify error types based on message patterns
  if (errorMessage.includes('not installed') || errorMessage.includes('not detected')) {
    return {
      type: KeplrErrorType.NOT_INSTALLED,
      message: 'Keplr extension is not installed in your browser',
      originalError: error,
    };
  }

  if (errorMessage.includes('Request rejected')) {
    return {
      type: KeplrErrorType.REJECTED_BY_USER,
      message: 'Request was rejected by the user in Keplr',
      originalError: error,
    };
  }

  if (errorMessage.includes('is locked') || errorMessage.includes('unlock')) {
    return {
      type: KeplrErrorType.NOT_UNLOCKED,
      message: 'Keplr wallet is locked. Please unlock it',
      originalError: error,
    };
  }

  if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
    return {
      type: KeplrErrorType.NETWORK_ERROR,
      message: 'Network error connecting to Keplr or blockchain',
      originalError: error,
    };
  }

  if (errorMessage.includes('timeout')) {
    return {
      type: KeplrErrorType.TIMEOUT,
      message: 'Connection to Keplr timed out',
      originalError: error,
    };
  }

  if (errorMessage.includes('chain not found') || errorMessage.includes('chain info')) {
    return {
      type: KeplrErrorType.CHAIN_NOT_FOUND,
      message: 'Chain not found in Keplr wallet',
      originalError: error,
    };
  }

  if (errorMessage.includes('No account')) {
    return {
      type: KeplrErrorType.ACCOUNT_NOT_FOUND,
      message: 'No accounts found in Keplr wallet',
      originalError: error,
    };
  }

  // Default to unexpected error
  return {
    type: KeplrErrorType.UNEXPECTED,
    message: `Unexpected Keplr error: ${errorMessage}`,
    originalError: error,
  };
}

/**
 * Check if Keplr is installed and available
 */
export async function isKeplrInstalled(): Promise<boolean> {
  if (keplrChecked) return keplrAvailable;

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      keplrChecked = true;
      keplrAvailable = false;
      return resolve(false);
    }

    // Check if it's already in the window object
    if (window.keplr) {
      keplrChecked = true;
      keplrAvailable = true;
      return resolve(true);
    }

    // Try waiting for it to load
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;

      if (window.keplr) {
        clearInterval(checkInterval);
        keplrChecked = true;
        keplrAvailable = true;
        resolve(true);
      }

      // After 5 seconds (10 attempts at 500ms), give up
      if (attempts >= 10) {
        clearInterval(checkInterval);
        keplrChecked = true;
        keplrAvailable = false;
        resolve(false);
      }
    }, 500);
  });
}

/**
 * Check if Keplr is unlocked
 */
export async function isKeplrUnlocked(): Promise<boolean> {
  const installed = await isKeplrInstalled();
  if (!installed) return false;

  try {
    // Attempt to get key to check if unlocked
    // This will throw an error if locked
    if (!window.keplr) return false;
    await window.keplr.getKey(getSecretNetworkEnvVars().CHAIN_ID);
    return true;
  } catch (error) {
    const errorMessage = String(error);
    // Return false if it's a locked error, otherwise rethrow
    if (errorMessage.includes('is locked') || errorMessage.includes('unlock')) {
      return false;
    }
    throw error;
  }
}

/**
 * Get Keplr connection status with detailed information
 */
export async function getKeplrStatus(): Promise<{
  installed: boolean;
  unlocked: boolean;
  connectedToChain: boolean;
  chainId: string;
  error?: { type: KeplrErrorType; message: string };
}> {
  const env = getSecretNetworkEnvVars();

  try {
    const installed = await isKeplrInstalled();
    if (!installed) {
      return {
        installed: false,
        unlocked: false,
        connectedToChain: false,
        chainId: env.CHAIN_ID,
        error: {
          type: KeplrErrorType.NOT_INSTALLED,
          message: 'Keplr extension is not installed in your browser',
        },
      };
    }

    const unlocked = await isKeplrUnlocked();
    if (!unlocked) {
      return {
        installed: true,
        unlocked: false,
        connectedToChain: false,
        chainId: env.CHAIN_ID,
        error: {
          type: KeplrErrorType.NOT_UNLOCKED,
          message: 'Keplr wallet is locked. Please unlock it',
        },
      };
    }

    // Try to get the key for the chain to check if connected
    try {
      if (!window.keplr) {
        return {
          installed: true,
          unlocked: true,
          connectedToChain: false,
          chainId: env.CHAIN_ID,
          error: {
            type: KeplrErrorType.NOT_INSTALLED,
            message: 'Keplr extension not found in window object',
          },
        };
      }
      await window.keplr.getKey(env.CHAIN_ID);
      return {
        installed: true,
        unlocked: true,
        connectedToChain: true,
        chainId: env.CHAIN_ID,
      };
    } catch (error) {
      return {
        installed: true,
        unlocked: true,
        connectedToChain: false,
        chainId: env.CHAIN_ID,
        error: getKeplrError(error),
      };
    }
  } catch (error) {
    // Catch any unexpected errors
    return {
      installed: false,
      unlocked: false,
      connectedToChain: false,
      chainId: env.CHAIN_ID,
      error: getKeplrError(error),
    };
  }
}

/**
 * Connect to Secret Network through Keplr with detailed error handling
 */
export async function connectKeplr(): Promise<{
  success: boolean;
  error?: { type: KeplrErrorType; message: string };
  client?: SecretNetworkClient;
  address?: string;
}> {
  const env = getSecretNetworkEnvVars();

  try {
    // First check if Keplr is installed
    const installed = await isKeplrInstalled();
    if (!installed) {
      return {
        success: false,
        error: {
          type: KeplrErrorType.NOT_INSTALLED,
          message: 'Keplr extension is not installed',
        },
      };
    }

    // Make sure Keplr is available
    if (!window.keplr) {
      return {
        success: false,
        error: {
          type: KeplrErrorType.NOT_INSTALLED,
          message: 'Keplr extension is not available in the window object',
        },
      };
    }

    // Enable the chain
    await window.keplr.enable(env.CHAIN_ID);

    // Get signers
    const offlineSigner = window.keplr.getOfflineSignerOnlyAmino(env.CHAIN_ID);
    const enigmaUtils = window.keplr.getEnigmaUtils(env.CHAIN_ID);

    // Get accounts
    const accounts = await offlineSigner.getAccounts();
    if (accounts.length === 0) {
      return {
        success: false,
        error: {
          type: KeplrErrorType.ACCOUNT_NOT_FOUND,
          message: 'No accounts found in Keplr',
        },
      };
    }

    // Safely get the first account address
    const address = accounts[0]?.address;
    if (address == null) {
      return {
        success: false,
        error: {
          type: KeplrErrorType.ACCOUNT_NOT_FOUND,
          message: 'Invalid account data from Keplr',
        },
      };
    }

    // Create SecretJS client
    const client = new SecretNetworkClient({
      chainId: env.CHAIN_ID,
      url: env.LCD_URL,
      wallet: offlineSigner,
      walletAddress: address,
      encryptionUtils: enigmaUtils,
    });

    // Test the connection with a simple query
    try {
      await client.query.bank.balance({
        address,
        denom: 'uscrt',
      });
    } catch (error) {
      return {
        success: false,
        error: getKeplrError(error),
      };
    }

    return {
      success: true,
      client,
      address,
    };
  } catch (error) {
    // Process any errors that occur during the connection process
    const processedError = getKeplrError(error);

    return {
      success: false,
      error: {
        type: processedError.type,
        message: processedError.message,
      },
    };
  }
}

/**
 * Get suggestions for fixing Keplr errors
 */
export function getKeplrErrorSuggestions(errorType: KeplrErrorType): string[] {
  const commonSuggestions = [
    'Refresh the page and try again.',
    'Ensure you are connected to the internet.',
  ];

  switch (errorType) {
    case KeplrErrorType.NOT_INSTALLED:
      return [
        'Install Keplr wallet from the Chrome Web Store.',
        'After installing, refresh this page.',
      ];

    case KeplrErrorType.NOT_UNLOCKED:
      return [
        'Unlock your Keplr wallet by clicking on the extension icon.',
        'Enter your password to unlock the wallet.',
        'After unlocking, refresh this page.',
      ];

    case KeplrErrorType.REJECTED_BY_USER:
      return [
        'You rejected the connection request in Keplr.',
        'Click "Connect" again and approve the request in the Keplr popup.',
      ];

    case KeplrErrorType.CHAIN_NOT_FOUND:
      return [
        'The Secret Network chain is not configured in your Keplr wallet.',
        'Try clicking "Suggest chain" again to add Secret Network to Keplr.',
        'Make sure you are using the latest version of Keplr.',
      ];

    case KeplrErrorType.ACCOUNT_NOT_FOUND:
      return [
        'No Secret Network account found in your Keplr wallet.',
        'Create or import a Secret Network account in Keplr.',
        'Make sure you have selected the correct account in Keplr.',
      ];

    case KeplrErrorType.TIMEOUT:
      return [
        'The connection to Keplr timed out.',
        'Check if Keplr extension is running properly.',
        'Try restarting your browser.',
        ...commonSuggestions,
      ];

    case KeplrErrorType.NETWORK_ERROR:
      return [
        'There was a network error connecting to Keplr or the Secret Network.',
        'Check if Keplr extension is running properly.',
        'Try restarting your browser.',
        'Make sure your internet connection is stable.',
        'If using a VPN, try disabling it temporarily.',
      ];

    case KeplrErrorType.UNEXPECTED:
    default:
      return [
        'Try connecting again.',
        'Restart your browser and try again.',
        'Update your Keplr extension to the latest version.',
        'Clear your browser cache and cookies.',
        ...commonSuggestions,
      ];
  }
}

/**
 * Detect environment (mainnet/testnet/devnet) based on chainId
 */
export function detectKeplrEnvironment(chainId: string): 'mainnet' | 'testnet' | 'devnet' {
  if (chainId === 'secret-4') {
    return 'mainnet';
  }

  if (chainId === 'pulsar-3' || chainId.includes('testnet') || chainId.includes('test')) {
    return 'testnet';
  }

  return 'devnet';
}

/**
 * Validate that a Keplr connection is adequate for the current environment
 */
export async function validateKeplrEnvironment(): Promise<{
  valid: boolean;
  expectedChainId: string;
  actualChainId?: string | undefined;
  suggestedAction?: string | undefined;
}> {
  const env = getSecretNetworkEnvVars();
  const expectedChainId = env.CHAIN_ID;

  try {
    if (!window.keplr) {
      return { valid: false, expectedChainId };
    }

    // Get current key to check enabled chain
    const key = await window.keplr.getKey(expectedChainId).catch(() => null);

    if (!key) {
      // Chain not enabled
      return {
        valid: false,
        expectedChainId,
        suggestedAction: 'Enable the correct chain in Keplr',
      };
    }

    return {
      valid: true,
      expectedChainId,
      actualChainId: expectedChainId,
    };
  } catch (error) {
    // If we can get any chain info from the error, include it
    let actualChainId: string | undefined;
    const errorString = String(error);
    const chainIdMatch = errorString.match(/chain\s?id[:\s]+([a-zA-Z0-9-]+)/i);
    if (chainIdMatch && chainIdMatch[1] != null) {
      actualChainId = chainIdMatch[1];
    }

    return {
      valid: false,
      expectedChainId,
      actualChainId,
      suggestedAction: 'Switch to the correct network in Keplr',
    };
  }
}

/**
 * Format error details for debugging
 */
export function formatKeplrErrorDetails(error: Error): string {
  let details = '';

  details += `Error: ${error.name}\n`;
  details += `Message: ${error.message}\n`;

  // If we have enhanced info, show that
  const enhancedError = error as EnhancedKeplrError;
  if (enhancedError.__keplrDebugInfo) {
    const debugInfo = enhancedError.__keplrDebugInfo;
    details += `\nTimestamp: ${debugInfo.timestamp}\n`;
    details += `Browser: ${debugInfo.browserInfo}\n`;

    if (debugInfo.extendedInfo != null) {
      details += '\nExtended Information:\n';

      for (const [key, value] of Object.entries(debugInfo.extendedInfo)) {
        if (key !== 'stackTrace' && key !== 'context' && typeof value !== 'object') {
          details += `  ${key}: ${
            value !== undefined ? JSON.stringify(value) : '(not available)'
          }\n`;
        }
      }

      // If we have context, add that
      if (debugInfo.extendedInfo.context) {
        details += '\nContext:\n';
        details += `${JSON.stringify(debugInfo.extendedInfo.context, null, 2)}\n`;
      }
    }
  }

  // Add stack trace at the end
  if (error.stack != null) {
    details += '\nStack Trace:\n';
    details += error.stack;
  }

  return details;
}

/**
 * Enhanced error logging for Keplr-related errors
 * Captures detailed error information and attaches it to the error object
 */
export function enhancedKeplrErrorLogging(
  error: Error,
  context: Record<string, unknown> = {}
): Error {
  // Skip if already enhanced
  const enhancedError = error as EnhancedKeplrError;
  if (enhancedError.__keplrDebugInfo) {
    return error;
  }

  // Create basic debug info
  const debugInfo: KeplrDebugInfo = {
    timestamp: new Date().toISOString(),
    browserInfo: navigator.userAgent,
    extendedInfo: {
      message: error.message,
      context,
    },
  };

  // Check if Keplr is available
  try {
    const keplrExists = typeof window !== 'undefined' && 'keplr' in window;
    debugInfo.extendedInfo.keplrAvailable = keplrExists;

    if (keplrExists && window.keplr) {
      debugInfo.extendedInfo.keplrVersion = window.keplr.version;
    }
  } catch (_e) {
    debugInfo.extendedInfo.keplrAvailable = false;
  }

  // Add network error details
  if (error.message.includes('NetworkError')) {
    debugInfo.extendedInfo.isNetworkError = true;

    // Try to extract more information if it's a Response object
    const errorWithResponse = error as unknown as {
      response?: { status?: number; statusText?: string };
    };
    if (errorWithResponse.response) {
      try {
        const { response } = errorWithResponse;
        if (response.status !== undefined) {
          debugInfo.extendedInfo.responseStatus = response.status;
        }
        if (response.statusText != null) {
          debugInfo.extendedInfo.responseStatusText = response.statusText;
        }
      } catch (_e) {
        // Ignore errors in error extraction
      }
    }
  }

  // Parse stack trace for more readable information
  if (error.stack != null) {
    const stackLines = error.stack.split('\n');
    debugInfo.extendedInfo.stackTrace = stackLines.map((line) => {
      // Try to extract function, file and line number
      const parts = line.trim().match(/at\s+(.*?)\s+\((.*?)(?::(\d+):(\d+))?\)/);

      if (parts) {
        const [, functionName, file, lineNum, column] = parts;
        return {
          function: functionName != null ? functionName : undefined,
          file: file != null ? file : undefined,
          line: lineNum != null ? parseInt(lineNum, 10) : undefined,
          column: column != null ? parseInt(column, 10) : undefined,
          originalLine: line.trim(),
        };
      }

      // For lines that don't match the regular format
      return {
        originalLine: line.trim(),
      };
    });
  }

  // Attach the debug info to the error object
  enhancedError.__keplrDebugInfo = debugInfo;

  // Log to console for development purposes
  if (process.env.NODE_ENV === 'development') {
    console.group('Keplr Error Enhanced Logging');
    console.error('Original Error:', error.message);
    console.log('Enhanced Debug Info:', debugInfo);
    console.groupEnd();
  }

  return error;
}

/**
 * Wraps a function that calls Keplr to add enhanced error handling
 * @param fn Function that interacts with Keplr
 * @param context Additional context to include in error logs
 */
export function debugKeplrQuery<T>(
  fn: () => Promise<T>,
  context: Record<string, unknown> = {}
): Promise<T> {
  try {
    const promise = fn();

    // On success, log in development
    if (process.env.NODE_ENV === 'development') {
      void promise.then(() => {
        console.log('Keplr query completed successfully:', { context });
      });
    }

    // On error, enhance error information
    return promise.catch((error) => {
      if (error instanceof Error) {
        throw enhancedKeplrErrorLogging(error, context);
      }
      throw error;
    });
  } catch (error) {
    // Handle synchronous errors
    if (error instanceof Error) {
      throw enhancedKeplrErrorLogging(error, context);
    }
    throw error;
  }
}

/**
 * Helper function to safely check if a Keplr-related error is of a specific type
 */
export function isKeplrErrorOfType(error: Error, type: KeplrErrorType): boolean {
  if (error == null || typeof error.message !== 'string' || error.message === '') return false;

  const message = error.message.toLowerCase();

  switch (type) {
    case KeplrErrorType.NOT_INSTALLED:
      return message.includes('not installed') || message.includes('not found');

    case KeplrErrorType.NOT_UNLOCKED:
      return message.includes('locked') || message.includes('unlock');

    case KeplrErrorType.REJECTED_BY_USER:
      return (
        message.includes('rejected') || message.includes('denied') || message.includes('cancelled')
      );

    case KeplrErrorType.CHAIN_NOT_FOUND:
      return (
        message.includes('chain') &&
        (message.includes('not found') || message.includes('not supported'))
      );

    case KeplrErrorType.ACCOUNT_NOT_FOUND:
      return message.includes('account') && message.includes('not found');

    case KeplrErrorType.TIMEOUT:
      return message.includes('timeout') || message.includes('timed out');

    case KeplrErrorType.NETWORK_ERROR:
      return message.includes('network') || message.includes('networkerror');

    default:
      return false;
  }
}
