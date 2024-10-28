import { create } from "zustand";
import { SwappableToken } from "@/types/Token";
import { Pair } from "@/types/api/Factory";

interface SelectedPool {
  address: string;
  token0?: SwappableToken;
  token1?: SwappableToken;
  pairInfo: Pair;
}

interface PoolStore {
  selectedPool?: SelectedPool;
  tokenInputs: Record<string, { amount: string }>;
  setSelectedPool: (pool: SelectedPool) => void;
  setTokenInputAmount: (identifier: string, amount: string) => void;
}

export const usePoolStore = create<PoolStore>((set) => ({
  tokenInputs: {},
  setSelectedPool: (pool) => set({ selectedPool: pool }),
  setTokenInputAmount: (identifier, amount) =>
    set((state) => ({
      tokenInputs: {
        ...state.tokenInputs,
        [identifier]: { amount },
      },
    })),
}));
