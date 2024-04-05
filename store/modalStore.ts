import { create } from "zustand";

interface ModalStoreState {
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
}

export const useModalStore = create<ModalStoreState>((set) => ({
  isWalletModalOpen: false,
  openWalletModal: () => set({ isWalletModalOpen: true }),
  closeWalletModal: () => set({ isWalletModalOpen: false }),
}));
