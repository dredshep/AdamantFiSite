import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { useViewingKeyModalStore } from '@/store/viewingKeyModalStore';

// Toast ID references to prevent duplicates
export const GLOBAL_TOAST_IDS = {
  KEPLR_NOT_INSTALLED: 'global-keplr-not-installed',
  VIEWING_KEY_REQUIRED: 'global-viewing-key-required',
  VIEWING_KEY_REJECTED: 'global-viewing-key-rejected',
  VIEWING_KEY_CORRUPTED: 'global-viewing-key-corrupted',
  LP_TOKEN_VIEWING_KEY_CORRUPTED: 'global-lp-token-viewing-key-corrupted',
  VIEWING_KEY_ERRORS_AGGREGATE: 'global-viewing-key-errors-aggregate',
  NETWORK_ERROR: 'global-network-error',
  BALANCE_FETCH_ERROR: 'global-balance-fetch-error',
  CONNECTION_ERROR: 'global-connection-error',
} as const;

// Global state to track toasts
interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  autoClose?: number | false;
  createdAt: number;
}

interface ToastState {
  toasts: ToastItem[];
  shownToasts: Set<string>;
  lastShownTime: Map<string, number>;
}

const globalToastState: ToastState = {
  toasts: [],
  shownToasts: new Set(),
  lastShownTime: new Map(),
};

// Minimum time between showing the same toast (in milliseconds)
const TOAST_COOLDOWN = 10000; // 10 seconds

// Viewing Key Error Aggregation System
interface ViewingKeyError {
  tokenAddress: string; // MANDATORY - we must know which token has the problem
  tokenSymbol: string | undefined;
  errorType: 'invalid' | 'corrupted' | 'required' | 'rejected' | 'failed';
  isLpToken: boolean;
  timestamp: number;
  onSyncKey?: () => void; // Optional sync callback for staking contracts
}

class ViewingKeyErrorAggregator {
  private errorBuffer: Map<string, ViewingKeyError> = new Map();
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 500; // Wait 500ms for more errors
  private sessionShown = new Set<string>();

  addError(error: ViewingKeyError) {
    console.log('🔄 ViewingKeyErrorAggregator.addError:', error);

    // Viewing key error toasts are disabled - users now have inline buttons to create keys
    console.log('🔇 Viewing key error toasts disabled - returning early');
    return;
  }

  private flushErrors() {
    const errors = Array.from(this.errorBuffer.values());
    console.log('🔄 ViewingKeyErrorAggregator.flushErrors:', errors);

    if (errors.length === 0) return;

    // Create signature for session suppression
    const errorSignature = errors
      .map((e) => e.tokenAddress)
      .sort()
      .join(',');

    if (this.sessionShown.has(errorSignature)) {
      console.log('🔄 Skipping aggregate toast - already shown this session:', errorSignature);
      this.errorBuffer.clear();
      return;
    }

    this.sessionShown.add(errorSignature);

    // Always show aggregate toast to prevent spam, even for single errors
    this.showAggregateError(errors);

    this.errorBuffer.clear();
  }

  // Removed showIndividualError method since we always use aggregate now

  private showAggregateError(errors: ViewingKeyError[]) {
    const tokenCount = errors.length;

    console.log('🔄 Showing aggregate toast for errors:', { tokenCount });

    // Always show table format for consistency
    this.showTokenAddressTable(errors);
  }

