import updateState from "@/store/utils/updateState";
import {
    SecretString,
    SharedSettings,
    SwapStoreState,
    SwapTokenInputs,
    TokenInputState,
    WalletState,
} from "@/types";
import { ApiToken } from "@/utils/apis/getSwappableTokens";
import { create } from "zustand";



export const useSwapStore = create<SwapStoreState>((set) => ({
  swapTokenInputs: {
    "swap.pay": {
      tokenAddress: "secret1h6z05y90gwm4sqxzhz4pkyp36cna9xtp7q0urv",
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
  } as WalletState,
  swappableTokens: [] as ApiToken[],
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
  ) => set((state) => ({ ...state, sharedSettings: { ...state.sharedSettings, [setting]: value } })),

  connectWallet: (address: SecretString) =>
    set((state) => ({
      ...state,
      wallet: { ...state.wallet, address },
    })),

  disconnectWallet: () =>
    set((state) => ({
      ...state,
      wallet: { ...state.wallet, address: null },
    })),

  updateBalance: (tokenSymbol: "SCRT" | "ADMT", balance: string) =>
    set((state) => ({
      ...state,
      wallet: { ...state.wallet, [`${tokenSymbol}Balance`]: balance },
    })),

  setSwappableTokens: (tokens) => set({ swappableTokens: tokens }),
  setChainId: (chainId) => set({ chainId }),
  setConnectionRefused: (refused) => set({ connectionRefused: refused }),
  setPoolTokens: (token0Address: SecretString, token1Address: SecretString) =>
    set((state) => ({
      ...state,
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

  setSlippage: (slippage: number) => 
    set((state) => ({
      ...state,
      sharedSettings: {
        ...state.sharedSettings,
        slippage,
      }
    })),
}));
