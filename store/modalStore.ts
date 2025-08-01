import { create } from 'zustand';

interface SendTokensDialogState {
  isOpen: boolean;
  prefillData?: {
    amount?: string;
    tokenAddress?: string;
    recipientAddress?: string;
  };
}

interface ModalStoreState {
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  sendTokensDialog: SendTokensDialogState;
  openSendTokensDialog: (prefillData?: SendTokensDialogState['prefillData']) => void;
  closeSendTokensDialog: () => void;
}

export const useModalStore = create<ModalStoreState>((set) => ({
  isWalletModalOpen: false,
  openWalletModal: () => set(() => ({ isWalletModalOpen: true })),
  closeWalletModal: () => set(() => ({ isWalletModalOpen: false })),
  sendTokensDialog: { isOpen: false },
  openSendTokensDialog: (prefillData) =>
    set(() => ({
      sendTokensDialog: { isOpen: true, ...(prefillData && { prefillData }) },
    })),
  closeSendTokensDialog: () =>
    set(() => ({
      sendTokensDialog: { isOpen: false },
    })),
}));
