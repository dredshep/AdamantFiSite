import {
  KeplrErrorType,
  connectKeplr,
  formatKeplrErrorDetails,
  getKeplrError,
  getKeplrErrorSuggestions,
  getKeplrStatus,
  validateKeplrEnvironment,
} from '@/lib/keplr';
import { useCallback, useEffect, useState } from 'react';
import { SecretNetworkClient } from 'secretjs';

// Return types for the hook
interface KeplrDiagnosticsState {
  // Connection status
  status: {
    installed: boolean;
    unlocked: boolean;
    connectedToChain: boolean;
    chainId: string;
    error?: { type: KeplrErrorType; message: string };
  } | null;

  // Environment validation
  environment: {
    valid: boolean;
    expectedChainId: string;
    actualChainId?: string;
    suggestedAction?: string;
  } | null;

  // Error details
  lastError: Error | null;

  // Processed error information
  lastErrorDetails: {
    type: KeplrErrorType;
    message: string;
    suggestions: string[];
    details: string;
  } | null;

  // Client information
  client: SecretNetworkClient | null;
  walletAddress: string | null;

  // Loading state
  isLoading: boolean;
}

/**
 * Hook for Keplr diagnostics and error handling
 * Provides detailed information about Keplr status, errors, and suggestions
 */
export function useKeplrDiagnostics(autoConnect = true, pollingInterval = 5000) {
  // State
  const [state, setState] = useState<KeplrDiagnosticsState>({
    status: null,
    environment: null,
    lastError: null,
    lastErrorDetails: null,
    client: null,
    walletAddress: null,
    isLoading: false,
  });

  // Fetch Keplr status and environment validation
  const checkKeplrStatus = useCallback(async () => {
    try {
      const status = await getKeplrStatus();
      const environment = await validateKeplrEnvironment();

      setState((prevState) => ({
        ...prevState,
        status,
        environment: environment as {
          valid: boolean;
          expectedChainId: string;
          actualChainId?: string;
          suggestedAction?: string;
        },
      }));
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      }
    }
  }, []);

  // Process errors
  const handleError = useCallback((error: Error) => {
    const processedError = getKeplrError(error);
    const suggestions = getKeplrErrorSuggestions(processedError.type);
    const details = formatKeplrErrorDetails(error);

    setState((prevState) => ({
      ...prevState,
      lastError: error,
      lastErrorDetails: {
        type: processedError.type,
        message: processedError.message,
        suggestions,
        details,
      },
    }));
  }, []);

  // Connect to Keplr
  const connect = useCallback(async () => {
    setState((prevState) => ({ ...prevState, isLoading: true }));

    try {
      const result = await connectKeplr();

      if (result.success === true && result.client != null && result.address != null) {
        setState((prevState) => ({
          ...prevState,
          client: result.client as SecretNetworkClient,
          walletAddress: result.address as string,
          isLoading: false,
        }));

        // Re-check status after successful connection
        void checkKeplrStatus();
        return { success: true, client: result.client, address: result.address };
      } else if (result.error != null) {
        const error = new Error(result.error.message || 'Unknown error');
        handleError(error);
        setState((prevState) => ({ ...prevState, isLoading: false }));
        return { success: false, error: result.error };
      }

      setState((prevState) => ({ ...prevState, isLoading: false }));
      return { success: false };
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      }
      setState((prevState) => ({ ...prevState, isLoading: false }));
      return { success: false, error: { type: KeplrErrorType.UNEXPECTED, message: String(error) } };
    }
  }, [checkKeplrStatus, handleError]);

  // Disconnect from Keplr
  const disconnect = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      client: null,
      walletAddress: null,
    }));
  }, []);

  // Clear errors
  const clearErrors = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      lastError: null,
      lastErrorDetails: null,
    }));
  }, []);

  // Setup polling
  useEffect(() => {
    // Initial check
    void checkKeplrStatus();

    // Auto-connect if enabled
    if (autoConnect && !state.client) {
      void connect();
    }

    // Set up polling
    const interval = setInterval(() => {
      void checkKeplrStatus();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [autoConnect, checkKeplrStatus, connect, pollingInterval, state.client]);

  // Add event listener for Keplr changes
  useEffect(() => {
    const handleKeplrChange = () => {
      void checkKeplrStatus();
    };

    window.addEventListener('keplr_keystorechange', handleKeplrChange);

    return () => {
      window.removeEventListener('keplr_keystorechange', handleKeplrChange);
    };
  }, [checkKeplrStatus]);

  return {
    ...state,
    connect,
    disconnect,
    refresh: checkKeplrStatus,
    clearErrors,
  };
}
