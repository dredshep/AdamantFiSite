import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ViewingKeyStore {
  viewingKeys: { [tokenAddress: string]: string };
  setViewingKey: (tokenAddress: string, viewingKey: string) => void;
  getViewingKey: (tokenAddress: string) => string | undefined;
}

export const useViewingKeyStore = create<ViewingKeyStore>()(
  persist(
    (set, get) => ({
      viewingKeys: {},
      setViewingKey: (tokenAddress: string, viewingKey: string) => {
        set((state) => ({
          viewingKeys: {
            ...state.viewingKeys,
            [tokenAddress]: viewingKey,
          },
        }));
      },
      getViewingKey: (tokenAddress: string) => {
        return get().viewingKeys[tokenAddress];
      },
    }),
    {
      name: "viewing-key-store",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
