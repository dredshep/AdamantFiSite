import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ViewingKeyStore {
  viewingKeys: { [tokenAddress: string]: string };
  setViewingKey: (tokenAddress: string, viewingKey: string) => void;
  getViewingKey: (tokenAddress: string) => string | undefined;
  removeViewingKey: (tokenAddress: string) => void;
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
      removeViewingKey: (tokenAddress: string) => {
        set((state) => {
          const { [tokenAddress]: _, ...remainingKeys } = state.viewingKeys;
          return {
            viewingKeys: remainingKeys,
          };
        });
      },
    }),
    {
      name: 'viewing-key-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
