import { ConfigToken } from '@/config/tokens';
import updateState from '@/store/utils/updateState';
import {
  SecretString,
  SharedSettings,
  SwapStoreState,
  SwapTokenInputs,
  TokenInputState,
  WalletState,
} from '@/types';
import { create } from 'zustand';

export const useSwapStore = create<SwapStoreState>((set, get) => ({
  swapTokenInputs: {
    'swap.pay': {
      tokenAddress: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek',
      amount: '',
      balance: '',
    },
    'swap.receive': {
      tokenAddress: 'secret1chsejpk9kfj4vt9ec6xvyguw539gsdtr775us2',
      amount: '',
      balance: '',
    },
  },
  sharedSettings: {
    slippage: 0.5,
    gas: 0.25,
  },
  wallet: {
    address: null,
    SCRTBalance: '-',
    ADMTBalance: '-',
  } as WalletState,
  swappableTokens: [] as ConfigToken[],
  chainId: 'secret-4',
  connectionRefused: false,

  setTokenInputProperty: <T extends keyof TokenInputState>(
    inputIdentifier: keyof SwapTokenInputs,
    property: T,
    value: TokenInputState[T]
  ) =>
    set((state) =>
      updateState(state, 'swapTokenInputs', inputIdentifier, {
        ...state.swapTokenInputs[inputIdentifier],
        [property]: value,
      })
    ),

  setSharedSetting: <T extends keyof SharedSettings>(setting: T, value: SharedSettings[T]) =>
    set((state) => ({ ...state, sharedSettings: { ...state.sharedSettings, [setting]: value } })),

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

  updateBalance: (tokenSymbol: 'SCRT' | 'ADMT', balance: string) =>
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
        'swap.pay': {
          ...state.swapTokenInputs['swap.pay'],
          tokenAddress: token0Address,
          amount: '',
        },
        'swap.receive': {
          ...state.swapTokenInputs['swap.receive'],
          tokenAddress: token1Address,
          amount: '',
        },
      },
    })),

  setSlippage: (slippage: number) =>
    set((state) => ({
      ...state,
      sharedSettings: {
        ...state.sharedSettings,
        slippage,
      },
    })),

  // Enhanced method to get available tokens for selection based on multihop routing
  getAvailableTokensForInput: (inputIdentifier: keyof SwapTokenInputs): ConfigToken[] => {
    const state = get();
    const otherInputIdentifier = inputIdentifier === 'swap.pay' ? 'swap.receive' : 'swap.pay';
    const otherTokenAddress = state.swapTokenInputs[otherInputIdentifier].tokenAddress;

    // Handle null case
    if (!state.swappableTokens) {
      return [];
    }

    // With multihop routing enabled, any token can swap to any other token through sSCRT
    // The only restriction is that we can't select the same token for both inputs
    const availableTokens = state.swappableTokens.filter(
      (token) => token.address !== otherTokenAddress
    );

    console.log('🔄 Token selection for multihop:', {
      inputIdentifier,
      otherTokenAddress,
      availableTokensCount: availableTokens.length,
      totalTokens: state.swappableTokens.length,
    });

    return availableTokens;
  },

  // Clear token selection for a specific input
  clearTokenSelection: (inputIdentifier: keyof SwapTokenInputs) =>
    set((state) => ({
      ...state,
      swapTokenInputs: {
        ...state.swapTokenInputs,
        [inputIdentifier]: {
          ...state.swapTokenInputs[inputIdentifier],
          tokenAddress: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek' as SecretString, // Default to sSCRT
          amount: '',
        },
      },
    })),

  // Reset both token selections with multihop-aware defaults
  resetTokenSelections: () =>
    set((state) => {
      // Smart reset: if already at default, change to different tokens
      const currentPayToken = state.swapTokenInputs['swap.pay'].tokenAddress;
      const currentReceiveToken = state.swapTokenInputs['swap.receive'].tokenAddress;

      const defaultsSCRTtoUSDC =
        currentPayToken === 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek' &&
        currentReceiveToken === 'secret1chsejpk9kfj4vt9ec6xvyguw539gsdtr775us2';

      return {
        ...state,
        swapTokenInputs: {
          'swap.pay': {
            tokenAddress: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek' as SecretString, // Always sSCRT for pay
            amount: '',
            balance: '',
          },
          'swap.receive': {
            // If currently sSCRT → USDC, reset to sSCRT → sATOM (popular multihop pair)
            // Otherwise reset to sSCRT → USDC
            tokenAddress: defaultsSCRTtoUSDC
              ? ('secret19e75l25r6sa6nhdf4lggjmgpw0vmpfvsw5cnpe' as SecretString) // sATOM
              : ('secret1chsejpk9kfj4vt9ec6xvyguw539gsdtr775us2' as SecretString), // USDC
            amount: '',
            balance: '',
          },
        },
      };
    }),
}));
