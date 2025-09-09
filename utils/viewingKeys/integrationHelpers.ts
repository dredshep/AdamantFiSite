import { TOKENS } from '@/config/tokens';
import { getSecretClient } from '@/hooks/useSecretNetwork';
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

/**
 * Validates and imports an existing viewing key into Keplr
 * This function validates the viewing key before storing it in Keplr to minimize failed transactions
 * @param tokenAddress - The token contract address
 * @param codeHash - The contract code hash
 * @param viewingKey - The viewing key to validate and import
 * @param chainId - The chain ID (default: 'secret-4')
 * @returns Promise<{success: boolean, balance?: string, error?: string}>
 */
export const validateAndImportViewingKey = async (
  tokenAddress: string,
  codeHash: string,
  viewingKey: string,
  chainId: string = 'secret-4'
): Promise<{ success: boolean; balance?: string; error?: string }> => {
  if (!viewingKey.trim()) {
    return { success: false, error: 'Viewing key cannot be empty' };
  }

  try {
    // Check Keplr availability
    if (!window.keplr) {
      return { success: false, error: 'Keplr wallet not found' };
    }

    // Get wallet address for direct validation
    await window.keplr.enable(chainId);
    const offlineSigner = window.keplr.getOfflineSignerOnlyAmino(chainId);
    const accounts = await offlineSigner.getAccounts();
    const walletAddress = accounts[0]?.address;

    if (!walletAddress) {
      return { success: false, error: 'No wallet address found' };
    }

    // Step 1: Validate the viewing key by making a direct query to the Secret Network
    console.log('🔍 Validating viewing key with direct Secret Network query...');
    console.log('Debug info:', {
      tokenAddress,
      codeHash,
      walletAddress,
      viewingKeyLength: viewingKey.length,
      viewingKeyStart: viewingKey.substring(0, 8),
      viewingKeyEnd: viewingKey.substring(viewingKey.length - 4),
    });

    try {
      // Use the centralized SecretNetworkClient for consistency
      const secretClient = getSecretClient();
      console.log('Using centralized SecretNetworkClient for validation');

      const response = await secretClient.query.compute.queryContract({
        contract_address: tokenAddress,
        code_hash: codeHash,
        query: {
          balance: {
            address: walletAddress,
            key: viewingKey,
          },
        },
      });

      console.log('Query response:', response);

      // Check if query succeeded and returned balance data
      if (response && typeof response === 'object' && 'balance' in response) {
        const balanceData = response as { balance?: { amount?: string } };
        const balance = balanceData.balance?.amount || '0';
        console.log('✅ Viewing key validation successful, balance:', balance);

        // Now store the validated key in Keplr
        console.log('🔐 Storing validated viewing key in Keplr...');
        await window.keplr.suggestToken(chainId, tokenAddress, viewingKey);

        return { success: true, balance };
      } else if (response && typeof response === 'object' && 'viewing_key_error' in response) {
        const errorData = response as { viewing_key_error?: { msg?: string } };
        const errorMsg = errorData.viewing_key_error?.msg || 'Unknown viewing key error';
        console.log('❌ Viewing key error:', errorMsg);
        return { success: false, error: 'Invalid viewing key for this address' };
      } else {
        console.log('❌ Unexpected response format:', response);
        return { success: false, error: 'Unexpected response format from contract' };
      }
    } catch (validationError) {
      console.log('❌ Viewing key validation failed:', validationError);
      const errorMessage =
        validationError instanceof Error ? validationError.message : 'Unknown error';
      return { success: false, error: `Validation failed: ${errorMessage}` };
    }
  } catch (error) {
    console.log('Viewing key import failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
};