  private showTokenAddressTable(errors: ViewingKeyError[]) {
    const tokenCount = errors.length;

    // Check if this is a staking contract error - only if explicitly marked as such
    const hasStakingContractError = errors.some(
      (error) => error.tokenSymbol === 'Staking Contract'
    );

    const title =
      tokenCount === 1
        ? `${errors[0]?.tokenSymbol ?? 'Token'} Viewing Key Error`
        : `${tokenCount} Tokens Need Viewing Keys`;

    // Create different messaging for staking contracts vs regular tokens
    const createFormattedList = () => {
      if (hasStakingContractError && tokenCount === 1) {
        const stakingError = errors.find((error) => error.tokenSymbol === 'Staking Contract');
        const contractAddress = stakingError?.tokenAddress || 'unknown';
        const truncatedAddr =
          contractAddress !== 'unknown'
            ? `${contractAddress.slice(0, 12)}...${contractAddress.slice(-8)}`
            : 'unknown';

        // Concise messaging for staking contract errors
        return `Staking contract viewing key missing.

Contract: ${truncatedAddr}

Your LP token viewing key will be copied to the staking contract when you click "Sync Key".`;
      }

      // Create different messaging based on error type
      const hasInvalidKeys = errors.some((error) => error.errorType === 'invalid');
      const hasRequiredKeys = errors.some((error) => error.errorType === 'required');
      const hasMixedTypes = hasInvalidKeys && hasRequiredKeys;

      let message = '';

      if (tokenCount === 1) {
        const error = errors[0];
        if (error?.errorType === 'invalid') {
          message = 'The viewing key for this token is incorrect:\n\n';
        } else if (error?.errorType === 'required') {
          message = 'This token requires a viewing key:\n\n';
        } else {
          message = 'The viewing key for this token needs attention:\n\n';
        }
      } else {
        message = hasMixedTypes
          ? 'These tokens have viewing key issues:\n\n'
          : hasInvalidKeys
          ? 'These tokens have incorrect viewing keys:\n\n'
          : 'These tokens require viewing keys:\n\n';
      }

      errors.forEach((error, index) => {
        const symbol = error.tokenSymbol ?? 'Unknown';
        const truncatedAddr = error.tokenAddress
          ? `${error.tokenAddress.slice(0, 12)}...${error.tokenAddress.slice(-8)}`
          : 'Unknown address';

        message += `${index + 1}. ${symbol}\n   ${truncatedAddr}\n\n`;
      });

      if (!hasStakingContractError) {
        const buttonText =
          tokenCount === 1 ? `"Fix ${errors[0]?.tokenSymbol ?? 'Token'} Key"` : `"Fix Next Key"`;
        message += `Click ${buttonText} to create viewing keys automatically.\n`;

        if (hasMixedTypes) {
          message += 'Fix automatically or use custom keys with dual setup.\n';
          message += 'Quick one-click solution available.';
        } else if (hasInvalidKeys) {
          message += 'Fix automatically or use custom keys with dual setup.';
        } else {
          message += 'Fix automatically or use custom keys with dual setup.';
        }
      }

      return message;
    };

    let currentIndex = 0;

    const showCopyInterface = () => {
      const currentError = errors[currentIndex];

      // For staking contract errors, show sync functionality
      if (hasStakingContractError && tokenCount === 1) {
        const stakingError = errors.find((error) => error.tokenSymbol === 'Staking Contract');

        showToastOnce(GLOBAL_TOAST_IDS.VIEWING_KEY_ERRORS_AGGREGATE, title, 'error', {
          message: createFormattedList(),
          actionLabel: stakingError?.onSyncKey ? 'Sync Key' : 'Got it',
          onAction: () => {
            if (stakingError?.onSyncKey) {
              stakingError.onSyncKey();
            }
            // Toast will auto-close after sync action
          },
          autoClose: false,
        });
        return;
      }

      // Dual setup interface for regular tokens
      showToastOnce(GLOBAL_TOAST_IDS.VIEWING_KEY_ERRORS_AGGREGATE, title, 'error', {
        message: createFormattedList(),
        actionLabel: currentError
          ? tokenCount === 1
            ? `Fix ${currentError.tokenSymbol ?? 'Token'} Key`
            : `Fix ${currentError.tokenSymbol ?? 'Next'} Key (${currentIndex + 1}/${tokenCount})`
          : 'All Done',
        onAction: () => {
          if (currentError?.tokenAddress) {
            console.log('🔍 Fix button clicked for token:', {
              tokenAddress: currentError.tokenAddress,
              tokenSymbol: currentError.tokenSymbol,
              errorType: currentError.errorType,
            });

            // Find token and open dual setup modal
            const token = TOKENS.find((t) => t.address === currentError.tokenAddress);
            console.log('🔍 Token lookup result:', { found: !!token, token });

            if (token) {
              console.log('✅ Opening ViewingKey modal for token:', token.symbol);
              useViewingKeyModalStore.getState().open(token, 'aggregate-error');

              // Move to next error after opening modal
              currentIndex++;

              // Continue to next if there are more
              setTimeout(() => {
                if (currentIndex < errors.length) {
                  showCopyInterface();
                } else {
                  showToastOnce('viewing-keys-handled', 'All keys processed!', 'success', {
                    message: `Opened dual setup for all ${tokenCount} tokens. Create keys automatically or use custom keys.`,
                    autoClose: 5000,
                  });
                }
              }, 500);
            } else {
              console.error('❌ Token not found in TOKENS array:', {
                searchingFor: currentError.tokenAddress,
                availableTokens: TOKENS.map((t) => ({ symbol: t.symbol, address: t.address })),
              });

              // Instead of copying, let's try to use the address to find the token differently
              // First check if this might be an LP token
              const lpPair = LIQUIDITY_PAIRS?.find(
                (pair) => pair.lpToken === currentError.tokenAddress
              );
              if (lpPair) {
                console.log('🔍 Found LP token, creating temporary config:', lpPair);
                const tempLpToken = {
                  name: `${lpPair.token0}/${lpPair.token1} LP Token`,
                  symbol: currentError.tokenSymbol || `${lpPair.token0}/${lpPair.token1}`,
                  address: currentError.tokenAddress as `secret1${string}`,
                  codeHash: lpPair.lpTokenCodeHash,
                  decimals: 6,
                };
                console.log('✅ Opening ViewingKey modal for LP token:', tempLpToken.symbol);
                useViewingKeyModalStore.getState().open(tempLpToken, 'aggregate-error');
                currentIndex++;
                return;
              }

              // Still fallback to copy if absolutely nothing works
              console.warn('⚠️ Falling back to copy address behavior');
              void navigator.clipboard.writeText(currentError.tokenAddress);
              showToastOnce(`token-not-found-${currentIndex}`, 'Token not found', 'warning', {
                message: `Address copied: ${currentError.tokenAddress}. Please manually add to Keplr.`,
                autoClose: 3000,
              });
              currentIndex++;
            }
          } else {
            console.error('❌ No token address available for Fix action');
            return;
          }
        },
        autoClose: false,
      });
    };

    showCopyInterface();
  }

