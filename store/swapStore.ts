import { create } from "zustand";
import { Token } from "@/types";

interface TokenInputState {
  token: Token;
  amount: string;
}

export interface TokenInputs {
  "swap.pay": TokenInputState;
  "swap.receive": TokenInputState;
}

interface StoreState {
  tokenInputs: TokenInputs;
  slippage: number;
  gas: number;
  setTokenInputProperty: <T extends keyof TokenInputState>(
    inputIdentifier: keyof TokenInputs,
    property: T,
    value: TokenInputState[T]
  ) => void;
  setSlippage: (slippage: number) => void;
  setGas: (gas: number) => void;
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
  slippage: 0.5,
  gas: 0,
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
  setSlippage: (slippage: number) => set({ slippage }),
  setGas: (gas: number) => set({ gas }),
}));

// const adjustTokenExample = (inputIdentifier: keyof TokenInputs, token: Token) => {
//   const store = useStore();
//   store.setTokenInputProperty(inputIdentifier, 'token', token);
// };

// const adjustAmountExample = (inputIdentifier: keyof TokenInputs, amount: string) => {
//   const store = useStore();
//   store.setTokenInputProperty(inputIdentifier, 'amount', amount);
// };
