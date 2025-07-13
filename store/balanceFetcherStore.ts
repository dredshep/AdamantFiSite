import { LP_TOKENS, TOKENS } from '@/config/tokens';
import {
  TokenService,
  TokenServiceError,
  TokenServiceErrorType,
} from '@/services/secret/TokenService';
import { showToastOnce, toastManager } from '@/utils/toast/toastManager';
import { create } from 'zustand';
import { useWalletStore } from './walletStore';

interface TokenBalanceState {
  balance: string; // "-" for unfetched, "0" for actual zero balance, actual balance otherwise
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  needsViewingKey: boolean; // true if viewing key is required but not set
}

interface BalanceQueueItem {
  tokenAddress: string;
  caller: string;
  priority?: 'high' | 'normal' | 'low';
}

interface BalanceFetcherState {
  balances: Record<string, TokenBalanceState>;
  isProcessingQueue: boolean;
  queue: BalanceQueueItem[];

  // Actions
  addToQueue: (tokenAddress: string, caller: string, priority?: 'high' | 'normal' | 'low') => void;
  addToQueueWithPriority: (
    tokenAddress: string,
    caller: string,
    priority: 'high' | 'normal' | 'low'
  ) => void;
  removeFromQueue: (tokenAddress: string) => void;
  fetchBalance: (tokenAddress: string, caller: string) => Promise<void>;
  fetchAllBalances: () => void;
  fetchPriorityBalances: (tokenAddresses: string[], caller: string) => void;
  getBalanceState: (tokenAddress: string) => TokenBalanceState;
  clearError: (tokenAddress: string) => void;
  setBalance: (tokenAddress: string, balance: string) => void;
  setLoading: (tokenAddress: string, loading: boolean) => void;
  setError: (tokenAddress: string, error: string) => void;
  setNeedsViewingKey: (tokenAddress: string, needsViewingKey: boolean) => void;
  retryWithViewingKey: (tokenAddress: string) => Promise<void>;
  suggestToken: (tokenAddress: string) => Promise<void>;
  processQueue: () => Promise<void>;
}

export const DEFAULT_BALANCE_STATE: TokenBalanceState = {
  balance: '0',
  loading: false,
  error: null,
  lastUpdated: 0,
  needsViewingKey: false,
};

const FETCH_DELAY_MS = 100; // 100ms between requests to avoid 429
const STALE_TIME_MS = 30000; // 30 seconds before considering balance stale

// Helper function to get token info (regular tokens or LP tokens)
function getTokenInfo(tokenAddress: string) {
  // First check regular tokens
  const regularToken = TOKENS.find((token) => token.address === tokenAddress);
  if (regularToken) return regularToken;

  // Then check LP tokens
  const lpToken = LP_TOKENS.find((token) => token.address === tokenAddress);
  if (lpToken) return lpToken;

  return null;
}

// Helper function to check if token is an LP token
// function isLpToken(tokenAddress: string): boolean {
//   return LIQUIDITY_PAIRS.some((pair) => pair.lpToken === tokenAddress);
// }

