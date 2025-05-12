import { TOKENS } from '@/config/tokens';
import { SecretString } from '@/types';

/**
 * Get the code hash for a token by its address
 * @param address The token address
 * @returns The code hash for the token or null if not found
 */
export function getCodeHashByAddress(address: SecretString): string | null {
  // Find the token in the configuration
  const token = TOKENS.find((token) => token.address === address);

  if (token) {
    return token.codeHash;
  }

  // Return null if token not found
  return null;
}
