import { createWalletClient } from '@/hooks/useSecretNetwork';
import { getSecretNetworkEnvVars } from '@/utils/env';
import { SecretNetworkClient } from 'secretjs';
import { waitForKeplr } from './keplrDetection';

export const initKeplr = async (): Promise<{
  secretjs: SecretNetworkClient;
  walletAddress: string;
}> => {
  const keplr = await waitForKeplr(2300);
  if (!keplr) {
    throw new Error('Please install Keplr extension');
  }

  // Reuse centralized wallet client creation for consistent config/env
  const secretjs = await createWalletClient();
  if (!secretjs) {
    throw new Error('Failed to initialize Keplr');
  }

  // Resolve wallet address via Keplr to avoid relying on client internals
  const { CHAIN_ID } = getSecretNetworkEnvVars();
  const offlineSigner = keplr.getOfflineSignerOnlyAmino(CHAIN_ID);
  const accounts = await offlineSigner.getAccounts();
  if (!accounts.length || !accounts[0]?.address) {
    throw new Error('No account found in Keplr');
  }

  return {
    secretjs,
    walletAddress: accounts[0].address,
  };
};
