// Toast ID references to prevent duplicates
export const GLOBAL_TOAST_IDS = {
  KEPLR_NOT_INSTALLED: 'global-keplr-not-installed',
  VIEWING_KEY_REQUIRED: 'global-viewing-key-required',
  VIEWING_KEY_REJECTED: 'global-viewing-key-rejected',
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

  viewingKeyRequired: () =>
    showToastOnce(GLOBAL_TOAST_IDS.VIEWING_KEY_REQUIRED, 'Viewing Key Required', 'warning', {
      message: 'Please open the Keplr extension to set or fix the viewing key for this token.',
      autoClose: 8000,
    }),

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
};
