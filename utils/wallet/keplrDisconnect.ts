import { useSwapStore } from '@/store/swapStore';
import { useWalletStore } from '@/store/walletStore';

const keplrDisconnect = () => {
  useSwapStore.getState().disconnectWallet();
  useWalletStore.getState().disconnectWallet();

  useSwapStore.getState().updateBalance('SCRT', '-');
  useSwapStore.getState().updateBalance('bADMT', '-');
  useSwapStore.getState().setConnectionRefused(true);

  console.log('Disconnected from Keplr.');
};

export default keplrDisconnect;
