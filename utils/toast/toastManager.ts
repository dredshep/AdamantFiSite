import CustomToast from '@/components/app/Shared/Toasts/CustomToast';
import React from 'react';
import { toast, ToastOptions } from 'react-toastify';

// Toast ID references to prevent duplicates
export const GLOBAL_TOAST_IDS = {
  KEPLR_NOT_INSTALLED: 'global-keplr-not-installed',
  VIEWING_KEY_REQUIRED: 'global-viewing-key-required',
  VIEWING_KEY_REJECTED: 'global-viewing-key-rejected',
  NETWORK_ERROR: 'global-network-error',
  BALANCE_FETCH_ERROR: 'global-balance-fetch-error',
  CONNECTION_ERROR: 'global-connection-error',
} as const;

// Global state to track which toasts have been shown
interface ToastState {
  shownToasts: Set<string>;
  lastShownTime: Map<string, number>;
}

const globalToastState: ToastState = {
  shownToasts: new Set(),
  lastShownTime: new Map(),
};

// Minimum time between showing the same toast (in milliseconds)
const TOAST_COOLDOWN = 10000; // 10 seconds

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

  // Dismiss any existing toast with this ID first
  toast.dismiss(toastId);

  // Create toast options
  const toastOptions: ToastOptions = {
    position: 'top-right',
    toastId,
    autoClose: options?.autoClose !== undefined ? options.autoClose : 6000,
    hideProgressBar: true,
    closeButton: false,
    className: 'custom-toast-container',
  };

  // Show the custom toast
  const toastProps = {
    type,
    title,
    ...(options?.message && { message: options.message }),
    ...(options?.actionLabel && { actionLabel: options.actionLabel }),
    ...(options?.onAction && { onAction: options.onAction }),
  };

  toast(React.createElement(CustomToast, toastProps), toastOptions);

  // Update tracking
  globalToastState.shownToasts.add(toastId);
  globalToastState.lastShownTime.set(toastId, now);
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
    showToastOnce(GLOBAL_TOAST_IDS.VIEWING_KEY_REQUIRED, 'Viewing key required', 'warning', {
      message: 'A viewing key is needed to see your balance for this token.',
      actionLabel: 'Learn More',
      onAction: () =>
        window.open(
          'https://docs.scrt.network/secret-network-documentation/development/development-concepts/viewing-keys',
          '_blank'
        ),
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
