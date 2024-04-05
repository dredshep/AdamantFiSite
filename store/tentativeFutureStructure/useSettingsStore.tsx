import { create } from "zustand";

interface SettingsStoreState {
  slippage: number;
  gas: number;
  setSlippage: (slippage: number) => void;
  setGas: (gas: number) => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  slippage: 0.5,
  gas: 0,
  setSlippage: (slippage) => set({ slippage }),
  setGas: (gas) => set({ gas }),
}));
