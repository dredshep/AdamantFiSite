import { create } from "zustand";
import {
  SecretString,
  SharedSettings,
  SwapStoreState,
  TokenInputState,
  SwapTokenInputs,
} from "@/types";
import updateState from "@/store/utils/updateState";

export const useSwapStore = create<SwapStoreState>((set) => ({
  swapTokenInputs: {
    "swap.pay": {
      tokenAddress: "secret1zxt48uqzquvjsp2a7suzxlyd9n3jfpdw4k5zve",
      amount: "",
      balance: "",
    },
    "swap.receive": {
      tokenAddress: "secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt",
      amount: "",
      balance: "",
    },
  },
  sharedSettings: {
    slippage: 0.5,
    gas: 0,
  },
  wallet: {
    address: null,
    SCRTBalance: "0",
    ADMTBalance: "0",
  },
  swappableTokens: [],
  chainId: "secret-4",
  connectionRefused: false,

  setTokenInputProperty: <T extends keyof TokenInputState>(
    inputIdentifier: keyof SwapTokenInputs,
    property: T,
    value: TokenInputState[T]
  ) =>
    set((state) =>
      updateState(state, "swapTokenInputs", inputIdentifier, {
        ...state.swapTokenInputs[inputIdentifier],
        [property]: value,
      })
    ),

  setSharedSetting: <T extends keyof SharedSettings>(
    setting: T,
    value: SharedSettings[T]
  ) => set((state) => updateState(state, "sharedSettings", setting, value)),

  connectWallet: (address: SecretString) =>
    set((state) => updateState(state, "wallet", "address", address)),

  disconnectWallet: () =>
    set((state) => updateState(state, "wallet", "address", null)),

  updateBalance: (tokenSymbol: "SCRT" | "ADMT", balance: string) =>
    set((state) =>
      updateState(state, "wallet", `${tokenSymbol}Balance`, balance)
    ),

  setSwappableTokens: (tokens) => set({ swappableTokens: tokens }),
  setChainId: (chainId) => set({ chainId }),
  setConnectionRefused: (refused) => set({ connectionRefused: refused }),
  setPoolTokens: (token0Address: SecretString, token1Address: SecretString) =>
    set((state) => ({
      ...state, // Keep all other state
      swapTokenInputs: {
        ...state.swapTokenInputs,
        "swap.pay": {
          ...state.swapTokenInputs["swap.pay"],
          tokenAddress: token0Address,
          amount: "",
        },
        "swap.receive": {
          ...state.swapTokenInputs["swap.receive"],
          tokenAddress: token1Address,
          amount: "",
        },
      },
    })),
}));
