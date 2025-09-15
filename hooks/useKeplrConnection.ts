import { getSecretNetworkEnvVars } from '@/utils/env';
import isNotNullish from '@/utils/isNotNullish';
import { showToastOnce, toastManager } from '@/utils/toast/toastManager';
import { Window } from '@keplr-wallet/types';
import { useCallback, useEffect, useState } from 'react';
import { SecretNetworkClient } from 'secretjs';
import { createWalletClient } from './useSecretNetwork';

export function useKeplrConnection(chainId?: string, rpcUrl?: string) {
  // Use environment variables as defaults
  const envVars = getSecretNetworkEnvVars();
  const finalChainId = chainId ?? envVars.CHAIN_ID;
  const finalRpcUrl = rpcUrl ?? envVars.RPC_URL;
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<string>(finalChainId);

  const connect = useCallback(async () => {
    const keplr = (window as unknown as Window).keplr;
    if (!isNotNullish(keplr)) {
      toastManager.keplrNotInstalled();
      return null;
    }

    try {
      // Use the centralized wallet client creation
      const client = await createWalletClient();
      if (!client) {
        showToastOnce('keplr-connection-error', 'Connection error', 'error', {
          message: 'Failed to connect to Keplr wallet. Please refresh the page and try again.',
        });
        return null;
      }

      // Get wallet address from Keplr
      await keplr.enable(finalChainId);
      const offlineSigner = keplr.getOfflineSignerOnlyAmino(finalChainId);
      const accounts = await offlineSigner?.getAccounts();

      if (!accounts?.length || !accounts[0]) {
        showToastOnce('no-accounts-found', 'No accounts found', 'error', {
          message: 'Please check your Keplr wallet and try again',
        });
        return null;
      }

      setWalletAddress(accounts[0].address);
      setSecretjs(client);
      setCurrentChainId(finalChainId);
      return client;
    } catch (error) {
      console.error('Error connecting to Keplr:', error);
      showToastOnce('keplr-connection-error', 'Connection error', 'error', {
        message: 'Failed to connect to Keplr wallet. Please refresh the page and try again.',
      });
      return null;
    }
  }, [finalChainId, finalRpcUrl]);

  useEffect(() => {
    void connect();
  }, [connect]);

  return { secretjs, walletAddress, chainId: currentChainId, connect };
}
