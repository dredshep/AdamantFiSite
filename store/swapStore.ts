import { create } from "zustand";
import { Token } from "@/types";

interface TokenInputState {
  token: Token;
  amount: string;
}

// Extending TokenInputs to hold identifiers for gas and slippage
export interface TokenInputs {
  "swap.pay": TokenInputState;
  "swap.receive": TokenInputState;
}

// New structure for shared settings like gas and slippage across forms
interface SharedSettings {
  slippage: number;
  gas: number;
}

export interface StoreState {
  tokenInputs: TokenInputs;
  sharedSettings: SharedSettings; // Shared settings for transactions
  setTokenInputProperty: <T extends keyof TokenInputState>(
    inputIdentifier: keyof TokenInputs,
    property: T,
    value: TokenInputState[T]
  ) => void;
  // Generalizing setters for shared settings
  setSharedSetting: <T extends keyof SharedSettings>(
    setting: T,
    value: SharedSettings[T]
  ) => void;
}

export const useStore = create<StoreState>((set) => ({
  tokenInputs: {
    "swap.pay": {
      token: { symbol: "sSCRT", address: "secret1k0jnty" },
      amount: "",
    },
    "swap.receive": {
      token: { symbol: "SEFI", address: "secret15l9" },
      amount: "",
    },
  },
  sharedSettings: {
    slippage: 0.5,
    gas: 0,
  },
  setTokenInputProperty: <T extends keyof TokenInputState>(
    inputIdentifier: keyof TokenInputs,
    property: T,
    value: TokenInputState[T]
  ) =>
    set((state) => ({
      ...state,
      tokenInputs: {
        ...state.tokenInputs,
        [inputIdentifier]: {
          ...state.tokenInputs[inputIdentifier],
          [property]: value,
        },
      },
    })),
  setSharedSetting: <T extends keyof SharedSettings>(
    setting: T,
    value: SharedSettings[T]
  ) =>
    set((state) => ({
      ...state,
      sharedSettings: { ...state.sharedSettings, [setting]: value },
    })),
}));
