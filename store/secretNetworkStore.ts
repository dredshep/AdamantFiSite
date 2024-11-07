import { Keplr } from '@keplr-wallet/types';
import { SecretNetworkClient } from 'secretjs';
import { create } from 'zustand';

interface SecretNetworkState {
  secretjs: SecretNetworkClient | null;
  keplr: Keplr | null;
  walletAddress: string | null;
  isConnecting: boolean;
  setSecretjs: (client: SecretNetworkClient | null) => void;
  setKeplr: (keplr: Keplr | null) => void;
  setWalletAddress: (address: string | null) => void;
  setIsConnecting: (isConnecting: boolean) => void;
}

export const useSecretNetworkStore = create<SecretNetworkState>((set) => ({
  secretjs: null,
  keplr: null,
  walletAddress: null,
  isConnecting: false,
  setSecretjs: (client) => set({ secretjs: client }),
  setKeplr: (keplr) => set({ keplr }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
}));
