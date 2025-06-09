import { secretClient } from '@/hooks/useSecretNetwork';
import { Window } from '@keplr-wallet/types';
import pThrottle from 'p-throttle';

interface QueryParams {
  contract: {
    address: string;
    code_hash: string;
  };
  address: string;
  auth: {
    key: string;
  };
}

// Add error types for better error handling
export enum TokenServiceErrorType {
  VIEWING_KEY_REQUIRED = 'VIEWING_KEY_REQUIRED',
  VIEWING_KEY_INVALID = 'VIEWING_KEY_INVALID',
  VIEWING_KEY_REJECTED = 'VIEWING_KEY_REJECTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class TokenServiceError extends Error {
  constructor(
    message: string,
    public type: TokenServiceErrorType,
    public isRecoverable: boolean = true,
    public suggestedAction?: string
  ) {
    super(message);
    this.name = 'TokenServiceError';
  }
}

export class TokenService {
  private lastError: Error | null = null;
  private errorTimestamp = 0;
  private readonly ERROR_THRESHOLD = 2000; // 2 seconds
  private rejectedViewingKeys: Set<string> = new Set(); // Track rejected viewing key requests

  // Rate limit to 2 requests per second
  private throttledQuery = pThrottle({
    limit: 2,
    interval: 1000,
  })(async (params: QueryParams) => {
    interface QueryArgs {
      balance: {
        address: string;
        key: string;
      };
    }

    interface QueryResult {
      balance: {
        amount: string;
      };
    }

    // Create wallet client on demand
    const secretjs = secretClient;

    return secretjs.query.compute.queryContract<QueryArgs, QueryResult>({
      contract_address: params.contract.address,
      code_hash: params.contract.code_hash,
      query: { balance: { address: params.address, key: params.auth.key } },
    });
  });

