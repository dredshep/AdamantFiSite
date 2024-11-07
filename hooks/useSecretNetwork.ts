import { useSecretNetworkStore } from '@/store/secretNetworkStore';
import isNotNullish from '@/utils/isNotNullish';
import { Window } from '@keplr-wallet/types';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { SecretNetworkClient } from 'secretjs';

export enum SecretNetworkError {
  NO_KEPLR = 'NO_KEPLR',
  NO_ACCOUNTS = 'NO_ACCOUNTS',
  NO_SIGNER = 'NO_SIGNER',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
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

  const connectKeplr = useCallback(async () => {
    if (isConnecting || secretjs !== null) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('Attempting to connect to Keplr...');
      const keplrInstance = (window as unknown as Window).keplr;

      if (!isNotNullish(keplrInstance)) {
        console.error('Keplr not found');
        setError(SecretNetworkError.NO_KEPLR);
        toast.error('Please install Keplr extension', {
          onClick: () => window.open('https://www.keplr.app/download', '_blank'),
        });
        return;
      }

      console.log('Enabling Keplr for secret-4...');
      await keplrInstance.enable('secret-4');
      setKeplr(keplrInstance);

      const offlineSigner = keplrInstance.getOfflineSignerOnlyAmino('secret-4');
      const enigmaUtils = keplrInstance.getEnigmaUtils('secret-4');

      if (typeof offlineSigner === 'undefined' || offlineSigner === null) {
        console.error('No offline signer found');
        setError(SecretNetworkError.NO_SIGNER);
        toast.error('Failed to get Keplr signer');
        return;
      }

      console.log('Getting accounts...');
      const accounts = await offlineSigner.getAccounts();
      const firstAccount = accounts[0];

      if (typeof firstAccount === 'undefined' || accounts.length === 0) {
        console.error('No accounts found');
        setError(SecretNetworkError.NO_ACCOUNTS);
        toast.error('No Keplr accounts found');
        return;
      }

      console.log('Creating SecretNetworkClient...');
      const client = new SecretNetworkClient({
        chainId: 'secret-4',
        url: 'https://rpc.ankr.com/http/scrt_cosmos',
        wallet: offlineSigner,
        walletAddress: firstAccount.address,
        encryptionUtils: enigmaUtils,
      });

      // Verify connection
      try {
        await client.query.bank.balance({
          address: firstAccount.address,
          denom: 'uscrt',
        });
      } catch (e) {
        console.error('Failed to verify connection:', e);
        setError(SecretNetworkError.CONNECTION_FAILED);
        toast.error('Failed to connect to Secret Network');
        return;
      }

      console.log('Successfully connected to Secret Network');
      setWalletAddress(firstAccount.address);
      setSecretjs(client);

      toast.success('Connected to Secret Network');
    } catch (error) {
      console.error('Error connecting to Secret Network:', error);
      setError(SecretNetworkError.CONNECTION_FAILED);
      toast.error('Failed to connect to Secret Network');
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, secretjs, setIsConnecting, setKeplr, setSecretjs, setWalletAddress]);

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

  return {
    secretjs,
    walletAddress,
    keplr,
    isConnecting,
    error,
    connect: connectKeplr,
  };
}
