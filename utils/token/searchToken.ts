import { ConfigToken } from '@/config/tokens';

/**
 * Search tokens by symbol, name, or address
 * @param searchTerm Search term to filter tokens
 * @param tokens Array of tokens to search through
 * @returns Filtered array of tokens matching the search term
 */
export function searchToken(searchTerm: string, tokens: ConfigToken[]): ConfigToken[] {
  if (!searchTerm) return tokens;

  return tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
}
