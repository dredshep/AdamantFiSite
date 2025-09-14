import { SecretNetworkClient, TxResultCode } from 'secretjs';

// Types for query responses
interface BalanceResponse {
  balance?: {
    amount: string;
  };
}

interface ErrorResponse {
  viewing_key_error?: {
    msg: string;
  };
  query_error?: {
    msg: string;
  };
}

/**
 * Options for forcing creation of a new viewing key
 */
export interface ForceCreateViewingKeyOptions {
  /** The SecretJS client instance */
  secretjs: SecretNetworkClient;
  /** The contract address to create viewing key for */
  contractAddress: string;
  /** The contract code hash */
  codeHash: string;
  /** Custom viewing key to use (optional, will generate random if not provided) */
  customKey?: string;
  /** Gas limit for the transaction (default: 150,000) */
  gasLimit?: number;
  /** Whether to store the key in Keplr after creation (default: true) */
  storeInKeplr?: boolean;
  /** Chain ID for Keplr storage (default: 'secret-4') */
  chainId?: string;
  /** Callback for progress updates */
  onProgress?: (message: string) => void;
}

/**
 * Result of forcing creation of a new viewing key
 */
export interface ForceCreateViewingKeyResult {
  /** Whether the operation was successful */
  success: boolean;
  /** The viewing key that was created */
  viewingKey: string | null;
  /** Transaction hash if successful */
  txHash?: string;
  /** Error message if failed */
  error?: string;
  /** Balance queried after creation (if available) */
  balance?: string | undefined;
}

/**
 * Generates a cryptographically secure random viewing key
 */
export function generateSecureViewingKey(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Forces creation of a brand new viewing key for any Secret Network token/contract.
 *
 * This function:
 * 1. Generates a new secure random viewing key (or uses provided one)
 * 2. Executes a set_viewing_key transaction on the contract
 * 3. Optionally stores the key in Keplr wallet
 * 4. Validates the key works by querying balance
 *
 * @param options Configuration options for creating the viewing key
 * @returns Promise resolving to the result of the operation
 *
 * @example
 * ```typescript
 * const result = await forceCreateViewingKey({
 *   secretjs,
 *   contractAddress: 'secret1....',
 *   codeHash: 'abc123...',
 *   onProgress: (msg) => console.log(msg)
 * });
 *
 * if (result.success) {
 *   console.log('New viewing key:', result.viewingKey);
 *   console.log('Balance:', result.balance);
 * } else {
 *   console.error('Failed:', result.error);
 * }
 * ```
 */
export async function forceCreateViewingKey(
  options: ForceCreateViewingKeyOptions
): Promise<ForceCreateViewingKeyResult> {
  const {
    secretjs,
    contractAddress,
    codeHash,
    customKey,
    gasLimit = 150_000,
    storeInKeplr = true,
    chainId = 'secret-4',
    onProgress,
  } = options;

  // Validate inputs
  if (!secretjs || !contractAddress || !codeHash) {
    return {
      success: false,
      viewingKey: null,
      error: 'Missing required parameters: secretjs, contractAddress, or codeHash',
    };
  }

  if (!window.keplr && storeInKeplr) {
    return {
      success: false,
      viewingKey: null,
      error: 'Keplr wallet not available, but storeInKeplr is enabled',
    };
  }

  try {
    // Step 1: Generate or use provided viewing key
    const newViewingKey = customKey || generateSecureViewingKey();
    onProgress?.('🔑 Generating new viewing key...');

    // Step 2: Create the set_viewing_key message
    const setViewingKeyMsg = {
      set_viewing_key: {
        key: newViewingKey,
      },
    };

    onProgress?.('📡 Submitting transaction to blockchain...');

    // Step 3: Execute the transaction
    const txResult = await secretjs.tx.compute.executeContract(
      {
        sender: secretjs.address,
        contract_address: contractAddress,
        code_hash: codeHash,
        msg: setViewingKeyMsg,
        sent_funds: [],
      },
      {
        gasLimit,
      }
    );

    // Step 4: Check transaction result
    if (txResult.code !== TxResultCode.Success) {
      return {
        success: false,
        viewingKey: null,
        error: `Transaction failed: ${txResult.rawLog || 'Unknown blockchain error'}`,
      };
    }

    onProgress?.('✅ Transaction successful! Storing in Keplr...');

    // Step 5: Store in Keplr if requested
    if (storeInKeplr && window.keplr) {
      try {
        await window.keplr.suggestToken(chainId, contractAddress, newViewingKey);
        onProgress?.('🔐 Viewing key stored in Keplr wallet');
      } catch (keplrError) {
        // Don't fail the whole operation if Keplr storage fails
        console.warn('Failed to store viewing key in Keplr:', keplrError);
        onProgress?.('⚠️ Transaction successful, but failed to store in Keplr');
      }
    }

    // Step 6: Validate the key works by querying balance
    onProgress?.('🔍 Validating new viewing key...');
    let balance: string | undefined;

    try {
      const balanceQuery = await secretjs.query.compute.queryContract({
        contract_address: contractAddress,
        code_hash: codeHash,
        query: { balance: { address: secretjs.address, key: newViewingKey } },
      });

      // Handle different response formats
      const balanceResult = balanceQuery as BalanceResponse;
      const errorResult = balanceQuery as ErrorResponse;

      if (balanceResult.balance?.amount) {
        balance = balanceResult.balance.amount;
        onProgress?.(`✅ Key validated! Balance: ${balance}`);
      } else if (errorResult.viewing_key_error || errorResult.query_error) {
        onProgress?.('⚠️ Key created but validation query failed');
      } else {
        onProgress?.('⚠️ Key created but balance format unknown');
      }
    } catch (validationError) {
      // Don't fail the whole operation if validation fails
      console.warn('Failed to validate viewing key:', validationError);
      onProgress?.('⚠️ Key created but validation failed');
    }

    return {
      success: true,
      viewingKey: newViewingKey,
      txHash: txResult.transactionHash,
      balance,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      viewingKey: null,
      error: `Failed to create viewing key: ${errorMessage}`,
    };
  }
}

/**
 * Quick utility to force create viewing key for a token with minimal setup
 *
 * @param secretjs SecretJS client
 * @param tokenAddress Token contract address
 * @param tokenCodeHash Token contract code hash
 * @returns Promise resolving to viewing key or null if failed
 */
export async function quickForceCreateKey(
  secretjs: SecretNetworkClient,
  tokenAddress: string,
  tokenCodeHash: string
): Promise<string | null> {
  const result = await forceCreateViewingKey({
    secretjs,
    contractAddress: tokenAddress,
    codeHash: tokenCodeHash,
  });

  return result.success ? result.viewingKey : null;
}
