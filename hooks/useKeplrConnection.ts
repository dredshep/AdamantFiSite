import isNotNullish from '@/utils/isNotNullish';
import { showToastOnce, toastManager } from '@/utils/toast/toastManager';
import { Window } from '@keplr-wallet/types';
import { useCallback, useEffect, useState } from 'react';
import { SecretNetworkClient } from 'secretjs';

export function useKeplrConnection(
  chainId = 'secret-4',
  rpcUrl = 'https://rpc.ankr.com/http/scrt_cosmos'
) {
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<string>(chainId);

  const connect = useCallback(async () => {
    const keplr = (window as unknown as Window).keplr;
    if (!isNotNullish(keplr)) {
      toastManager.keplrNotInstalled();
      return null;
    }

    try {
      await keplr.enable(chainId);

      const offlineSigner = keplr.getOfflineSignerOnlyAmino(chainId);
      const enigmaUtils = keplr.getEnigmaUtils(chainId);
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
        chainId,
        url: rpcUrl,
        wallet: offlineSigner,
        walletAddress: accounts[0].address,
        encryptionUtils: enigmaUtils,
      });

      setWalletAddress(accounts[0].address);
      setSecretjs(client);
      setCurrentChainId(chainId);
      return client;
    } catch (error) {
      console.error('Error connecting to Keplr:', error);
      showToastOnce('keplr-connection-error', 'Connection error', 'error', {
        message: 'Failed to connect to Keplr wallet. Please refresh the page and try again.',
      });
      return null;
    }
  }, [chainId, rpcUrl]);

  useEffect(() => {
    void connect();
  }, [connect]);

  return { secretjs, walletAddress, chainId: currentChainId, connect };
}
