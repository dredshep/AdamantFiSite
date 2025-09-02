import { SecretString } from '@/types';
import { create } from 'zustand';

interface WalletStoreState {
  address: SecretString | null;
  SCRTBalance: string;
  ADMTBalance: string;
  connectWallet: (address: SecretString) => void;
  disconnectWallet: () => void;
  updateBalance: (tokenSymbol: 'SCRT' | 'ADMT', balance: string) => void;
}

export const useWalletStore = create<WalletStoreState>((set) => ({
  address: null,
  SCRTBalance: '-',
  ADMTBalance: '-',
  connectWallet: (address) => set({ address }),
  disconnectWallet: () => set({ address: null, SCRTBalance: '-', ADMTBalance: '-' }),
  updateBalance: (tokenSymbol, balance) =>
    set((state) => ({
      ...state,
      [`${tokenSymbol}Balance`]: balance,
    })),
}));
