import { LIQUIDITY_PAIRS, LP_TOKENS, TOKENS } from '@/config/tokens';
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
  syncFromGlobalStore: (tokenAddress: string, balance: string) => void;
}

export const DEFAULT_BALANCE_STATE: TokenBalanceState = {
  balance: '-', // "-" means unfetched, not zero balance
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
    console.log('🔄 balanceFetcherStore.addToQueue called:', { tokenAddress, caller, priority });
    const state = get();
    const currentBalance = state.balances[tokenAddress];
    console.log('🔄 Current balance state:', currentBalance);

    // FIRST: Check if service is globally rate limited
    if (TokenService.isCurrentlyRateLimited()) {
      const remainingTime = TokenService.getRemainingCooldownTime();
      console.log(
        `🚫 Skipping addToQueue for ${tokenAddress} - rate limited for ${remainingTime}s`
      );
      // Set error state to indicate rate limiting
      set((s) => ({
        balances: {
          ...s.balances,
          [tokenAddress]: {
            ...(s.balances[tokenAddress] || DEFAULT_BALANCE_STATE),
            loading: false,
            error: `Rate limited. Retry in ${remainingTime}s`,
          },
        },
      }));
      return;
    }

    // Skip if already loading or in queue
    if (currentBalance?.loading || state.queue.some((item) => item.tokenAddress === tokenAddress)) {
      console.log(`🔄 Skipping ${tokenAddress} - already loading or in queue`);
      return;
    }

    // Skip if balance is fresh and no error
    if (
      currentBalance?.lastUpdated &&
      Date.now() - currentBalance.lastUpdated < STALE_TIME_MS &&
      !currentBalance.error &&
      !currentBalance.needsViewingKey
    ) {
      console.log(
        `🔄 Skipping ${tokenAddress} - balance is fresh (${
          Date.now() - currentBalance.lastUpdated
        }ms old)`
      );
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

    // Check if TokenService is rate limited before attempting
    if (TokenService.isCurrentlyRateLimited()) {
      const remainingTime = TokenService.getRemainingCooldownTime();
      get().setError(tokenAddress, `Rate limited. Retry in ${remainingTime}s`);
      console.log(
        `🚫 Skipping balance fetch for ${tokenAddress} - rate limited for ${remainingTime}s`
      );
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
            // Get token symbol from config
            const token = TOKENS.find((t) => t.address === tokenAddress);
            toastManager.viewingKeyMismatch(token?.symbol, tokenAddress);
            break;
          case TokenServiceErrorType.LP_TOKEN_VIEWING_KEY_CORRUPTED:
            get().setNeedsViewingKey(tokenAddress, true);
            // Extract token symbol for better error message
            const lpPair = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === tokenAddress);
            const tokenSymbol = lpPair ? `${lpPair.token0}/${lpPair.token1}` : undefined;
            toastManager.lpTokenViewingKeyMismatch(tokenSymbol);
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

        // Check if this is a rate limit error from circuit breaker
        if (errorMessage.includes('Rate limited') || errorMessage.includes('rate limited')) {
          console.warn(`🚫 Rate limit error for ${tokenAddress}:`, errorMessage);
          // Show a consolidated toast for rate limiting (only once per minute)
          showToastOnce('rate-limit-global', 'API Rate Limited', 'warning', {
            message:
              'Reducing request frequency to prevent errors. Balances will load automatically when available.',
          });
        } else {
          toastManager.balanceFetchError();
        }
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
    // Note: It's okay if token is not in our config, any contract can be suggested.
    // We'll proceed as long as it's a valid address format.

    const keplr = (window as unknown as Window).keplr;
    if (!keplr) {
      const error = new Error('Keplr not found');
      toastManager.keplrNotInstalled();
      throw error;
    }

    // Get token info for better error messages
    const isLpToken = LIQUIDITY_PAIRS.some((pair) => pair.lpToken === tokenAddress);
    const lpPair = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === tokenAddress);
    const tokenSymbol = lpPair ? `${lpPair.token0}/${lpPair.token1} LP` : 'Token';

    try {
      // Step 1: Show initial toast
      showToastOnce(`suggest-token-start-${tokenAddress}`, 'Setting up viewing key...', 'info', {
        message: `Please approve the Keplr popup to set up viewing key for ${tokenSymbol}`,
        autoClose: 8000,
      });

      // Step 2: Ask Keplr to suggest the token (this pops up Keplr UI)
      await keplr.suggestToken('secret-4', tokenAddress);

      // Step 3: Give Keplr a moment to process the viewing key
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 4: Validate that the viewing key was actually created and works
      let viewingKey: string | null = null;
      let keyRetrievalError: string | null = null;
      try {
        viewingKey = await keplr.getSecret20ViewingKey('secret-4', tokenAddress);
      } catch (keyError) {
        console.warn('Failed to retrieve viewing key after suggestion:', keyError);
        keyRetrievalError = keyError instanceof Error ? keyError.message : String(keyError);
      }

      // Step 5: Validate the key by testing it with TokenService
      if (!viewingKey || viewingKey.length === 0) {
        const keyStatus = !viewingKey ? 'null/undefined' : 'empty';
        const errorSuffix = keyRetrievalError ? ` Retrieval error: ${keyRetrievalError}` : '';
        throw new Error(
          `Keplr did not create a valid viewing key for ${tokenSymbol}. The viewing key is ${keyStatus}.${errorSuffix}`
        );
      }

      // Step 6: Test the viewing key by attempting to fetch balance
      const token = getTokenInfo(tokenAddress);
      if (token) {
        try {
          const tokenService = new TokenService();
          await tokenService.getBalance(
            tokenAddress,
            token.codeHash,
            `suggestToken-validation:${Date.now()}`
          );

          // If we get here, the viewing key works
          showToastOnce(
            `suggest-token-success-${tokenAddress}`,
            'Viewing key created successfully!',
            'success',
            {
              message: `${tokenSymbol} viewing key is now active and working`,
              autoClose: 5000,
            }
          );

          // Clear any previous errors and refresh the balance
          get().setNeedsViewingKey(tokenAddress, false);
          get().clearError(tokenAddress);
          void get().fetchBalance(tokenAddress, `suggestToken-refresh:${Date.now()}`);
        } catch (validationError) {
          // The viewing key exists but doesn't work - this is the "false success" case
          console.error('Viewing key validation failed:', validationError);

          // Add inline truncate function for proper address handling
          const safeTruncateAddress = (address: string): string => {
            const startChars = 8;
            const endChars = 6;
            if (address.length <= startChars + endChars + 3) {
              return address;
            }
            return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
          };

          // Extract specific error details and handle TokenServiceError properly
          let errorDetails = 'Unknown validation error';

          if (validationError instanceof TokenServiceError) {
            // Handle TokenServiceError specifically to prevent unhandled errors
            errorDetails = validationError.message;
            console.log(
              `[TokenServiceError] Type: ${validationError.type}, Message: ${errorDetails}`
            );

            // For specific error types, use the existing error handling logic
            if (validationError.type === TokenServiceErrorType.LP_TOKEN_VIEWING_KEY_CORRUPTED) {
              get().setNeedsViewingKey(tokenAddress, true);
              get().setError(tokenAddress, 'LP Token Viewing Key Invalid');
              // Don't return, let it fall through to the detailed toast logic below
            } else if (validationError.type === TokenServiceErrorType.VIEWING_KEY_INVALID) {
              get().setNeedsViewingKey(tokenAddress, true);
              get().setError(tokenAddress, 'Viewing Key Invalid');
              // Don't return, let it fall through to the detailed toast logic below
            }
            // For other TokenServiceError types, continue with custom validation error handling below
          } else if (validationError instanceof Error) {
            errorDetails = validationError.message;
          } else if (typeof validationError === 'string') {
            errorDetails = validationError;
          }

          // Clean up the error message to remove duplicate address mention and fix formatting
          const cleanErrorDetails = errorDetails
            .replace(/for secret1[a-z0-9\.]+/g, '') // Remove "for secret1abc...xyz"
            .replace(/LP token viewing key is (corrupted|invalid)\s*/i, '') // Remove redundant prefix
            .replace(/:\s*$/, '') // Remove trailing colon
            .replace(/:\s+/g, ': ') // Fix double colons
            .replace(/\(called from:.*?\)/g, '') // Remove caller info
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

          const truncatedAddress = safeTruncateAddress(tokenAddress);

          if (isLpToken) {
            showToastOnce(
              `lp-key-validation-failed-${tokenAddress}`,
              'LP Token Viewing Key Failed',
              'error',
              {
                message: `${tokenSymbol} viewing key failed: ${cleanErrorDetails}. Token: ${truncatedAddress} (click to copy). Please go to Keplr wallet, find the LP token, and set a new viewing key.`,
                actionLabel: 'Copy Address',
                onAction: () => {
                  navigator.clipboard
                    .writeText(tokenAddress)
                    .then(() => {
                      showToastOnce(`copied-${tokenAddress}`, 'Address copied!', 'info', {
                        autoClose: 2000,
                      });
                    })
                    .catch(() => {
                      showToastOnce(
                        `copy-failed-${tokenAddress}`,
                        'Failed to copy address',
                        'error',
                        { autoClose: 3000 }
                      );
                    });
                },
                autoClose: false,
              }
            );
          } else {
            showToastOnce(`key-validation-failed-${tokenAddress}`, 'Viewing Key Failed', 'error', {
              message: `Token viewing key failed: ${cleanErrorDetails}. Token: ${truncatedAddress} (click to copy). Please go to Keplr wallet and set a new viewing key.`,
              actionLabel: 'Copy Address',
              onAction: () => {
                navigator.clipboard
                  .writeText(tokenAddress)
                  .then(() => {
                    showToastOnce(`copied-${tokenAddress}`, 'Address copied!', 'info', {
                      autoClose: 2000,
                    });
                  })
                  .catch(() => {
                    showToastOnce(
                      `copy-failed-${tokenAddress}`,
                      'Failed to copy address',
                      'error',
                      { autoClose: 3000 }
                    );
                  });
              },
              autoClose: false,
            });
          }

          // Update state and return early - don't throw to avoid duplicate toast in outer catch
          get().setError(tokenAddress, 'LP Token Viewing Key Validation Failed');
          return;
        }
      } else {
        // Token not in our config, assume success since we can't validate
        showToastOnce(
          `suggest-token-success-${tokenAddress}`,
          'Token suggested successfully',
          'success',
          {
            message: 'Please check if the viewing key is working properly',
            autoClose: 5000,
          }
        );
      }
    } catch (error) {
      console.error('suggestToken error:', error);

      // Extract detailed error information
      let errorDetails = 'Unknown error';
      let userFriendlyTitle = 'Failed to set up viewing key';
      let userFriendlyMessage = 'Please try again or manually set the viewing key in Keplr';

      if (error instanceof Error) {
        errorDetails = error.message;

        if (error.message.toLowerCase().includes('rejected')) {
          userFriendlyTitle = 'Token suggestion rejected';
          userFriendlyMessage =
            'You rejected the Keplr popup. Please try again and approve the request.';
        } else if (error.message.toLowerCase().includes('null/undefined')) {
          userFriendlyTitle = 'Keplr did not create viewing key';
          userFriendlyMessage = `Keplr failed to create a viewing key for ${tokenSymbol}. This might be because: 1) The token was already suggested, 2) Keplr is having issues, or 3) You need to manually add the token. Try refreshing the page or manually adding the token in Keplr.`;
        } else if (error.message.toLowerCase().includes('empty')) {
          userFriendlyTitle = 'Empty viewing key created';
          userFriendlyMessage = `Keplr created an empty viewing key for ${tokenSymbol}. Please go to Keplr, find the token, and manually set a viewing key.`;
        } else if (error.message.toLowerCase().includes('validation failed')) {
          // This case should no longer happen since validation errors now return early
          console.warn('Unexpected validation error in outer catch:', error);
          userFriendlyTitle = 'Viewing key validation failed';
          userFriendlyMessage = `The viewing key was created but doesn't work: ${errorDetails}. Please manually set a new viewing key in Keplr.`;
        } else if (error.message.toLowerCase().includes('invalid viewing key')) {
          // This case should no longer happen since validation errors now return early
          console.warn('Unexpected invalid viewing key error in outer catch:', error);
          userFriendlyTitle = 'Invalid viewing key';
          userFriendlyMessage = `The created viewing key is invalid: ${errorDetails}. Please manually set a new viewing key in Keplr.`;
        } else {
          userFriendlyTitle = `Failed to set up viewing key for ${tokenSymbol}`;
          userFriendlyMessage = `Error details: ${errorDetails}. Please try again or manually set the viewing key in Keplr.`;
        }
      }

      showToastOnce(`suggest-token-failed-${tokenAddress}`, userFriendlyTitle, 'error', {
        message: userFriendlyMessage,
        autoClose: false, // Keep error messages visible until user dismisses
      });

      // Update the state to reflect the error and re-throw to notify the caller.
      get().setError(tokenAddress, userFriendlyTitle);
      // IMPORTANT: Do not re-throw the error here as it causes unhandled promise rejection.
      // The UI is notified via toast and state update.
      // throw error;
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

    // Check if service is rate limited before processing
    if (TokenService.isCurrentlyRateLimited()) {
      const remainingTime = TokenService.getRemainingCooldownTime();
      console.log(`🚫 Queue processing paused - rate limited for ${remainingTime}s`);
      // Schedule retry after cooldown
      setTimeout(() => {
        void get().processQueue();
      }, remainingTime * 1000);
      return;
    }

    set({ isProcessingQueue: true });

    try {
      while (get().queue.length > 0) {
        const queueItem = get().queue[0];
        if (!queueItem) break;

        // Check rate limit before each request
        if (TokenService.isCurrentlyRateLimited()) {
          console.log(`🚫 Stopping queue processing - rate limited during batch`);
          break;
        }

        get().removeFromQueue(queueItem.tokenAddress);

        await get().fetchBalance(queueItem.tokenAddress, queueItem.caller);

        if (get().queue.length > 0) {
          // Increase delay to be more conservative with rate limits
          await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS * 3)); // 300ms instead of 100ms
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

  syncFromGlobalStore: (tokenAddress: string, balance: string) => {
    // Only update if we don't have fresher data
    const state = get();
    const currentBalance = state.balances[tokenAddress];

    // Don't overwrite if we have recent data or are currently loading
    if (
      currentBalance?.loading ||
      (currentBalance?.lastUpdated && Date.now() - currentBalance.lastUpdated < STALE_TIME_MS)
    ) {
      return;
    }

    set((s) => ({
      balances: {
        ...s.balances,
        [tokenAddress]: {
          balance,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
          needsViewingKey: false,
        },
      },
    }));
  },
}));

