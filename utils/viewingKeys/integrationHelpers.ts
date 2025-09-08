import { TOKENS } from '@/config/tokens';
import { useViewingKeyModalStore } from '@/store/viewingKeyModalStore';
import { showToastOnce } from '@/utils/toast/toastManager';
import { registerViewingKeyToast } from './smartDismissal';

/**
 * Replaces "Copy Address" buttons with "Fix Viewing Key" dual setup
 */
export const replaceCopyAddressWithDualSetup = (
  tokenAddress: string,
  context: string = 'error'
) => {
  const token = TOKENS.find((t) => t.address === tokenAddress);
  if (!token) {
    console.warn('Token not found for dual setup:', tokenAddress);
    return {
      actionLabel: 'Copy Address',
      onAction: () => navigator.clipboard.writeText(tokenAddress),
    };
  }

  return {
    actionLabel: 'Fix Viewing Key',
    onAction: () => {
      useViewingKeyModalStore.getState().open(token, context);
    },
  };
};

/**
 * Updates toast messages to use dual setup instead of manual instructions
 */
export const updateToastWithDualSetup = (
  toastId: string,
  tokenAddress: string,
  errorTitle: string,
  errorMessage: string,
  context: string = 'error'
) => {
  const token = TOKENS.find((t) => t.address === tokenAddress);
  if (!token) {
    console.warn('Token not found for toast update:', tokenAddress);
    return;
  }

  // Clean up the error message and add dual setup message
  const cleanMessage = errorMessage.split('.')[0];
  const enhancedMessage = `${cleanMessage}. Create a new key automatically or use your own custom key.`;

  showToastOnce(toastId, errorTitle, 'error', {
    message: enhancedMessage,
    actionLabel: 'Fix Viewing Key',
    onAction: () => {
      useViewingKeyModalStore.getState().open(token, context);
    },
    autoClose: false,
  });

  // Register this toast for automatic dismissal when key is fixed
  registerViewingKeyToast(tokenAddress, toastId);
};

/**
 * Enhances suggestToken calls with dual setup fallback
 */
export const enhanceSuggestTokenWithDualSetup = async (
  tokenAddress: string,
  originalSuggestToken: () => Promise<void>
): Promise<void> => {
  try {
    await originalSuggestToken();
  } catch (error) {
    console.warn('suggestToken failed, falling back to dual setup:', error);

    const token = TOKENS.find((t) => t.address === tokenAddress);
    if (token) {
      useViewingKeyModalStore.getState().open(token, 'fallback');
    } else {
      throw error; // Re-throw if we can't handle it
    }
  }
};

/**
 * Standardized error handler for viewing key issues
 */
export const handleViewingKeyError = (
  tokenAddress: string,
  error: Error,
  context: string = 'error'
) => {
  const token = TOKENS.find((t) => t.address === tokenAddress);
  if (!token) {
    console.error('Cannot handle viewing key error for unknown token:', tokenAddress, error);
    return;
  }

  // Show error toast with dual setup option
  const toastId = `vk-error-${tokenAddress}`;
  showToastOnce(toastId, 'Viewing Key Issue', 'error', {
    message: `${error.message}. Quick fix available with dual setup.`,
    actionLabel: 'Fix Now',
    onAction: () => {
      useViewingKeyModalStore.getState().open(token, context);
    },
    autoClose: false,
  });

  // Register this toast for automatic dismissal
  registerViewingKeyToast(tokenAddress, toastId);
};

/**
 * Gets LP token symbol for display
 */
export const getLpTokenSymbol = (tokenAddress: string): string => {
  const token = TOKENS.find((t) => t.address === tokenAddress);
  if (token) return token.symbol;

  // For now, just return 'Token' if not found in regular tokens
  // Could be enhanced later to handle LP tokens more specifically

  return 'Token';
};
