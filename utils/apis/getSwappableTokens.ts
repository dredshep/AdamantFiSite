import { ConfigToken } from '@/config/tokens';
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
 * Get swappable tokens
 * @returns Empty array for now (to be populated from config)
 */
export function getSwappableTokens(): ConfigToken[] {
  return [];
}