// Auto-fetch balances when wallet connects (limited to essential tokens only)
let lastWalletAddress: string | null = null;

useWalletStore.subscribe((state) => {
  const currentAddress = state.address;

  // If wallet just connected (address changed from null to something)
  if (lastWalletAddress === null && currentAddress !== null) {
    console.log('Wallet connected, starting conservative auto-fetch of essential balances only');

    // Only fetch the most essential tokens to reduce RPC load
    const essentialTokens = [
      'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek', // sSCRT (native token)
    ];

    // Check if service is rate limited before auto-fetching
    if (!TokenService.isCurrentlyRateLimited()) {
      useBalanceFetcherStore
        .getState()
        .fetchPriorityBalances(essentialTokens, 'wallet-connect-essential');
    } else {
      console.log('🚫 Skipping auto-fetch on wallet connect - service is rate limited');
    }

    // Remove aggressive auto-fetch of all balances - let components fetch as needed
    // setTimeout(() => {
    //   useBalanceFetcherStore.getState().fetchAllBalances();
    // }, 1000);
  }

  // If wallet disconnected
  if (lastWalletAddress !== null && currentAddress === null) {
    console.log('Wallet disconnected, clearing balance states');
    // Clear all balance states
    useBalanceFetcherStore.setState({ balances: {}, queue: [] });
  }

  lastWalletAddress = currentAddress;
});
