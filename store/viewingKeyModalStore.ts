import { ConfigToken, TOKENS } from '@/config/tokens';
import { showToastOnce } from '@/utils/toast/toastManager';
import { dismissViewingKeyToasts, startSmartMonitoring } from '@/utils/viewingKeys/smartDismissal';
import { create } from 'zustand';
import { useBalanceFetcherStore } from './balanceFetcherStore';

interface ViewingKeyModalState {
  isOpen: boolean;
  token: ConfigToken | null;
  context: 'error' | 'setup' | 'debug' | 'lp' | 'staking' | 'fallback';
  customSuccessCallback: (() => void) | undefined;

  // Actions
  open: (token: ConfigToken, context?: string, onSuccess?: () => void) => void;
  openByAddress: (tokenAddress: string, context?: string) => void;
  close: () => void;

  // Auto-wired handlers
  handleSuccess: () => void;
  handleError: (error: Error) => void;
}

export const useViewingKeyModalStore = create<ViewingKeyModalState>((set, get) => ({
  isOpen: false,
  token: null,
  context: 'setup',
  customSuccessCallback: undefined,

  open: (token: ConfigToken, context = 'setup', onSuccess?: () => void) => {
    set({
      isOpen: true,
      token,
      context: context as ViewingKeyModalState['context'],
      customSuccessCallback: onSuccess,
    });

    // Start smart monitoring for this token
    // This will help coordinate toast dismissal when key is fixed
    startSmartMonitoring(token.address);
  },

  openByAddress: (tokenAddress: string, context = 'setup') => {
    const token = TOKENS.find((t) => t.address === tokenAddress);
    if (token) {
      get().open(token, context);
    } else {
      console.warn('Token not found for address:', tokenAddress);
    }
  },

  close: () => {
    set({ isOpen: false, token: null, customSuccessCallback: undefined });
  },

  handleSuccess: () => {
    const { token, customSuccessCallback } = get();
    if (token) {
      // Dismiss all related error toasts immediately - this is the key fix!

      // Dismiss all related error toasts immediately
      dismissViewingKeyToasts(token.address);

      // Refresh balances automatically
      const balanceFetcher = useBalanceFetcherStore.getState();
      void balanceFetcher.fetchBalance(token.address, 'viewing-key-success');

      // Show success toast
      showToastOnce(`vk-success-${token.address}`, 'Viewing Key Created', 'success', {
        message: `✅ Successfully created viewing key for ${token.symbol}`,
        autoClose: 3000,
      });

      // Call custom success callback if provided
      if (customSuccessCallback) {
        customSuccessCallback();
      }
    }
    get().close();
  },

  handleError: (error: Error) => {
    console.error('Viewing key creation failed:', error);
    showToastOnce('vk-error', 'Key Creation Failed', 'error', {
      message: `❌ Failed to create viewing key: ${error.message}`,
      autoClose: 5000,
    });
  },
}));
