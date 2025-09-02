// Enhanced swapStore.ts with multihop token selection logic
// Copy this back to store/swapStore.ts when ready to re-enable multihop

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
import { findMultihopPath, getReachableTokens } from './routing';

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
    SCRTBalance: '0',
    ADMTBalance: '0',
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

  updateBalance: (tokenSymbol: 'SCRT' | 'bADMT', balance: string) =>
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

    // If no other token is selected, return all swappable tokens
    if (!otherTokenAddress) {
      return state.swappableTokens;
    }

    // Get all tokens that can be reached from the other token using multihop routing
    const reachableTokenAddresses = getReachableTokens(otherTokenAddress);

    // Also include tokens that can reach the other token (for reverse routing)
    const reverseReachableTokens = state.swappableTokens.filter((token) => {
      if (token.address === otherTokenAddress) return false;
      const path = findMultihopPath(token.address, otherTokenAddress);
      return path !== null;
    });

    // Combine both direct and reverse reachable tokens
    const allReachableAddresses = new Set([
      ...reachableTokenAddresses,
      ...reverseReachableTokens.map((token) => token.address),
    ]);

    // Convert addresses back to ConfigToken objects
    const availableTokens = state.swappableTokens.filter(
      (token) => allReachableAddresses.has(token.address) && token.address !== otherTokenAddress
    );

    // If no compatible tokens found, show all swappable tokens (fallback)
    if (availableTokens.length === 0) {
      console.warn(
        `No compatible tokens found for routing from/to ${otherTokenAddress}, showing all swappable tokens`
      );
      return state.swappableTokens.filter((token) => token.address !== otherTokenAddress);
    }

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

  // Reset both token selections
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
            // If currently sSCRT → USDC, reset to sSCRT → SILK, otherwise reset to sSCRT → USDC
            tokenAddress: defaultsSCRTtoUSDC
              ? ('secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd' as SecretString) // SILK
              : ('secret1chsejpk9kfj4vt9ec6xvyguw539gsdtr775us2' as SecretString), // USDC
            amount: '',
            balance: '',
          },
        },
      };
    }),
}));