  // Method to clear session data on wallet disconnect
  clearSession() {
    this.sessionShown.clear();
    this.errorBuffer.clear();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// Global instance
const viewingKeyErrorAggregator = new ViewingKeyErrorAggregator();

// Event system for toast management
type ToastListener = (toasts: ToastItem[]) => void;
const toastListeners = new Set<ToastListener>();

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...globalToastState.toasts]));
}

export function subscribeToToasts(listener: ToastListener): () => void {
  toastListeners.add(listener);
  // Immediately call with current state
  listener([...globalToastState.toasts]);

  return () => {
    toastListeners.delete(listener);
  };
}

export function removeToast(id: string): void {
  const index = globalToastState.toasts.findIndex((toast) => toast.id === id);
  if (index !== -1) {
    globalToastState.toasts.splice(index, 1);
    notifyListeners();
  }
}

/**
 * Show a toast only once or after a cooldown period to prevent spam
 */
export function showToastOnce(
  toastId: string,
  title: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'error',
  options?: {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    autoClose?: number | false;
  }
): void {
  const now = Date.now();
  const lastShown = globalToastState.lastShownTime.get(toastId);

  // Check if toast was shown recently
  if (lastShown && now - lastShown < TOAST_COOLDOWN) {
    return;
  }

  // Remove any existing toast with this ID
  removeToast(toastId);

  // Create new toast
  const newToast: ToastItem = {
    id: toastId,
    type,
    title,
    ...(options?.message && { message: options.message }),
    ...(options?.actionLabel && { actionLabel: options.actionLabel }),
    ...(options?.onAction && { onAction: options.onAction }),
    autoClose: options?.autoClose !== undefined ? options.autoClose : 6000,
    createdAt: now,
  };

  // Add to toasts array
  globalToastState.toasts.push(newToast);

  // Update tracking
  globalToastState.shownToasts.add(toastId);
  globalToastState.lastShownTime.set(toastId, now);

  // Notify listeners
  notifyListeners();

  // Set up auto-remove if autoClose is enabled
  if (newToast.autoClose !== false && typeof newToast.autoClose === 'number') {
    setTimeout(() => {
      removeToast(toastId);
    }, newToast.autoClose);
  }
}

