import { Keplr } from '@keplr-wallet/types';
import { SecretNetworkClient } from 'secretjs';

declare global {
  interface Window {
    keplr?: Keplr;
  }
}

export const initKeplr = async () => {
  const keplr = window.keplr;
  if (!keplr) {
    throw new Error('Please install Keplr extension');
  }

  await keplr.enable('secret-4');
  const offlineSigner = keplr.getOfflineSignerOnlyAmino('secret-4');
  const enigmaUtils = keplr.getEnigmaUtils('secret-4');
  const accounts = await offlineSigner.getAccounts();

  if (accounts.length === 0) {
    throw new Error('No account found in Keplr');
  }

  const [firstAccount] = accounts;
  if (!firstAccount || typeof firstAccount.address !== 'string' || !firstAccount.address) {
    throw new Error('Invalid account data from Keplr');
  }

  const secretjs = new SecretNetworkClient({
    chainId: 'secret-4',
    url: 'https://rpc.ankr.com/http/scrt_cosmos',
    wallet: offlineSigner,
    walletAddress: firstAccount.address,
    encryptionUtils: enigmaUtils,
  });

  return {
    secretjs,
    walletAddress: firstAccount.address,
  };
};
