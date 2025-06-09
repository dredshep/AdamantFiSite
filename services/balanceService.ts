import { ConfigToken, LP_TOKENS, TOKENS } from '@/config/tokens';
import { useBalanceStore } from '@/store/balanceStore';
import { getTokenBalance } from '@/utils/secretjs/tokens/getTokenBalance';
import { showToastOnce, toastManager } from '@/utils/toast/toastManager';
import { Window } from '@keplr-wallet/types';
import { SecretNetworkClient } from 'secretjs';

class BalanceService {
  private secretjs: SecretNetworkClient | null = null;
  private walletAddress: string | null = null;
  private requestQueue: string[] = [];
  private isProcessing = false;
  private allTokens: ConfigToken[] = [...TOKENS, ...LP_TOKENS];
  private viewingKeys: Map<string, string> = new Map();
  private pendingViewingKeyRequests: Set<string> = new Set();

  public initialize(secretjs: SecretNetworkClient, walletAddress: string) {
    if (this.secretjs && this.walletAddress) {
      console.log('🔧 BalanceService: Already initialized, skipping');
      return; // Already initialized
    }
    this.secretjs = secretjs;
    this.walletAddress = walletAddress;
    console.log('🎉 BalanceService: Successfully initialized!', {
      walletAddress: walletAddress,
      queueLength: this.requestQueue.length,
      hasSecretjs: !!secretjs,
    });
    // Now that the service is initialized, process any pending requests.
    this.processQueue();
  }

  public requestBalanceFetch(address: string) {
    console.log(`🔄 BalanceService: Requesting balance fetch for ${address}`);
    if (!this.requestQueue.includes(address)) {
      this.requestQueue.push(address);
      console.log(
        `➕ BalanceService: Added ${address} to queue. Queue length: ${this.requestQueue.length}`
      );
    } else {
      console.log(`⚠️ BalanceService: ${address} already in queue`);
    }
    // Only attempt to process the queue if the service is already initialized.
    // Otherwise, `initialize()` will trigger it later.
    if (this.secretjs) {
      this.processQueue();
    } else {
      console.log(`⏳ BalanceService: Service not initialized yet, waiting...`);
    }
  }

