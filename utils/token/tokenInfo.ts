import { TOKENS } from '@/config/tokens';
import { SecretString } from '@/types';

/**
 * Get token decimals from configuration
 * @param tokenAddress The token address
 * @returns The token decimals or 6 as default
 */
export function getTokenDecimals(tokenAddress: SecretString): number {
  const token = TOKENS.find((token) => token.address === tokenAddress);

  if (token && typeof token.decimals === 'number') {
    return token.decimals;
  }

  // Default decimals for SNIP-20 tokens
  return 6;
}

/**
 * Get token symbol from configuration
 * @param tokenAddress The token address
 * @returns The token symbol or a shortened address if not found
 */
export function getTokenSymbol(tokenAddress: SecretString): string {
  const token = TOKENS.find((token) => token.address === tokenAddress);

  if (token && token.symbol) {
    return token.symbol;
  }

  // Return shortened address if token not found
  return tokenAddress.slice(0, 6) + '...' + tokenAddress.slice(-4);
}

/**
 * Get token name from configuration
 * @param tokenAddress The token address
 * @returns The token name or a shortened address if not found
 */
export function getTokenName(tokenAddress: SecretString): string {
  const token = TOKENS.find((token) => token.address === tokenAddress);

  if (token && token.name) {
    return token.name;
  }

  // Return shortened address if token not found
  return tokenAddress.slice(0, 6) + '...' + tokenAddress.slice(-4);
}
