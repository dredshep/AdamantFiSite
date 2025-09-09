import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { SecretString } from '@/types';
import { TokenBalanceError, useTokenBalance } from './useTokenBalance';

// Keep the error enum for backward compatibility
export enum LpTokenBalanceError {
  NO_KEPLR = 'NO_KEPLR',
  NO_VIEWING_KEY = 'NO_VIEWING_KEY',
  VIEWING_KEY_REJECTED = 'VIEWING_KEY_REJECTED',
  NO_SECRET_JS = 'NO_SECRET_JS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  LP_TOKEN_NOT_FOUND = 'LP_TOKEN_NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Helper function to convert TokenBalanceError to LpTokenBalanceError
function mapTokenErrorToLpError(tokenError: TokenBalanceError | null): LpTokenBalanceError | null {
  if (!tokenError) return null;

  switch (tokenError) {
    case TokenBalanceError.NO_KEPLR:
      return LpTokenBalanceError.NO_KEPLR;
    case TokenBalanceError.NO_VIEWING_KEY:
      return LpTokenBalanceError.NO_VIEWING_KEY;
    case TokenBalanceError.VIEWING_KEY_INVALID:
    case TokenBalanceError.VIEWING_KEY_REJECTED:
      return LpTokenBalanceError.VIEWING_KEY_REJECTED;
    case TokenBalanceError.NO_SECRET_JS:
      return LpTokenBalanceError.NO_SECRET_JS;
    case TokenBalanceError.NETWORK_ERROR:
      return LpTokenBalanceError.NETWORK_ERROR;
    case TokenBalanceError.UNKNOWN_ERROR:
    default:
      return LpTokenBalanceError.UNKNOWN_ERROR;
  }
}

interface LpTokenBalanceHookReturn {
  amount: string | null;
  balance: string;
  loading: boolean;
  error: LpTokenBalanceError | null;
  needsViewingKey: boolean;
  refetch: () => void;
  suggestToken: () => void;
  retryWithViewingKey: () => void;
}

/**
 * Hook for LP token balances - uses the centralized balance fetcher
 * This is just a wrapper around useTokenBalance for LP tokens
 */
export function useLpTokenBalance(
  poolOrLpTokenAddress: SecretString | undefined,
  autoFetch = true
): LpTokenBalanceHookReturn {
  // Check if the address is a pool address or LP token address
  const lpTokenFromPool = LIQUIDITY_PAIRS.find(
    (pair) => pair.pairContract === poolOrLpTokenAddress
  )?.lpToken;
  const lpTokenFromToken = LIQUIDITY_PAIRS.find(
    (pair) => pair.lpToken === poolOrLpTokenAddress
  )?.lpToken;

  // Use the appropriate LP token address
  const lpTokenAddress = lpTokenFromPool || lpTokenFromToken;

  const tokenBalance = useTokenBalance(
    lpTokenAddress,
    `useLpTokenBalance:${poolOrLpTokenAddress?.slice(-6) ?? 'unknown'}`,
    autoFetch
  );

  return {
    ...tokenBalance,
    error: mapTokenErrorToLpError(tokenBalance.error),
  };
}
