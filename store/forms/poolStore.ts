import { create } from "zustand";
import { SwappableToken } from "@/types/Token";
import { Pair } from "@/types/api/Factory";
import { PoolTokenInputs, TokenInputState } from "@/types";

interface SelectedPool {
  address: string;
  token0?: SwappableToken;
  token1?: SwappableToken;
  pairInfo: Pair;
}

interface PoolStore {
  selectedPool?: SelectedPool;
  tokenInputs: PoolTokenInputs;
  setSelectedPool: (pool: SelectedPool) => void;
  setTokenInputAmount: (
    identifier: keyof PoolTokenInputs,
    amount: string
  ) => void;
}

const defaultTokenInputState: TokenInputState = {
  tokenAddress: "secret1empty",
  amount: "",
  balance: "",
};

export const usePoolStore = create<PoolStore>((set) => ({
  tokenInputs: {
    "pool.deposit.tokenA": defaultTokenInputState,
    "pool.deposit.tokenB": defaultTokenInputState,
    "pool.withdraw.tokenA": defaultTokenInputState,
    "pool.withdraw.tokenB": defaultTokenInputState,
    "pool.withdraw.lpToken": defaultTokenInputState,
  },
  setSelectedPool: (pool) => set({ selectedPool: pool }),
  setTokenInputAmount: (identifier, amount) =>
    set((state) => ({
      tokenInputs: {
        ...state.tokenInputs,
        [identifier]: {
          ...state.tokenInputs[identifier],
          amount,
        },
      },
    })),
}));
