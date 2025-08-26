import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { secretClient } from '@/hooks/useSecretNetwork';
import { Window } from '@keplr-wallet/types';
import pThrottle from 'p-throttle';
// Inline truncate function to avoid linter issues
const safeTruncateAddress = (address: string): string => {
  const startChars = 8;
  const endChars = 6;
  if (address.length <= startChars + endChars + 3) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

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
  LP_TOKEN_VIEWING_KEY_CORRUPTED = 'LP_TOKEN_VIEWING_KEY_CORRUPTED',
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

  // Rate limiting and circuit breaker state
  private static isRateLimited = false;
  private static rateLimitUntil = 0;
  private static consecutiveRateLimitErrors = 0;

  private static readonly RATE_LIMIT_COOLDOWN_BASE = 30000; // 30 seconds base
  private static readonly RATE_LIMIT_MAX_COOLDOWN = 300000; // 5 minutes max

  // More conservative rate limit - 1 request per second with burst of 2
  private throttledQuery = pThrottle({
    limit: 1,
    interval: 1000,
    strict: true, // Enforce strict timing
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

    // Check circuit breaker before making request
    if (TokenService.isRateLimited && Date.now() < TokenService.rateLimitUntil) {
      const remainingTime = Math.ceil((TokenService.rateLimitUntil - Date.now()) / 1000);
      throw new Error(`Rate limited by circuit breaker. Retry in ${remainingTime} seconds.`);
    }

    try {
      // Create wallet client on demand
      const secretjs = secretClient;

      const result = await secretjs.query.compute.queryContract<QueryArgs, QueryResult>({
        contract_address: params.contract.address,
        code_hash: params.contract.code_hash,
        query: { balance: { address: params.address, key: params.auth.key } },
      });

      // Reset circuit breaker on successful request
      TokenService.consecutiveRateLimitErrors = 0;
      TokenService.isRateLimited = false;

      return result;
    } catch (error) {
      // Check if this is a rate limit error (429 or JSON parse error which indicates HTML response)
      const isRateLimitError =
        (error instanceof Error && error.message.includes('429')) ||
        (error instanceof Error && error.message.includes('JSON.parse')) ||
        (error instanceof SyntaxError && error.message.includes('JSON.parse'));

      if (isRateLimitError) {
        TokenService.consecutiveRateLimitErrors++;

        // Implement exponential backoff
        const cooldownTime = Math.min(
          TokenService.RATE_LIMIT_COOLDOWN_BASE *
            Math.pow(2, TokenService.consecutiveRateLimitErrors - 1),
          TokenService.RATE_LIMIT_MAX_COOLDOWN
        );

        TokenService.isRateLimited = true;
        TokenService.rateLimitUntil = Date.now() + cooldownTime;

        console.warn(
          `Rate limit detected. Circuit breaker activated for ${Math.ceil(
            cooldownTime / 1000
          )} seconds.`,
          {
            consecutiveErrors: TokenService.consecutiveRateLimitErrors,
            cooldownTime,
            error: error.message,
          }
        );

        throw new Error(
          `API rate limited. Service will retry automatically in ${Math.ceil(
            cooldownTime / 1000
          )} seconds.`
        );
      }

      throw error;
    }
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
      const truncatedAddress = safeTruncateAddress(tokenAddress);
      throw new TokenServiceError(
        `Viewing key request for token ${truncatedAddress} was rejected (called from: ${caller})`,
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
        const truncatedAddress = safeTruncateAddress(tokenAddress);
        throw new TokenServiceError(
          `Viewing key required for token ${truncatedAddress} (called from: ${caller}).`,
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
        const msg = errorResponse.viewing_key_error.msg;

        // Presence of viewing_key_error indicates an error, regardless of message content
        // Use the provided message if available, otherwise use a generic message
        errorMsg =
          msg && typeof msg === 'string' && msg.trim().length > 0
            ? msg
            : 'Viewing key authentication failed';
        hasViewingKeyError = true;

        // Log for debugging purposes to understand the protocol behavior
        console.log('[DEBUG] Contract returned viewing_key_error:', {
          hasMessage: !!msg,
          messageType: typeof msg,
          messageContent: msg,
          fullError: errorResponse.viewing_key_error,
        });
      } else if ('query_error' in response) {
        const errorResponse = response as { query_error: { msg?: string } };
        const msg = errorResponse.query_error.msg;

        // Only treat as viewing key error if there's a message containing "viewing key"
        if (msg && typeof msg === 'string' && msg.toLowerCase().includes('viewing key')) {
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

        // Check if this is an LP token to provide specific error type
        const isLpToken = LIQUIDITY_PAIRS.some((pair) => pair.lpToken === tokenAddress);

        if (isLpToken) {
          const truncatedAddress = safeTruncateAddress(tokenAddress);
          throw new TokenServiceError(
            `LP token viewing key is corrupted for ${truncatedAddress}: ${errorMsg} (called from: ${caller})`,
            TokenServiceErrorType.LP_TOKEN_VIEWING_KEY_CORRUPTED,
            true,
            'Reset the LP token viewing key in Keplr',
            caller,
            traceId
          );
        }

        // We successfully retrieved a key from Keplr, but the contract rejected it. It's INVALID.
        const truncatedAddress = safeTruncateAddress(tokenAddress);
        throw new TokenServiceError(
          `Invalid viewing key for token ${truncatedAddress}: ${errorMsg} (called from: ${caller})`,
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
      const truncatedAddress = safeTruncateAddress(tokenAddress);
      throw new TokenServiceError(
        `Invalid balance response from contract for token ${truncatedAddress} (called from: ${caller}).`,
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

  // Static method to check if service is currently rate limited
  static isCurrentlyRateLimited(): boolean {
    return TokenService.isRateLimited && Date.now() < TokenService.rateLimitUntil;
  }

  // Static method to get remaining cooldown time in seconds
  static getRemainingCooldownTime(): number {
    if (!TokenService.isCurrentlyRateLimited()) return 0;
    return Math.ceil((TokenService.rateLimitUntil - Date.now()) / 1000);
  }

  // Static method to get consecutive error count
  static getConsecutiveErrors(): number {
    return TokenService.consecutiveRateLimitErrors;
  }

  // Static method to manually reset circuit breaker (for testing/recovery)
  static resetCircuitBreaker(): void {
    TokenService.isRateLimited = false;
    TokenService.rateLimitUntil = 0;
    TokenService.consecutiveRateLimitErrors = 0;
    console.log('TokenService circuit breaker manually reset');
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
      const truncatedAddress = safeTruncateAddress(tokenAddress);
      throw new TokenServiceError(
        `Failed to reset viewing key for token ${truncatedAddress} (called from: ${caller}). You may need to manually remove and re-add this token in Keplr wallet settings.`,
        TokenServiceErrorType.VIEWING_KEY_INVALID,
        true,
        'Manually remove and re-add token in Keplr settings',
        caller,
        traceId
      );
    }
  }
}
