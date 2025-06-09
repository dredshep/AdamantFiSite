import { create } from 'zustand';

export type BalanceStatus = {
  amount: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
};

interface BalanceStoreState {
  balances: Record<string, Partial<BalanceStatus>>;
  setBalance: (address: string, status: Partial<BalanceStatus>) => void;
  getBalance: (address: string) => Partial<BalanceStatus> | undefined;
}

export const useBalanceStore = create<BalanceStoreState>((set, get) => ({
  balances: {},
  setBalance: (address, status) => {
    set((state) => {
      const existingEntry = state.balances[address] ?? {};
      const newEntry: Partial<BalanceStatus> = {
        ...existingEntry,
        ...status,
        lastUpdated: Date.now(),
      };

      return {
        balances: {
          ...state.balances,
          [address]: newEntry,
        },
      };
    });
  },
  getBalance: (address) => get().balances[address],
}));
