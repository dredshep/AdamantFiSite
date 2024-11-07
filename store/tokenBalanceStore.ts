import { TokenBalanceError } from '@/hooks/useTokenBalance';
import { create } from 'zustand';

interface TokenBalance {
  amount: string | null;
  lastUpdated: number;
  loading: boolean;
  error: TokenBalanceError | null;
}

interface TokenBalanceState {
  balances: Record<string, TokenBalance>;
  setBalance: (tokenAddress: string, balance: TokenBalance) => void;
  getBalance: (tokenAddress: string) => TokenBalance | null;
  setLoading: (tokenAddress: string, loading: boolean) => void;
  setError: (tokenAddress: string, error: TokenBalanceError) => void;
}

const DEFAULT_BALANCE: TokenBalance = {
  amount: null,
  lastUpdated: 0,
  loading: false,
  error: null,
};

export const useTokenBalanceStore = create<TokenBalanceState>((set, get) => ({
  balances: {},
  setBalance: (tokenAddress, balance) =>
    set((state) => ({
      balances: {
        ...state.balances,
        [tokenAddress]: {
          ...balance,
          lastUpdated: Date.now(),
        },
      },
    })),
  getBalance: (tokenAddress) => get().balances[tokenAddress] ?? null,
  setLoading: (tokenAddress, loading) =>
    set((state) => ({
      balances: {
        ...state.balances,
        [tokenAddress]: {
          ...(state.balances[tokenAddress] ?? DEFAULT_BALANCE),
          loading,
        },
      },
    })),
  setError: (tokenAddress, error) =>
    set((state) => ({
      balances: {
        ...state.balances,
        [tokenAddress]: {
          ...(state.balances[tokenAddress] ?? DEFAULT_BALANCE),
          error,
          amount: null,
          loading: false,
        },
      },
    })),
}));
