import { create } from "zustand";

interface ViewingKeyStoreState {
  viewingKeys: Record<string, string>; // Maps token address to viewing key
  setViewingKey: (address: string, key: string) => void;
  getViewingKey: (address: string) => string | undefined;
  removeAllViewingKeys: () => void;
}

export const useViewingKeyStore = create<ViewingKeyStoreState>((set, get) => ({
  viewingKeys: {},

  setViewingKey: (address, key) => {
    set((state) => ({
      viewingKeys: {
        ...state.viewingKeys,
        [address]: key,
      },
    }));
  },

  getViewingKey: (address) => {
    return get().viewingKeys[address];
  },

  removeAllViewingKeys: () => {
    set({ viewingKeys: {} });
  },
}));
