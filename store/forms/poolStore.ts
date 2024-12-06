import { PoolTokenInputs, SecretString, TokenInputState } from "@/types";
import { Pair } from "@/types/api/Factory";
import { ApiToken } from "@/utils/apis/getSwappableTokens";
import { create } from "zustand";

interface SelectedPool {
  address: SecretString;
  token0?: ApiToken;
  token1?: ApiToken;
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
