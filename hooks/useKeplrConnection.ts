import isNotNullish from '@/utils/isNotNullish';
import { Window } from '@keplr-wallet/types';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { SecretNetworkClient } from 'secretjs';

export function useKeplrConnection(
  chainId = 'secret-4',
  rpcUrl = 'https://rpc.ankr.com/http/scrt_cosmos'
) {
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    async function connect() {
      const keplr = (window as unknown as Window).keplr;
      if (!isNotNullish(keplr)) {
        toast.error('Please install Keplr extension');
        return;
      }

      try {
        await keplr.enable(chainId);

        const offlineSigner = keplr.getOfflineSignerOnlyAmino(chainId);
        const enigmaUtils = keplr.getEnigmaUtils(chainId);
        const accounts = await offlineSigner?.getAccounts();

        if (!accounts?.length || !accounts[0]) {
          toast.error('No accounts found');
          return;
        }

        if (offlineSigner === undefined) {
          toast.error('No offline signer found');
          return;
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
      } catch (error) {
        console.error('Error connecting to Keplr:', error);
        toast.error('Failed to connect to Keplr');
      }
    }

    void connect();
  }, [chainId, rpcUrl]);

  return { secretjs, walletAddress };
}
