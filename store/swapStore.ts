import { create } from "zustand";
import {
  SecretString,
  SharedSettings,
  StoreState,
  TokenInputState,
  SwapTokenInputs,
} from "@/types";
import updateState from "@/store/utils/updateState";

export const useStore = create<StoreState>((set) => ({
  tokenInputs: {
    "swap.pay": {
      tokenAddress: "secret1zxt48uqzquvjsp2a7suzxlyd9n3jfpdw4k5zve",
      amount: "",
    },
    "swap.receive": {
      tokenAddress: "secret15l9cqgz5uezgydrglaak5ahfac69kmx2qpd6xt",
      amount: "",
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
      updateState(state, "tokenInputs", inputIdentifier, {
        tokenAddress: state.tokenInputs[inputIdentifier].tokenAddress,
        amount: state.tokenInputs[inputIdentifier].amount,
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
}));
