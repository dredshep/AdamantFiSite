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
  private sessionShown = new Set<string>();

  addError(error: ViewingKeyError) {
    console.log('🔄 ViewingKeyErrorAggregator.addError:', error);

    // Viewing key error toasts are disabled - users now have inline buttons to create keys
    console.log('🔇 Viewing key error toasts disabled - returning early');
    return;
  }

  // Removed showIndividualError method since we always use aggregate now

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
