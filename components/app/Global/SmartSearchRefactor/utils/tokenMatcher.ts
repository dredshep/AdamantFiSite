import { ConfigToken, TOKENS } from '@/config/tokens';
import { ACTION_KEYWORDS, ActionType } from '../constants/actionKeywords';

/**
 * Find token by text input with fuzzy matching
 * Extracted from original SmartSearchBox findTokenByText function
 * FIXED: Less aggressive matching for very short inputs
 */
export function findTokenByText(text: string): ConfigToken | null {
  const normalized = text.toLowerCase().replace(/[^a-z0-9.]/g, '');

  // Don't match very short inputs (1-2 characters) unless it's an exact match
  if (normalized.length <= 2) {
    // Only exact symbol match for very short inputs
    const exactMatch = TOKENS.find((token) => token.symbol.toLowerCase() === normalized);
    if (exactMatch) return exactMatch;

    // Check special mappings for short inputs
    const specialMappings: Record<string, string> = {
      secret: 'sSCRT',
      scrt: 'sSCRT',
      atom: 'sATOM',
      eth: 'ETH.axl',
      ethereum: 'ETH.axl',
      usdc: 'USDC.nbl',
      dollar: 'USDC.nbl',
      usd: 'USDC.nbl',
      silk: 'SILK',
      stable: 'SILK',
      jackal: 'JKL',
      jkl: 'JKL',
      adamant: 'bADMT',
      badmt: 'bADMT',
    };

    const mappedSymbol = specialMappings[normalized];
    if (mappedSymbol) {
      return TOKENS.find((token) => token.symbol === mappedSymbol) || null;
    }

    // Don't match partial inputs that are too short
    return null;
  }

  // For longer inputs (3+ characters), use the original fuzzy matching

  // Exact symbol match (highest priority)
  const exactMatch = TOKENS.find((token) => token.symbol.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;

  // Partial symbol match
  const symbolMatch = TOKENS.find(
    (token) =>
      token.symbol.toLowerCase().includes(normalized) ||
      normalized.includes(token.symbol.toLowerCase())
  );
  if (symbolMatch) return symbolMatch;

  // Name match
  const nameMatch = TOKENS.find(
    (token) =>
      token.name?.toLowerCase().includes(normalized) ||
      (token.name && normalized.includes(token.name.toLowerCase().split(' ')[0]!))
  );
  if (nameMatch) return nameMatch;

  // Special mappings for common terms (already checked above for short inputs)
  const specialMappings: Record<string, string> = {
    secret: 'sSCRT',
    scrt: 'sSCRT',
    atom: 'sATOM',
    eth: 'ETH.axl',
    ethereum: 'ETH.axl',
    usdc: 'USDC.nbl',
    dollar: 'USDC.nbl',
    usd: 'USDC.nbl',
    silk: 'SILK',
    stable: 'SILK',
    jackal: 'JKL',
    jkl: 'JKL',
    adamant: 'bADMT',
    badmt: 'bADMT',
  };

  const mappedSymbol = specialMappings[normalized];
  if (mappedSymbol) {
    return TOKENS.find((token) => token.symbol === mappedSymbol) || null;
  }

  return null;
}

/**
 * Detect action from query
 * Extracted from original SmartSearchBox detectAction function
 */
export function detectAction(query: string): ActionType | null {
  const normalized = query.toLowerCase().trim();

  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.startsWith(keyword + ' ') || normalized === keyword) {
        return action as ActionType;
      }
    }
  }
  return null;
}
