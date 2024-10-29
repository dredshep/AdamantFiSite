import { create } from "zustand";
import { TokenInputState, SwapTokenInputs } from "@/types";

interface TokenInputsStoreState {
  tokenInputs: SwapTokenInputs;
  setTokenInputProperty: <T extends keyof TokenInputState>(
    inputIdentifier: keyof SwapTokenInputs,
    property: T,
    value: TokenInputState[T]
  ) => void;
}

export const useTokenInputsStore = create<TokenInputsStoreState>((set) => ({
  tokenInputs: {
    "swap.pay": {
      tokenAddress: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
      amount: "",
      balance: "",
    },
    "swap.receive": {
      tokenAddress: "secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt",
      amount: "",
      balance: "",
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
