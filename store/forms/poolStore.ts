import { create } from "zustand";

interface PoolState {
  tokenInputs: {
    [key: string]: {
      amount: string;
      balance: number;
    };
  };
  setTokenInputAmount: (inputIdentifier: string, amount: string) => void;
  setMax: (inputIdentifier: string) => void;
}

export const usePoolStore = create<PoolState>((set) => ({
  tokenInputs: {},
  setTokenInputAmount: (inputIdentifier, amount) =>
    set((state) => ({
      tokenInputs: {
        ...state.tokenInputs,
        [inputIdentifier]: {
          ...state.tokenInputs[inputIdentifier],
          amount,
        },
      },
    })),
  setMax: (inputIdentifier) =>
    set((state) => ({
      tokenInputs: {
        ...state.tokenInputs,
        [inputIdentifier]: {
          ...state.tokenInputs[inputIdentifier],
          amount: state.tokenInputs[inputIdentifier].balance.toString(),
        },
      },
    })),
}));