  async getBalance(tokenAddress: string, codeHash: string): Promise<string> {
    // Get wallet address from Keplr
    const keplr = (window as unknown as Window).keplr;
    if (!keplr) {
      throw new Error('Keplr not installed');
    }

    const accounts = await keplr.getOfflineSignerOnlyAmino('secret-4').getAccounts();
    const walletAddress = accounts[0]?.address;
    if (typeof walletAddress !== 'string' || walletAddress.length === 0) {
      throw new Error('No wallet address found');
    }

    console.log('TokenService.getBalance - Starting balance fetch:', {
      tokenAddress,
      codeHash,
      walletAddress,
      hasRejectedKey: this.rejectedViewingKeys.has(tokenAddress),
    });

    if (this.rejectedViewingKeys.has(tokenAddress)) {
      throw new Error('Viewing key request was rejected');
    }

    if (this.lastError && Date.now() - this.errorTimestamp < this.ERROR_THRESHOLD) {
      console.log('TokenService.getBalance - Throwing cached error:', {
        lastError: this.lastError.message,
        timeSinceError: Date.now() - this.errorTimestamp,
        threshold: this.ERROR_THRESHOLD,
      });
      throw this.lastError;
    }

    try {
      console.log('TokenService.getBalance - About to get viewing key from Keplr');
      let viewingKey = await keplr.getSecret20ViewingKey('secret-4', tokenAddress).catch((err) => {
        console.log('TokenService.getBalance - Error getting viewing key:', err);
        return null;
      });
      console.log('TokenService.getBalance - Got viewing key from Keplr');

      console.log('TokenService.getBalance - Retrieved viewing key:', {
        tokenAddress,
        hasViewingKey: viewingKey !== null,
        viewingKeyLength: typeof viewingKey === 'string' ? viewingKey.length : 0,
        viewingKeyPreview:
          typeof viewingKey === 'string' && viewingKey.length > 0
            ? `${viewingKey.substring(0, 8)}...`
            : 'null',
      });

      if (typeof viewingKey !== 'string' || viewingKey.length === 0) {
        try {
          await keplr.suggestToken('secret-4', tokenAddress);

          // Add delay to allow Keplr to process the viewing key
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // After suggesting token, try to get the viewing key again
          viewingKey = await keplr
            .getSecret20ViewingKey('secret-4', tokenAddress)
            .catch(() => null);

          if (typeof viewingKey !== 'string' || viewingKey.length === 0) {
            throw new Error('Viewing key required. Please set a viewing key and try again.');
          }
        } catch (error) {
          if (error instanceof Error) {
            this.rejectedViewingKeys.add(tokenAddress);
            throw new TokenServiceError(
              'Viewing key request was rejected by user',
              TokenServiceErrorType.VIEWING_KEY_REJECTED,
              true,
              'Try again and approve the viewing key request'
            );
          } else {
            throw new TokenServiceError(
              'Unknown error during viewing key setup',
              TokenServiceErrorType.UNKNOWN_ERROR,
              true,
              'Try refreshing and attempting again'
            );
          }
        }
      }

      const queryParams = {
        contract: {
          address: tokenAddress,
          code_hash: codeHash,
        },
        address: walletAddress,
        auth: { key: viewingKey },
      };

      console.log('TokenService.getBalance - Query parameters:', {
        tokenAddress: queryParams.contract.address,
        codeHash: queryParams.contract.code_hash,
        walletAddress: queryParams.address,
        viewingKeyPreview:
          typeof queryParams.auth.key === 'string' && queryParams.auth.key.length > 0
            ? `${queryParams.auth.key.substring(0, 8)}...`
            : 'null',
      });

      console.log('TokenService.getBalance - About to execute query');
      const response = await this.throttledQuery(queryParams);
      console.log('TokenService.getBalance - Query completed successfully');
      console.log('TokenService.getBalance - Raw response:', response);

      // Check for viewing key error first
      if (typeof response === 'object' && response !== null && 'viewing_key_error' in response) {
        const errorResponse = response as { viewing_key_error: { msg?: string } };
        const errorMsg =
          typeof errorResponse.viewing_key_error.msg === 'string' &&
          errorResponse.viewing_key_error.msg.length > 0
            ? errorResponse.viewing_key_error.msg
            : 'Viewing key error';
        console.log('TokenService.getBalance - Viewing key error detected:', errorMsg);

        // Determine if this is a missing or invalid viewing key
        if (
          errorMsg.toLowerCase().includes('not set') ||
          errorMsg.toLowerCase().includes('viewing key not set')
        ) {
          throw new TokenServiceError(
            'Viewing key not set for this token',
            TokenServiceErrorType.VIEWING_KEY_REQUIRED,
            true,
            'Set a viewing key for this token'
          );
        } else {
          throw new TokenServiceError(
            `Invalid viewing key: ${errorMsg}`,
            TokenServiceErrorType.VIEWING_KEY_INVALID,
            true,
            'Reset the viewing key for this token'
          );
        }
      }

      // Response is now properly typed from the generic parameters
      if (
        typeof response.balance !== 'object' ||
        response.balance === null ||
        typeof response.balance.amount !== 'string'
      ) {
        throw new Error('Invalid balance response from contract');
      }

      this.lastError = null;
      this.errorTimestamp = 0;

      return response.balance.amount;
    } catch (error) {
      console.error('TokenService.getBalance error:', error);
      console.error('Error type:', typeof error);
      console.error('Error structure:', JSON.stringify(error, null, 2));

      // If it's already a TokenServiceError, just re-throw it
      if (error instanceof TokenServiceError) {
        this.lastError = error;
        this.errorTimestamp = Date.now();
        throw error;
      }

      let errorMessage = 'Unknown error';
      let errorType = TokenServiceErrorType.UNKNOWN_ERROR;
      let suggestedAction = 'Try again later';

      // Handle different error object structures
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Secret Network API error format: { code: number, message: string, details: [] }
        if ('message' in error && typeof error.message === 'string') {
          const originalMessage = error.message;

          // Check for specific error patterns that indicate network/node issues vs viewing key issues
          if (originalMessage.includes('contract: not found: unknown request')) {
            // This specific error often indicates a node/network issue, not a viewing key issue
            errorMessage =
              'Network error: The Secret Network node is experiencing issues. Please try again in a few moments.';
            errorType = TokenServiceErrorType.NETWORK_ERROR;
            suggestedAction = 'Wait a few moments and try again';
          } else {
            errorMessage = originalMessage;
          }
        } else if ('code' in error && typeof error.code === 'number') {
          // Map common error codes to user-friendly messages
          switch (error.code) {
            case 2:
              // Code 2 with "contract: not found" is usually a node issue, not viewing key issue
              if (
                typeof error === 'object' &&
                'message' in error &&
                typeof error.message === 'string' &&
                error.message.includes('contract: not found')
              ) {
                errorMessage =
                  'Network error: The Secret Network node is experiencing issues. Please try again in a few moments.';
                errorType = TokenServiceErrorType.NETWORK_ERROR;
                suggestedAction = 'Wait a few moments and try again';
              } else {
                errorMessage = 'Invalid viewing key. Please reset your viewing key and try again.';
                errorType = TokenServiceErrorType.VIEWING_KEY_INVALID;
                suggestedAction = 'Reset your viewing key';
              }
              break;
            case 5:
              errorMessage =
                'Token contract not found. Please check if the token address is correct.';
              errorType = TokenServiceErrorType.CONTRACT_ERROR;
              suggestedAction = 'Verify the token address is correct';
              break;
            default:
              errorMessage = `Network error (code ${error.code}): The Secret Network is experiencing issues. Please try again later.`;
              errorType = TokenServiceErrorType.NETWORK_ERROR;
              suggestedAction = 'Try again later';
          }
        }
      }

      // Handle specific error cases based on message content
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
          errorMessage =
            'Invalid viewing key. The viewing key for this token appears to be corrupted or invalid. Please reset your viewing key and try again.';
          errorType = TokenServiceErrorType.VIEWING_KEY_INVALID;
          suggestedAction = 'Reset your viewing key';
        } else if (
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('viewing key') ||
          errorMessage.includes('Invalid viewing key')
        ) {
          errorMessage = 'Invalid viewing key. Please reset your viewing key and try again.';
          errorType = TokenServiceErrorType.VIEWING_KEY_INVALID;
          suggestedAction = 'Reset your viewing key';
        } else if (
          errorMessage.includes('contract: not found') ||
          errorMessage.includes('unknown request')
        ) {
          errorMessage =
            'Invalid viewing key. The viewing key for this token appears to be corrupted or invalid. Please reset your viewing key and try again.';
          errorType = TokenServiceErrorType.VIEWING_KEY_INVALID;
          suggestedAction = 'Reset your viewing key';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorMessage =
            'Network error: Unable to connect to Secret Network. Please check your connection.';
          errorType = TokenServiceErrorType.NETWORK_ERROR;
          suggestedAction = 'Check your internet connection';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'Request timeout: The network is slow. Please try again.';
          errorType = TokenServiceErrorType.NETWORK_ERROR;
          suggestedAction = 'Wait and try again';
        } else if (errorMessage.includes('query failed') || errorMessage.includes('contract')) {
          errorMessage =
            'Contract query failed. The viewing key might be invalid or the token contract is experiencing issues.';
          errorType = TokenServiceErrorType.CONTRACT_ERROR;
          suggestedAction = 'Check viewing key or try again later';
        } else if (errorMessage === 'Unknown error') {
          // Fallback for truly unknown errors - assume it's a viewing key issue since that's the most common cause
          errorMessage =
            'Unable to fetch balance. This is likely due to an invalid viewing key. Please reset your viewing key and try again.';
          errorType = TokenServiceErrorType.VIEWING_KEY_INVALID;
          suggestedAction = 'Reset your viewing key';
        }
      }

      this.lastError = new TokenServiceError(errorMessage, errorType, true, suggestedAction);
      this.errorTimestamp = Date.now();
      throw this.lastError;
    }
  }

  async suggestToken(tokenAddress: string): Promise<void> {
    const keplr = (window as unknown as Window).keplr;
    if (!keplr) {
      throw new Error('Keplr not installed');
    }

    await keplr.suggestToken('secret-4', tokenAddress);
  }

  // Add method to clear rejected state if user wants to try again
  clearRejectedViewingKey(tokenAddress: string): void {
    this.rejectedViewingKeys.delete(tokenAddress);
  }

  // Add method to clear cached error state for debugging
  clearCachedError(): void {
    console.log('TokenService.clearCachedError - Clearing cached error state');
    this.lastError = null;
    this.errorTimestamp = 0;
  }

  // Method to help reset viewing key when it's invalid
  async resetViewingKey(tokenAddress: string): Promise<void> {
    const keplr = (window as unknown as Window).keplr;
    if (!keplr) {
      throw new Error('Keplr not installed');
    }

    try {
      // Clear any rejected state
      this.clearRejectedViewingKey(tokenAddress);

      // First, try to suggest the token with a new viewing key
      // Note: suggestToken may not override existing viewing keys, but it's worth trying
      await keplr.suggestToken('secret-4', tokenAddress);

      // Wait for Keplr to process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to get the viewing key to see if it exists
      const existingKey = await keplr
        .getSecret20ViewingKey('secret-4', tokenAddress)
        .catch(() => null);

      if (typeof existingKey !== 'string' || existingKey.length === 0) {
        // If no viewing key exists, suggest the token again to prompt user
        await keplr.suggestToken('secret-4', tokenAddress);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Note: If a corrupted viewing key exists, the user may need to manually
      // remove and re-add the token in Keplr settings, as suggestToken
      // cannot override existing viewing keys according to Keplr's design
    } catch (error) {
      console.error('Error resetting viewing key:', error);
      throw new Error(
        'Failed to reset viewing key. You may need to manually remove and re-add this token in Keplr wallet settings.'
      );
    }
  }
}
