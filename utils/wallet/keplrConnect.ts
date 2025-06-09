import { useSwapStore } from '@/store/swapStore';
import { useWalletStore } from '@/store/walletStore';
import { SecretString } from '@/types';
import { GLOBAL_TOAST_IDS, resetToastCooldown, toastManager } from '@/utils/toast/toastManager';
import { Window } from '@keplr-wallet/types';

const keplrConnect = async () => {
  // Reset the cooldown for Keplr not installed toast to allow it to show again
  // This is important for manual connect attempts after the user has seen and closed the toast
  resetToastCooldown(GLOBAL_TOAST_IDS.KEPLR_NOT_INSTALLED);

  const { keplr } = window as unknown as Window;
  if (keplr) {
    try {
      const chainId = 'secret-4';
      await keplr.enable(chainId);
      const offlineSigner = keplr.getOfflineSigner(chainId);
      const accounts = await offlineSigner.getAccounts();

      if (accounts !== undefined && accounts.length > 0 && accounts[0] !== undefined) {
        const { address } = accounts[0];
        useWalletStore.getState().connectWallet(address as SecretString);
        console.log('Connected to Keplr.');
      }
    } catch (error) {
      console.error('Error connecting to Keplr:', error);
      useSwapStore.getState().setConnectionRefused(true);
    }
  } else {
    console.log('Keplr extension not found.');
    // Show toast when Keplr is not installed
    toastManager.keplrNotInstalled();
  }
};

export default keplrConnect;
