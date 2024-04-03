import { create } from "zustand";
import {
  SharedSettings,
  StoreState,
  Token,
  TokenInputState,
  TokenInputs,
} from "@/types";

export const useStore = create<StoreState>((set) => ({
  tokenInputs: {
    "swap.pay": {
      token: {
        symbol: "sSCRT",
        address: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
      },
      amount: "",
    },
    "swap.receive": {
      token: {
        symbol: "SEFI",
        address: "secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt",
      },
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
  swappableTokens: [], // Add this line to initialize the swappable tokens list
  setSwappableTokens: (tokens) => set({ swappableTokens: tokens }), // Method to update the list
}));
