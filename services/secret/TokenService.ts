import { Window } from '@keplr-wallet/types';
import pThrottle from 'p-throttle';
import { SecretNetworkClient } from 'secretjs';
interface QueryParams {
  contract: {
    address: string;
    code_hash: string;
  };
  address: string;
  auth: {
    key: string;
  };
}export class TokenService {
  private secretjs: SecretNetworkClient;
  private lastError: Error | null = null;
  private errorTimestamp = 0;
  private readonly ERROR_THRESHOLD = 5000; // 5 seconds
  private rejectedViewingKeys: Set<string> = new Set(); // Track rejected viewing key requests

  // Rate limit to 2 requests per second
  private throttledQuery = pThrottle({
    limit: 2,
    interval: 1000,
  })(async (params: QueryParams) => {
    return this.secretjs.query.snip20.getBalance(params);
  });

  constructor(secretjs: SecretNetworkClient) {
    this.secretjs = secretjs;
  }

  async getBalance(tokenAddress: string, codeHash: string): Promise<string> {
    if (this.rejectedViewingKeys.has(tokenAddress)) {
      throw new Error('Viewing key request was rejected');
    }

    if (this.lastError && Date.now() - this.errorTimestamp < this.ERROR_THRESHOLD) {
      throw this.lastError;
    }

    try {
      const keplr = (window as unknown as Window).keplr;
      if (typeof keplr === 'undefined' || keplr === null) {
        throw new Error('Keplr not installed');
      }

      let viewingKey = await keplr
        .getSecret20ViewingKey('secret-4', tokenAddress)
        .catch(() => null);
      
      if (typeof viewingKey !== 'string' || viewingKey.length === 0) {
        try {
          await keplr.suggestToken('secret-4', tokenAddress);
          
          // Add delay to allow Keplr to process the viewing key
          await new Promise(resolve => setTimeout(resolve, 1000));
          
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
            throw new Error('Viewing key request rejected');
          } else {
            throw new Error('Unknown error');
          }
        }
      }

      const response = await this.throttledQuery({
        contract: {
          address: tokenAddress,
          code_hash: codeHash,
        },
        address: this.secretjs.address,
        auth: { key: viewingKey },
      });

      if (
        response === null || 
        response === undefined || 
        !('balance' in response) || 
        !('amount' in response.balance) || 
        typeof response.balance.amount !== 'string'
      ) {
        throw new Error('Invalid balance response from contract');
      }

      this.lastError = null;
      this.errorTimestamp = 0;

      return response.balance.amount;
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error('Unknown error');
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
}