/**
 * Clear the tracking for a specific toast, allowing it to be shown again immediately
 */
export function resetToastCooldown(toastId: string): void {
  globalToastState.shownToasts.delete(toastId);
  globalToastState.lastShownTime.delete(toastId);
}

/**
 * Clear all toast tracking, allowing all toasts to be shown again
 */
export function resetAllToastCooldowns(): void {
  globalToastState.shownToasts.clear();
  globalToastState.lastShownTime.clear();
}

/**
 * Export the aggregator for use in other modules
 */
export { viewingKeyErrorAggregator };

/**
 * Predefined toast functions for common scenarios
 */
export const toastManager = {
  keplrNotInstalled: () =>
    showToastOnce(GLOBAL_TOAST_IDS.KEPLR_NOT_INSTALLED, 'Please install Keplr extension', 'error', {
      message: 'Keplr wallet extension is required to use this application.',
      actionLabel: 'Install Keplr',
      onAction: () => window.open('https://www.keplr.app/download', '_blank'),
      autoClose: false,
    }),

  viewingKeyRequired: (tokenAddress?: string, tokenSymbol?: string) => {
    // Use aggregation system instead of individual toasts
    viewingKeyErrorAggregator.addError({
      tokenAddress: tokenAddress || 'unknown',
      tokenSymbol,
      errorType: 'required',
      isLpToken: false,
      timestamp: Date.now(),
    });
  },

  viewingKeyRejected: (onRetry?: () => void) => {
    const options = {
      message: 'You rejected the viewing key request. Click to try again.',
      autoClose: false as const,
      ...(onRetry && {
        actionLabel: 'Try Again',
        onAction: onRetry,
      }),
    };

    return showToastOnce(
      GLOBAL_TOAST_IDS.VIEWING_KEY_REJECTED,
      'Viewing key request rejected',
      'info',
      options
    );
  },

  networkError: () =>
    showToastOnce(GLOBAL_TOAST_IDS.NETWORK_ERROR, 'Network error', 'error', {
      message: 'Please check your internet connection and try again.',
    }),

  balanceFetchError: () =>
    showToastOnce(GLOBAL_TOAST_IDS.BALANCE_FETCH_ERROR, 'Unable to fetch balance', 'warning', {
      message: 'There was an issue fetching your token balance. Please try again later.',
    }),

  connectionError: () =>
    showToastOnce(GLOBAL_TOAST_IDS.CONNECTION_ERROR, 'Connection error', 'error', {
      message: 'Failed to connect to the service. Please refresh the page and try again.',
    }),

  viewingKeyMismatch: (tokenSymbol?: string, tokenAddress?: string) => {
    // Use aggregation system instead of individual toasts
    viewingKeyErrorAggregator.addError({
      tokenAddress: tokenAddress || 'unknown',
      tokenSymbol,
      errorType: 'invalid',
      isLpToken: false,
      timestamp: Date.now(),
    });
  },

  lpTokenViewingKeyMismatch: (tokenSymbol?: string, tokenAddress?: string) => {
    // Use aggregation system instead of individual toasts
    viewingKeyErrorAggregator.addError({
      tokenAddress: tokenAddress || 'unknown',
      tokenSymbol,
      errorType: 'corrupted',
      isLpToken: true,
      timestamp: Date.now(),
    });
  },

  viewingKeyErrorWithAddress: (
    _title: string,
    _messageTemplate: string,
    tokenAddress: string,
    _toastId: string
  ) => {
    // Use aggregation system instead of individual toasts
    viewingKeyErrorAggregator.addError({
      tokenAddress,
      tokenSymbol: undefined,
      errorType: 'failed',
      isLpToken: false,
      timestamp: Date.now(),
    });
  },
};
