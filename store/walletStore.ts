import { create } from "zustand";
import { SecretString } from "@/types";

interface WalletStoreState {
  address: SecretString | null;
  SCRTBalance: string;
  ADMTBalance: string;
  connectWallet: (address: SecretString) => void;
  disconnectWallet: () => void;
  updateBalance: (tokenSymbol: "SCRT" | "ADMT", balance: string) => void;
}

export const useWalletStore = create<WalletStoreState>((set) => ({
  address: null,
  SCRTBalance: "0",
  ADMTBalance: "0",
  connectWallet: (address) =>
    set({ address, SCRTBalance: "0", ADMTBalance: "0" }),
  disconnectWallet: () =>
    set({ address: null, SCRTBalance: "0", ADMTBalance: "0" }),
  updateBalance: (tokenSymbol, balance) =>
    set((state) => ({
      ...state,
      [`${tokenSymbol}Balance`]: balance,
    })),
}));
