import { create } from "zustand";
import { TokenInputState, TokenInputs } from "@/types";

interface TokenInputsStoreState {
  tokenInputs: TokenInputs;
  setTokenInputProperty: <T extends keyof TokenInputState>(
    inputIdentifier: keyof TokenInputs,
    property: T,
    value: TokenInputState[T]
  ) => void;
}

export const useTokenInputsStore = create<TokenInputsStoreState>((set) => ({
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
  setTokenInputProperty: (inputIdentifier, property, value) =>
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
}));
