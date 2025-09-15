import { getSecretNetworkEnvVars } from '@/utils/env';
import isNotNullish from '@/utils/isNotNullish';
import { showToastOnce, toastManager } from '@/utils/toast/toastManager';
import { Window } from '@keplr-wallet/types';
import { useCallback, useEffect, useState } from 'react';
import { SecretNetworkClient } from 'secretjs';

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
      await keplr.enable(finalChainId);

      const offlineSigner = keplr.getOfflineSignerOnlyAmino(finalChainId);
      const enigmaUtils = keplr.getEnigmaUtils(finalChainId);
      const accounts = await offlineSigner?.getAccounts();

      if (!accounts?.length || !accounts[0]) {
        showToastOnce('no-accounts-found', 'No accounts found', 'error', {
          message: 'Please check your Keplr wallet and try again',
        });
        return null;
      }

      if (offlineSigner === undefined) {
        showToastOnce('no-offline-signer', 'No offline signer found', 'error', {
          message: 'Unable to access Keplr wallet signer',
        });
        return null;
      }

      const client = new SecretNetworkClient({
        chainId: finalChainId,
        url: finalRpcUrl,
        wallet: offlineSigner,
        walletAddress: accounts[0].address,
        encryptionUtils: enigmaUtils,
      });

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
