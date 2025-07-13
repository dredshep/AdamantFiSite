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
    public suggestedAction?: string,
    public caller?: string,
    public traceId?: string
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

  async getBalance(
    tokenAddress: string,
    codeHash: string,
    caller: string,
    traceId?: string
  ): Promise<string> {
    // Get wallet address from Keplr with proper connection check
    const keplr = (window as unknown as Window).keplr;
    if (!keplr) {
      throw new TokenServiceError(
        `Keplr not installed (called from: ${caller})`,
        TokenServiceErrorType.WALLET_ERROR,
        false,
        'Install Keplr wallet extension',
        caller,
        traceId
      );
    }

    let accounts;
    try {
      // First ensure the chain is enabled
      await keplr.enable('secret-4');
      const offlineSigner = keplr.getOfflineSignerOnlyAmino('secret-4');
      accounts = await offlineSigner.getAccounts();
    } catch (error) {
      throw new TokenServiceError(
        `Failed to access Keplr wallet (called from: ${caller}): ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        TokenServiceErrorType.WALLET_ERROR,
        true,
        'Unlock your Keplr wallet and try again',
        caller,
        traceId
      );
    }

    const walletAddress = accounts[0]?.address;
    if (typeof walletAddress !== 'string' || walletAddress.length === 0) {
      throw new TokenServiceError(
        `No wallet address found (called from: ${caller})`,
        TokenServiceErrorType.WALLET_ERROR,
        true,
        'Connect your wallet',
        caller,
        traceId
      );
    }

    console.log('TokenService.getBalance - Starting balance fetch:', {
      tokenAddress,
      codeHash,
      walletAddress,
      hasRejectedKey: this.rejectedViewingKeys.has(tokenAddress),
    });

    if (this.rejectedViewingKeys.has(tokenAddress)) {
      throw new TokenServiceError(
        `Viewing key request for token ${tokenAddress} was rejected (called from: ${caller})`,
        TokenServiceErrorType.VIEWING_KEY_REJECTED,
        true,
        'Try again and approve the viewing key request',
        caller,
        traceId
      );
    }

    if (this.lastError && Date.now() - this.errorTimestamp < this.ERROR_THRESHOLD) {
      console.log('TokenService.getBalance - Throwing cached error:', {
        lastError: this.lastError.message,
        timeSinceError: Date.now() - this.errorTimestamp,
        threshold: this.ERROR_THRESHOLD,
      });
      throw this.lastError;
    }

    // Step 1: Get the viewing key. This can throw an error if the user rejects it or
    // if a key is required but not found after attempting to set it.
    let viewingKey: string | null = null;
    try {
      console.log('TokenService.getBalance - About to get viewing key from Keplr');
      viewingKey = await keplr.getSecret20ViewingKey('secret-4', tokenAddress).catch(() => null);
      console.log('TokenService.getBalance - Got viewing key from Keplr');

      // DEBUG: Log the actual viewing key details
      console.log(`[DEBUG] Viewing key for ${tokenAddress}:`, {
        keyExists: !!viewingKey,
        keyType: typeof viewingKey,
        keyLength: viewingKey?.length || 0,
        keyPreview: viewingKey
          ? `${viewingKey.substring(0, 8)}...${viewingKey.substring(viewingKey.length - 4)}`
          : 'null',
        caller,
        traceId,
      });

      if (typeof viewingKey !== 'string' || viewingKey.length === 0) {
        console.log(`[DEBUG] Invalid viewing key detected:`, {
          tokenAddress,
          viewingKey,
          keyType: typeof viewingKey,
          caller,
          traceId,
        });

        // DO NOT try to suggest a token here. This is a non-interactive function.
        // The UI layer should handle the interactive part of setting a key.
        // We just report that it's required.
        throw new TokenServiceError(
          `Viewing key required for token ${tokenAddress} (called from: ${caller}).`,
          TokenServiceErrorType.VIEWING_KEY_REQUIRED,
          true,
          'Set a viewing key for this token',
          caller,
          traceId
        );
      }
    } catch (error) {
      // If we already have a TokenServiceError, just re-throw it.
      if (error instanceof TokenServiceError) {
        throw error;
      }

      // Otherwise, assume the user rejected the Keplr prompt.
      if (error instanceof Error) {
        this.rejectedViewingKeys.add(tokenAddress);
        throw new TokenServiceError(
          `Viewing key request for token ${tokenAddress} was rejected by user`,
          TokenServiceErrorType.VIEWING_KEY_REJECTED,
          true,
          'Try again and approve the viewing key request',
          caller,
          traceId
        );
      } else {
        throw new TokenServiceError(
          `Unknown error during viewing key setup for token ${tokenAddress}`,
          TokenServiceErrorType.UNKNOWN_ERROR,
          true,
          'Try refreshing and attempting again',
          caller,
          traceId
        );
      }
    }

    // Step 2: Query the contract.
    // This is the only section that needs a deep try-catch for unexpected network/query errors.
    let response;
    try {
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
        walletAddress: queryParams.address,
      });

      response = await this.throttledQuery(queryParams);
      console.log('TokenService.getBalance - Raw response:', response);
    } catch (error) {
      console.error(
        `TokenService.getBalance - A fatal network/query error occurred for token ${tokenAddress}:`,
        error
      );
      // This is for truly unexpected errors. Wrap it and throw.
      const errorMessage = error instanceof Error ? error.message : 'A network error occurred';
      this.lastError = new TokenServiceError(
        `Network/Query failed for ${tokenAddress}: ${errorMessage}`,
        TokenServiceErrorType.NETWORK_ERROR,
        true,
        'The network may be congested. Please wait and try again.',
        caller,
        traceId
      );
      this.errorTimestamp = Date.now();
      throw this.lastError;
    }

    // Step 3: Analyze the response. If the query succeeded, the response itself may contain an error.
    if (typeof response === 'object' && response !== null) {
      let errorMsg = '';
      let hasViewingKeyError = false;

      if ('viewing_key_error' in response) {
        const errorResponse = response as { viewing_key_error: { msg?: string } };
        errorMsg = errorResponse.viewing_key_error.msg || 'Viewing key error';
        hasViewingKeyError = true;
      } else if ('query_error' in response) {
        const errorResponse = response as { query_error: { msg?: string } };
        const msg = errorResponse.query_error.msg || 'Query error';
        if (msg.toLowerCase().includes('viewing key')) {
          errorMsg = msg;
          hasViewingKeyError = true;
        }
      }

      if (hasViewingKeyError) {
        // DEBUG: Log the viewing key that caused the error
        console.log(`[DEBUG] Contract rejected viewing key:`, {
          tokenAddress,
          keyPreview: viewingKey
            ? `${viewingKey.substring(0, 8)}...${viewingKey.substring(viewingKey.length - 4)}`
            : 'null',
          keyLength: viewingKey?.length || 0,
          errorMsg,
          caller,
          traceId,
          fullResponse: response,
        });

        // We successfully retrieved a key from Keplr, but the contract rejected it. It's INVALID.
        throw new TokenServiceError(
          `Invalid viewing key for token ${tokenAddress}: ${errorMsg} (called from: ${caller})`,
          TokenServiceErrorType.VIEWING_KEY_INVALID,
          true,
          'Reset the viewing key for this token',
          caller,
          traceId
        );
      }
    }

    // Step 4: Validate the response structure.
    if (
      typeof response?.balance !== 'object' ||
      response.balance === null ||
      typeof response.balance.amount !== 'string'
    ) {
      throw new TokenServiceError(
        `Invalid balance response from contract for token ${tokenAddress} (called from: ${caller}).`,
        TokenServiceErrorType.CONTRACT_ERROR,
        true,
        'Check if the token contract is working properly',
        caller,
        traceId
      );
    }

    // Success!
    this.lastError = null;
    this.errorTimestamp = 0;
    return response.balance.amount;
  }

  async suggestToken(tokenAddress: string, caller: string, traceId?: string): Promise<void> {
    const keplr = (window as unknown as Window).keplr;
    if (!keplr) {
      throw new TokenServiceError(
        `Keplr not installed (called from: ${caller})`,
        TokenServiceErrorType.WALLET_ERROR,
        false,
        'Install Keplr wallet extension',
        caller,
        traceId
      );
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
  async resetViewingKey(tokenAddress: string, caller: string, traceId?: string): Promise<void> {
    const keplr = (window as unknown as Window).keplr;
    if (!keplr) {
      throw new TokenServiceError(
        `Keplr not installed (called from: ${caller})`,
        TokenServiceErrorType.WALLET_ERROR,
        false,
        'Install Keplr wallet extension',
        caller,
        traceId
      );
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
      throw new TokenServiceError(
        `Failed to reset viewing key for token ${tokenAddress} (called from: ${caller}). You may need to manually remove and re-add this token in Keplr wallet settings.`,
        TokenServiceErrorType.VIEWING_KEY_INVALID,
        true,
        'Manually remove and re-add token in Keplr settings',
        caller,
        traceId
      );
    }
  }
}
