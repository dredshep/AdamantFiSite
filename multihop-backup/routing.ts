import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { SecretString } from '@/types';

// Multihop routing types
export type SwapHop = {
  fromToken: SecretString;
  toToken: SecretString;
  pairContract: SecretString;
  pairSymbol: string;
};

export type MultihopPath = {
  fromToken: SecretString;
  toToken: SecretString;
  hops: SwapHop[];
  totalHops: number;
  isDirectPath: boolean;
};

// Multihop path finder
export function findMultihopPath(
  fromTokenAddress: SecretString,
  toTokenAddress: SecretString
): MultihopPath | null {
  // If tokens are the same, return null (no swap needed)
  if (fromTokenAddress === toTokenAddress) {
    return null;
  }

  // Get token symbols for easier lookup
  const fromToken = TOKENS.find((t) => t.address === fromTokenAddress);
  const toToken = TOKENS.find((t) => t.address === toTokenAddress);

  if (!fromToken || !toToken) {
    return null;
  }

  // Check for direct pair first
  const directPair = LIQUIDITY_PAIRS.find(
    (pair) =>
      (pair.token0 === fromToken.symbol && pair.token1 === toToken.symbol) ||
      (pair.token0 === toToken.symbol && pair.token1 === fromToken.symbol)
  );

  if (directPair) {
    return {
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      hops: [
        {
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          pairContract: directPair.pairContract,
          pairSymbol: directPair.symbol,
        },
      ],
      totalHops: 1,
      isDirectPath: true,
    };
  }

  // For now, use sSCRT as the intermediate token for multihop
  const sSCRTToken = TOKENS.find((t) => t.symbol === 'sSCRT');
  if (!sSCRTToken) {
    return null;
  }

  // Skip if one of the tokens is already sSCRT (would create redundant hop)
  if (fromToken.symbol === 'sSCRT' || toToken.symbol === 'sSCRT') {
    return null;
  }

  // Find pair from fromToken to sSCRT
  const fromToSSCRTPair = LIQUIDITY_PAIRS.find(
    (pair) =>
      (pair.token0 === fromToken.symbol && pair.token1 === 'sSCRT') ||
      (pair.token0 === 'sSCRT' && pair.token1 === fromToken.symbol)
  );

  // Find pair from sSCRT to toToken
  const sSCRTToToPair = LIQUIDITY_PAIRS.find(
    (pair) =>
      (pair.token0 === 'sSCRT' && pair.token1 === toToken.symbol) ||
      (pair.token0 === toToken.symbol && pair.token1 === 'sSCRT')
  );

  if (!fromToSSCRTPair || !sSCRTToToPair) {
    return null;
  }

  return {
    fromToken: fromTokenAddress,
    toToken: toTokenAddress,
    hops: [
      {
        fromToken: fromTokenAddress,
        toToken: sSCRTToken.address,
        pairContract: fromToSSCRTPair.pairContract,
        pairSymbol: fromToSSCRTPair.symbol,
      },
      {
        fromToken: sSCRTToken.address,
        toToken: toTokenAddress,
        pairContract: sSCRTToToPair.pairContract,
        pairSymbol: sSCRTToToPair.symbol,
      },
    ],
    totalHops: 2,
    isDirectPath: false,
  };
}

// Helper function to get all possible tokens that can be reached from a given token
export function getReachableTokens(fromTokenAddress: SecretString): SecretString[] {
  const fromToken = TOKENS.find((t) => t.address === fromTokenAddress);
  if (!fromToken) return [];

  const reachableTokens: SecretString[] = [];

  // Find all direct pairs
  LIQUIDITY_PAIRS.forEach((pair) => {
    if (pair.token0 === fromToken.symbol) {
      const toToken = TOKENS.find((t) => t.symbol === pair.token1);
      if (toToken) reachableTokens.push(toToken.address);
    } else if (pair.token1 === fromToken.symbol) {
      const toToken = TOKENS.find((t) => t.symbol === pair.token0);
      if (toToken) reachableTokens.push(toToken.address);
    }
  });

  return reachableTokens;
}

// Helper function to check if a direct swap is possible between two tokens
export function hasDirectPath(
  fromTokenAddress: SecretString,
  toTokenAddress: SecretString
): boolean {
  const path = findMultihopPath(fromTokenAddress, toTokenAddress);
  return path?.isDirectPath ?? false;
}

// Helper function to get the number of hops required for a swap
export function getSwapHopCount(
  fromTokenAddress: SecretString,
  toTokenAddress: SecretString
): number {
  const path = findMultihopPath(fromTokenAddress, toTokenAddress);
  return path?.totalHops ?? 0;
}