  private async processQueue() {
    // Guard: Do not process if the service is not initialized.
    if (!this.secretjs || !this.walletAddress) {
      console.warn('BalanceService: Waiting for initialization to process queue.');
      return;
    }

    if (this.isProcessing || this.requestQueue.length === 0) {
      if (this.isProcessing) {
        console.log('⏸️ BalanceService: Already processing queue');
      }
      if (this.requestQueue.length === 0) {
        console.log('✅ BalanceService: Queue is empty');
      }
      return;
    }

    this.isProcessing = true;
    const addressToFetch = this.requestQueue.shift();

    if (addressToFetch) {
      console.log(`🚀 BalanceService: Processing ${addressToFetch}`);
      const { setBalance } = useBalanceStore.getState();
      try {
        setBalance(addressToFetch, { loading: true, error: null });
        const tokenInfo = this.allTokens.find((t) => t.address === addressToFetch);

        if (!tokenInfo) {
          throw new Error(`Token with address ${addressToFetch} not found in config.`);
        }

        console.log(`🔑 BalanceService: Getting viewing key for ${tokenInfo.symbol}`);
        const viewingKey = await this.getViewingKey(addressToFetch);
        if (!viewingKey) {
          throw new Error(`Viewing key not available for ${addressToFetch}.`);
        }

        console.log(`💰 BalanceService: Fetching balance for ${tokenInfo.symbol} with viewing key`);
        // Now secretjs and walletAddress are guaranteed to be non-null
        const rawAmount = await getTokenBalance(
          this.secretjs,
          tokenInfo.address,
          tokenInfo.codeHash,
          this.walletAddress,
          viewingKey
        );

        const amount = (Number(rawAmount) / Math.pow(10, tokenInfo.decimals)).toString();
        console.log(
          `✅ BalanceService: Successfully fetched balance for ${tokenInfo.symbol}: ${amount}`
        );
        setBalance(addressToFetch, { amount, loading: false });
      } catch (error: unknown) {
        console.error(`❌ BalanceService: Failed to fetch balance for ${addressToFetch}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setBalance(addressToFetch, { loading: false, error: errorMessage });

        // Show appropriate toast based on the error
        if (
          errorMessage.includes('Viewing key not available') ||
          errorMessage.includes('viewing key')
        ) {
          console.log('📢 BalanceService: Showing viewing key required toast');
          toastManager.viewingKeyRequired();
        } else {
          console.log('📢 BalanceService: Showing balance fetch error toast');
          toastManager.balanceFetchError();
        }
      }
    }

    // Process next item after a delay to rate-limit
    setTimeout(() => {
      this.isProcessing = false;
      this.processQueue();
    }, 500); // 2 requests per second
  }

  public requestFetchAll() {
    console.log('BalanceService: Queuing all known tokens for balance fetch...');
    for (const token of this.allTokens) {
      // Only add to queue if not already present
      if (!this.requestQueue.includes(token.address)) {
        this.requestQueue.push(token.address);
      }
    }
    // Start processing the queue if it's not already running
    this.processQueue();
  }

  public async requestTokenSuggestion(tokenAddress: string): Promise<void> {
    try {
      const keplr = (window as unknown as Window).keplr;
      if (!keplr) {
        toastManager.keplrNotInstalled();
        return;
      }

      // Show toast to inform user they need to check Keplr
      showToastOnce(`check-keplr-${tokenAddress}`, 'Please check Keplr', 'info', {
        message:
          'A token suggestion request has been sent to Keplr. Please check your wallet to approve or reject it.',
        autoClose: 8000,
      });

      await keplr.suggestToken('secret-4', tokenAddress);
      showToastOnce(
        `token-suggest-success-${tokenAddress}`,
        'Token suggested successfully!',
        'success'
      );
    } catch (e: unknown) {
      console.error(`Failed to suggest token ${tokenAddress}`, e);
      const errorMessage = e instanceof Error ? e.message : String(e);

      if (errorMessage.includes('Request rejected') || errorMessage.includes('denied')) {
        showToastOnce(
          `token-suggest-rejected-${tokenAddress}`,
          'Token suggestion rejected',
          'warning',
          {
            message:
              'You rejected the token suggestion in Keplr. Click "Suggest Token" again if you want to retry.',
            autoClose: 10000,
          }
        );
      } else {
        showToastOnce(`token-suggest-error-${tokenAddress}`, 'Failed to suggest token.', 'error');
      }
    }
  }

  public async resetViewingKey(tokenAddress: string): Promise<void> {
    console.warn(
      `BalanceService: Resetting viewing key for ${tokenAddress}. This will attempt to re-prompt Keplr. If a key already exists, it may need to be removed manually from Keplr's settings.`
    );

    // Clear the cached viewing key first
    this.viewingKeys.delete(tokenAddress);

    // Show toast to inform user they need to check Keplr
    showToastOnce(`check-keplr-reset-${tokenAddress}`, 'Please check Keplr', 'info', {
      message:
        'A viewing key reset request has been sent to Keplr. Please check your wallet to authorize the new viewing key.',
      autoClose: 8000,
    });

    // Re-suggesting the token is the only programmatic way to prompt the user again.
    await this.requestTokenSuggestion(tokenAddress);
  }

  private async getViewingKey(tokenAddress: string): Promise<string | null> {
    if (this.viewingKeys.has(tokenAddress)) {
      console.log(`🔑 BalanceService: Using cached viewing key for ${tokenAddress}`);
      return this.viewingKeys.get(tokenAddress)!;
    }

    // Check if we're already waiting for this viewing key
    if (this.pendingViewingKeyRequests.has(tokenAddress)) {
      console.log(`⏳ BalanceService: Viewing key request already pending for ${tokenAddress}`);
      throw new Error(
        `Viewing key request already pending for ${tokenAddress}. Please check Keplr.`
      );
    }

    try {
      const keplr = (window as unknown as Window).keplr;
      if (!keplr) {
        console.log('❌ BalanceService: Keplr not installed');
        toastManager.keplrNotInstalled();
        return null;
      }

      // Mark as pending
      this.pendingViewingKeyRequests.add(tokenAddress);
      console.log(`🔒 BalanceService: Marked ${tokenAddress} as pending viewing key request`);

      // Try to get existing viewing key first
      let vk: string;
      try {
        console.log(
          `🔍 BalanceService: Attempting to get existing viewing key for ${tokenAddress}`
        );
        vk = await keplr.getSecret20ViewingKey('secret-4', tokenAddress);
        this.viewingKeys.set(tokenAddress, vk);
        this.pendingViewingKeyRequests.delete(tokenAddress);
        console.log(`✅ BalanceService: Found existing viewing key for ${tokenAddress}`);
        return vk;
      } catch (e) {
        // No existing viewing key, need to suggest token
        console.log(
          `🆕 BalanceService: No existing viewing key for ${tokenAddress}, suggesting token`
        );

        // Show toast to inform user they need to check Keplr
        console.log(`📢 BalanceService: Showing 'check Keplr' toast for viewing key request`);
        showToastOnce(`check-keplr-viewing-key-${tokenAddress}`, 'Please check Keplr', 'info', {
          message:
            'A viewing key request has been sent to Keplr. Please check your wallet to authorize access to your balance.',
          autoClose: 8000,
        });

        // Suggest token first, then get viewing key
        console.log(`🔗 BalanceService: Suggesting token ${tokenAddress} to Keplr`);
        await keplr.suggestToken('secret-4', tokenAddress);
        console.log(`🔑 BalanceService: Requesting viewing key after token suggestion`);
        vk = await keplr.getSecret20ViewingKey('secret-4', tokenAddress);

        if (vk) {
          this.viewingKeys.set(tokenAddress, vk);
          this.pendingViewingKeyRequests.delete(tokenAddress);

          // Show success toast
          console.log(`📢 BalanceService: Showing success toast for viewing key authorization`);
          showToastOnce(
            `viewing-key-success-${tokenAddress}`,
            'Viewing key authorized!',
            'success',
            {
              message:
                'Your viewing key has been successfully authorized. Balance will now be fetched.',
              autoClose: 4000,
            }
          );

          return vk;
        }
      }

      this.pendingViewingKeyRequests.delete(tokenAddress);
      console.log(`❌ BalanceService: Failed to get viewing key for ${tokenAddress}`);
      return null;
    } catch (e) {
      this.pendingViewingKeyRequests.delete(tokenAddress);
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.log(
        `❌ BalanceService: Error getting viewing key for ${tokenAddress}:`,
        errorMessage
      );

      if (errorMessage.includes('Request rejected') || errorMessage.includes('denied')) {
        console.log(`📢 BalanceService: Showing viewing key rejected toast`);
        toastManager.viewingKeyRejected(() => {
          // Retry callback - clear any cached state and try again
          console.log(`🔄 BalanceService: Retrying viewing key request for ${tokenAddress}`);
          this.viewingKeys.delete(tokenAddress);
          this.requestBalanceFetch(tokenAddress);
        });
      } else {
        console.error(`Failed to get viewing key for ${tokenAddress}:`, e);
      }

      throw e;
    }
  }
}

export const balanceService = new BalanceService();
