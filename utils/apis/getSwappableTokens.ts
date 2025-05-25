import { ConfigToken, LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { SecretString } from '@/types';
import { TokenInfo } from '@/types/api/Factory';

/**
 * Get token symbol from a token object
 * @param token ConfigToken or TokenInfo
 * @returns The token symbol
 */
export function getTokenSymbol(token: ConfigToken | TokenInfo): string {
  if ('symbol' in token) {
    // It's a ConfigToken
    return token.symbol;
  } else {
    // It's a TokenInfo or unknown type
    return token.contract_addr.slice(0, 6) + '...' + token.contract_addr.slice(-4);
  }
}

/**
 * Get token from address
 * @param tokens List of ConfigTokens
 * @param address Token address
 * @returns The token or undefined
 */
export function getTokenFromAddress(
  tokens: ConfigToken[],
  address: SecretString
): ConfigToken | undefined {
  return tokens.find((token) => token.address === address);
}

/**
 * Get all unique token symbols that have liquidity pairs
 * @returns Array of token symbols that can be swapped
 */
export function getSwappableTokenSymbols(): string[] {
  const tokenSymbols = new Set<string>();

  LIQUIDITY_PAIRS.forEach((pair) => {
    tokenSymbols.add(pair.token0);
    tokenSymbols.add(pair.token1);
  });

  return Array.from(tokenSymbols);
}

/**
 * Get swappable tokens - only tokens that have liquidity pairs
 * @returns Array of ConfigTokens that can be swapped
 */
export function getSwappableTokens(): ConfigToken[] {
  const swappableSymbols = getSwappableTokenSymbols();
  return TOKENS.filter((token) => swappableSymbols.includes(token.symbol));
}

/**
 * Get tokens that can be swapped with a given token
 * @param tokenSymbol The symbol of the token to find pairs for
 * @returns Array of ConfigTokens that can be swapped with the given token
 */
export function getSwappableTokensForToken(tokenSymbol: string): ConfigToken[] {
  const compatibleSymbols = new Set<string>();

  LIQUIDITY_PAIRS.forEach((pair) => {
    if (pair.token0 === tokenSymbol) {
      compatibleSymbols.add(pair.token1);
    } else if (pair.token1 === tokenSymbol) {
      compatibleSymbols.add(pair.token0);
    }
  });

  return TOKENS.filter((token) => compatibleSymbols.has(token.symbol));
}
