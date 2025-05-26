import isNotNullish from '@/utils/isNotNullish';
import { toastManager } from '@/utils/toast/toastManager';
import { Window } from '@keplr-wallet/types';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
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
        toast.error('No accounts found');
        return null;
      }

      if (offlineSigner === undefined) {
        toast.error('No offline signer found');
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
      toastManager.connectionError();
      return null;
    }
  }, [chainId, rpcUrl]);

  useEffect(() => {
    void connect();
  }, [connect]);

  return { secretjs, walletAddress, chainId: currentChainId, connect };
}
