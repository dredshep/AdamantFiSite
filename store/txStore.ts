import { create } from "zustand";
import { TxResponse, TxResultCode } from "secretjs";

interface TxStoreState {
  pending: boolean;
  result: TxResponse | null;
  isSuccess: boolean;
  setPending: (pending: boolean) => void;
  setResult: (result: TxResponse) => void;
  reset: () => void;
}

export const useTxStore = create<TxStoreState>((set) => ({
  pending: false,
  result: null,
  isSuccess: false,

  setPending: (pending) =>
    set(() => ({
      pending,
    })),

  setResult: (result) =>
    set(() => ({
      result,
      isSuccess: result.code === TxResultCode.Success,
      pending: false, // Automatically set pending to false when result is set
    })),

  reset: () =>
    set(() => ({
      pending: false,
      result: null,
      isSuccess: false,
    })),
}));
