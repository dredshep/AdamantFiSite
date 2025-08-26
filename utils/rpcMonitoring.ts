/**
 * RPC Monitoring Utilities
 *
 * Provides utilities to monitor and manage RPC rate limiting status.
 * This helps prevent 429 errors from Ankr RPC endpoints.
 */

import { TokenService } from '@/services/secret/TokenService';

export interface RpcStatus {
  isRateLimited: boolean;
  remainingCooldownTime: number;
  consecutiveErrors: number;
  canMakeRequest: boolean;
}

/**
 * Get current RPC status
 */
export function getRpcStatus(): RpcStatus {
  return {
    isRateLimited: TokenService.isCurrentlyRateLimited(),
    remainingCooldownTime: TokenService.getRemainingCooldownTime(),
    consecutiveErrors: TokenService.getConsecutiveErrors(),
    canMakeRequest: !TokenService.isCurrentlyRateLimited(),
  };
}

/**
 * Reset the circuit breaker (for testing/recovery)
 */
export function resetRpcCircuitBreaker(): void {
  TokenService.resetCircuitBreaker();
  console.log('RPC circuit breaker has been manually reset');
}

/**
 * Log current RPC status to console (for debugging)
 */
export function logRpcStatus(): void {
  const status = getRpcStatus();
  console.log('🔍 RPC Status:', {
    isRateLimited: status.isRateLimited,
    remainingCooldownTime: status.remainingCooldownTime,
    consecutiveErrors: status.consecutiveErrors,
    canMakeRequest: status.canMakeRequest,
  });
}

/**
 * Wait for RPC to become available
 * @param maxWaitTime Maximum time to wait in milliseconds (default: 5 minutes)
 * @returns Promise that resolves when RPC is available or rejects if timeout
 */
export function waitForRpcAvailable(maxWaitTime: number = 300000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkStatus = () => {
      const status = getRpcStatus();

      if (status.canMakeRequest) {
        resolve();
        return;
      }

      if (Date.now() - startTime > maxWaitTime) {
        reject(new Error(`RPC still rate limited after ${maxWaitTime}ms`));
        return;
      }

      // Check again in 1 second
      setTimeout(checkStatus, 1000);
    };

    checkStatus();
  });
}

// Define interface for window extension
interface WindowWithRpcMonitoring extends Window {
  rpcMonitoring?: {
    getRpcStatus: typeof getRpcStatus;
    resetRpcCircuitBreaker: typeof resetRpcCircuitBreaker;
    logRpcStatus: typeof logRpcStatus;
    waitForRpcAvailable: typeof waitForRpcAvailable;
  };
}

// Make utilities available on window for debugging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as WindowWithRpcMonitoring).rpcMonitoring = {
    getRpcStatus,
    resetRpcCircuitBreaker,
    logRpcStatus,
    waitForRpcAvailable,
  };
}
