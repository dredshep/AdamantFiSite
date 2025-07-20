import { LiquidityPair } from '@/config/tokens';
import { PoolTokenInputs, TokenInputState } from '@/types';
import { create, StateCreator } from 'zustand';

export type SelectedPool = LiquidityPair;

interface PoolStore {
  selectedPool?: SelectedPool;
  tokenInputs: PoolTokenInputs;
  setSelectedPool: (pool: SelectedPool) => void;
  setTokenInputAmount: (identifier: keyof PoolTokenInputs, amount: string) => void;
  setTokenInputBalance: (identifier: keyof PoolTokenInputs, balance: string) => void;
  setTokenInputAmountWithRatio: (identifier: keyof PoolTokenInputs, amount: string) => void;
}

const defaultTokenInputState: TokenInputState = {
  tokenAddress: 'secret1empty',
  amount: '',
  balance: '',
};

const poolStoreCreator: StateCreator<PoolStore> = (set) => ({
  tokenInputs: {
    'pool.deposit.tokenA': defaultTokenInputState,
    'pool.deposit.tokenB': defaultTokenInputState,
    'pool.withdraw.tokenA': defaultTokenInputState,
    'pool.withdraw.tokenB': defaultTokenInputState,
    'pool.withdraw.lpToken': defaultTokenInputState,
  },
  setSelectedPool: (pool: SelectedPool) => set({ selectedPool: pool }),
  setTokenInputAmount: (identifier: keyof PoolTokenInputs, amount: string) =>
    set((state) => {
      // Create a new object for tokenInputs to ensure re-render
      const newTokenInputs = { ...state.tokenInputs };
      // Deep copy the specific token input state to avoid direct mutation
      newTokenInputs[identifier] = { ...newTokenInputs[identifier], amount };
      return { tokenInputs: newTokenInputs };
    }),
  setTokenInputBalance: (identifier: keyof PoolTokenInputs, balance: string) =>
    set((state) => {
      const newTokenInputs = { ...state.tokenInputs };
      newTokenInputs[identifier] = { ...newTokenInputs[identifier], balance };
      return { tokenInputs: newTokenInputs };
    }),
  setTokenInputAmountWithRatio: (identifier: keyof PoolTokenInputs, amount: string) =>
    set((state) => {
      const newTokenInputs = { ...state.tokenInputs };
      newTokenInputs[identifier] = { ...newTokenInputs[identifier], amount };
      return { tokenInputs: newTokenInputs };
    }),
});

export const usePoolStore = create<PoolStore>(poolStoreCreator);