export const useBalanceFetcherStore = create<BalanceFetcherState>((set, get) => ({
  balances: {},
  isProcessingQueue: false,
  queue: [],

  addToQueue: (
    tokenAddress: string,
    caller: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    const state = get();
    const currentBalance = state.balances[tokenAddress];

    // Skip if already loading or in queue
    if (currentBalance?.loading || state.queue.some((item) => item.tokenAddress === tokenAddress)) {
      return;
    }

    // Skip if balance is fresh and no error
    if (
      currentBalance?.lastUpdated &&
      Date.now() - currentBalance.lastUpdated < STALE_TIME_MS &&
      !currentBalance.error &&
      !currentBalance.needsViewingKey
    ) {
      return;
    }

    // --- NEW: Set loading state immediately and clear old errors ---
    // This ensures the UI shows 'loading' right away and prevents stale error flashes.
    set((s) => ({
      balances: {
        ...s.balances,
        [tokenAddress]: {
          ...(s.balances[tokenAddress] || DEFAULT_BALANCE_STATE),
          loading: true,
          error: null, // Clear previous errors
        },
      },
    }));

    const newItem: BalanceQueueItem = { tokenAddress, caller, priority };

    set((s) => {
      const newQueue = [...s.queue, newItem];
      // Sort queue by priority: high > normal > low
      newQueue.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal'];
      });
      return { queue: newQueue };
    });

    if (!state.isProcessingQueue) {
      // Process queue with proper error handling
      get()
        .processQueue()
        .catch((error) => {
          console.error('Error in processQueue:', error);
          // Reset processing state if there's an error
          set({ isProcessingQueue: false });
        });
    }
  },

  addToQueueWithPriority: (
    tokenAddress: string,
    caller: string,
    priority: 'high' | 'normal' | 'low'
  ) => {
    get().addToQueue(tokenAddress, caller, priority);
  },

  removeFromQueue: (tokenAddress: string) => {
    set((state) => ({
      queue: state.queue.filter((item) => item.tokenAddress !== tokenAddress),
    }));
  },

  fetchBalance: async (tokenAddress: string, caller: string) => {
    const traceId = `trace-bf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const walletAddress = useWalletStore.getState().address;
    if (!walletAddress) {
      get().setError(tokenAddress, 'Wallet not connected');
      return;
    }

    const token = getTokenInfo(tokenAddress);
    if (!token) {
      get().setError(tokenAddress, 'Token not found');
      return;
    }

    get().setLoading(tokenAddress, true);
    get().clearError(tokenAddress);

    const tokenService = new TokenService();

    try {
      const rawBalance = await tokenService.getBalance(
        tokenAddress,
        token.codeHash,
        caller,
        traceId
      );
      const decimals = token.decimals;
      const humanBalance = (Number(rawBalance) / Math.pow(10, decimals)).toString();
      get().setBalance(tokenAddress, humanBalance);
    } catch (error: unknown) {
      console.log(`[${traceId}] Entering fetchBalance catch block for ${caller}.`);
      console.log(`[${traceId}] Error type:`, typeof error);
      console.log(
        `[${traceId}] Error instanceof TokenServiceError:`,
        error instanceof TokenServiceError
      );
      console.log(`[${traceId}] Error details:`, error);

      // Check if it's a TokenServiceError using instanceof
      if (error instanceof TokenServiceError) {
        const tokenError = error;
        const errorMessage = `${tokenError.message} (from: ${tokenError.caller || 'unknown'})`;
        get().setError(tokenAddress, errorMessage);

        switch (tokenError.type) {
          case TokenServiceErrorType.VIEWING_KEY_REQUIRED:
            get().setNeedsViewingKey(tokenAddress, true);
            toastManager.viewingKeyRequired();
            break;
          case TokenServiceErrorType.VIEWING_KEY_REJECTED:
            get().setNeedsViewingKey(tokenAddress, true);
            toastManager.viewingKeyRejected(() => void get().retryWithViewingKey(tokenAddress));
            break;
          case TokenServiceErrorType.VIEWING_KEY_INVALID:
            get().setNeedsViewingKey(tokenAddress, true);
            break;
          case TokenServiceErrorType.NETWORK_ERROR:
            toastManager.networkError();
            break;
        }
      } else if (error instanceof Error && error.message.toLowerCase().includes('viewing key')) {
        get().setNeedsViewingKey(tokenAddress, true);
        get().setError(tokenAddress, 'Set viewing key in Keplr');
        toastManager.viewingKeyRequired();
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        get().setError(tokenAddress, errorMessage);
        toastManager.balanceFetchError();
      }
    } finally {
      get().setLoading(tokenAddress, false);
    }
  },

  fetchAllBalances: () => {
    // Fetch all regular tokens
    TOKENS.forEach((token) => {
      get().addToQueue(token.address, `fetchAllBalances:${token.symbol}`, 'low');
    });

    // Fetch all LP tokens
    LP_TOKENS.forEach((token) => {
      get().addToQueue(token.address, `fetchAllBalances:LP:${token.symbol}`, 'low');
    });
  },

  fetchPriorityBalances: (tokenAddresses: string[], caller: string) => {
    tokenAddresses.forEach((tokenAddress) => {
      get().addToQueue(tokenAddress, caller, 'high');
    });
  },

  getBalanceState: (tokenAddress: string) => {
    return get().balances[tokenAddress] ?? DEFAULT_BALANCE_STATE;
  },

  clearError: (tokenAddress: string) => {
    set((state) => ({
      balances: {
        ...state.balances,
        [tokenAddress]: {
          ...(state.balances[tokenAddress] ?? DEFAULT_BALANCE_STATE),
          error: null,
        },
      },
    }));
  },

  setBalance: (tokenAddress: string, balance: string) => {
    set((state) => ({
      balances: {
        ...state.balances,
        [tokenAddress]: {
          ...(state.balances[tokenAddress] ?? DEFAULT_BALANCE_STATE),
          balance,
          lastUpdated: Date.now(),
          loading: false,
          error: null,
          needsViewingKey: false, // Clear viewing key flag on successful fetch
        },
      },
    }));
  },

  setLoading: (tokenAddress: string, loading: boolean) => {
    set((state) => ({
      balances: {
        ...state.balances,
        [tokenAddress]: {
          ...(state.balances[tokenAddress] ?? DEFAULT_BALANCE_STATE),
          loading,
        },
      },
    }));
  },

  setError: (tokenAddress: string, error: string) => {
    set((state) => ({
      balances: {
        ...state.balances,
        [tokenAddress]: {
          ...(state.balances[tokenAddress] ?? DEFAULT_BALANCE_STATE),
          error,
          loading: false,
          lastUpdated: Date.now(),
        },
      },
    }));
  },

  setNeedsViewingKey: (tokenAddress: string, needsViewingKey: boolean) => {
    set((state) => ({
      balances: {
        ...state.balances,
        [tokenAddress]: {
          ...(state.balances[tokenAddress] ?? DEFAULT_BALANCE_STATE),
          needsViewingKey,
        },
      },
    }));
  },

  suggestToken: async (tokenAddress: string) => {
    const token = getTokenInfo(tokenAddress);
    if (!token) {
      get().setError(tokenAddress, 'Token not found');
      return;
    }

    try {
      const keplr = (window as unknown as Window).keplr;
      if (!keplr) {
        get().setError(tokenAddress, 'Keplr not found');
        toastManager.keplrNotInstalled();
        return;
      }

      const tokenService = new TokenService();
      await tokenService.suggestToken(tokenAddress, 'balanceFetcherStore.suggestToken');

      // --- NEW: Verification Step ---
      // After suggesting, immediately try to fetch the balance to verify the new key.
      try {
        // Clear previous error states before attempting the fetch.
        get().setNeedsViewingKey(tokenAddress, false);
        get().clearError(tokenAddress);

        // This fetch will use the newly suggested key.
        void get().fetchBalance(tokenAddress, `suggestToken:verify:${Date.now()}`);

        // --- NEW: Robust Check ---
        // After fetching, get the new state and check if the balance is valid.
        const newState = get().balances[tokenAddress];
        const hasValidBalance =
          newState && newState.balance !== '-' && !isNaN(parseFloat(newState.balance));

        if (!hasValidBalance) {
          // The fetch "succeeded" but didn't result in a valid balance.
          // This is the "zombie key" scenario.
          const errorMessage =
            'Key is corrupted in Keplr. Please open Keplr, scroll down to the token list, find this token, and click "Set your viewing key".';
          get().setError(tokenAddress, errorMessage);
          // Show a persistent error toast that does not auto-close.
          showToastOnce('token-key-invalid', errorMessage, 'error', { autoClose: false });
        }
        // No "success" toast here, as a successful fetch is its own reward.
      } catch (e) {
        // If fetchBalance throws, especially an INVALID_VIEWING_KEY error, we catch it here.
        if (
          e instanceof TokenServiceError &&
          e.type === TokenServiceErrorType.VIEWING_KEY_INVALID
        ) {
          // This is also the "zombie key" scenario.
          const errorMessage =
            'Key is corrupted in Keplr. Please open Keplr, scroll down to the token list, find this token, and click "Set your viewing key".';
          get().setError(tokenAddress, errorMessage);
          // Show a persistent error toast that does not auto-close.
          showToastOnce('token-key-invalid', errorMessage, 'error', { autoClose: false });
        } else {
          // Handle other potential errors during verification fetch.
          const errorMessage =
            e instanceof Error ? e.message : 'An unknown error occurred during verification.';
          get().setError(tokenAddress, errorMessage);
          showToastOnce('token-verification-failed', errorMessage, 'error');
        }
      }
      // --- END Verification Step ---
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        get().setError(tokenAddress, 'Token suggestion rejected');
        showToastOnce('token-suggestion-rejected', 'Token suggestion was rejected', 'error');
      } else {
        get().setError(tokenAddress, 'Failed to suggest token');
        showToastOnce('token-suggestion-failed', 'Failed to suggest token to Keplr', 'error');
      }
    }
  },

  retryWithViewingKey: async (tokenAddress: string) => {
    const token = getTokenInfo(tokenAddress);
    if (!token) {
      get().setError(tokenAddress, 'Token not found');
      return;
    }

    // Clear the viewing key flag and error before retrying
    get().setNeedsViewingKey(tokenAddress, false);
    get().clearError(tokenAddress);

    // Try to fetch the balance again - this will trigger the viewing key setup in TokenService
    await get().fetchBalance(
      tokenAddress,
      `retryWithViewingKey:${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    );
  },

  // Internal queue processing function
  processQueue: async () => {
    const state = get();
    if (state.isProcessingQueue || state.queue.length === 0) {
      return;
    }

    set({ isProcessingQueue: true });

    try {
      while (get().queue.length > 0) {
        const queueItem = get().queue[0];
        if (!queueItem) break;

        get().removeFromQueue(queueItem.tokenAddress);

        await get().fetchBalance(queueItem.tokenAddress, queueItem.caller);

        if (get().queue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS));
        }
      }
    } catch (error) {
      console.error(
        'A critical error occurred in the balance processing queue. This should not happen, but we have caught it to prevent a crash.',
        error
      );
    } finally {
      set({ isProcessingQueue: false });
    }
  },
}));

// Auto-fetch balances when wallet connects
let lastWalletAddress: string | null = null;

useWalletStore.subscribe((state) => {
  const currentAddress = state.address;

  // If wallet just connected (address changed from null to something)
  if (lastWalletAddress === null && currentAddress !== null) {
    console.log('Wallet connected, starting auto-fetch of balances');
    // Fetch priority tokens first (commonly used tokens)
    const priorityTokens = [
      'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek', // sSCRT
      'secret1chsejpk9kfj4vt9ec6xvyguw539gsdtr775us2', // USDC
      'secret1fl449muk5yq8dlad7a22nje4p5d2pnsgymhjfd', // USDT
    ];

    useBalanceFetcherStore
      .getState()
      .fetchPriorityBalances(priorityTokens, 'wallet-connect-priority');

    // Then fetch all other balances with lower priority
    setTimeout(() => {
      useBalanceFetcherStore.getState().fetchAllBalances();
    }, 1000);
  }

  // If wallet disconnected
  if (lastWalletAddress !== null && currentAddress === null) {
    console.log('Wallet disconnected, clearing balance states');
    // Clear all balance states
    useBalanceFetcherStore.setState({ balances: {}, queue: [] });
  }

  lastWalletAddress = currentAddress;
});
