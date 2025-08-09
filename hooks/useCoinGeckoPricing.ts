import { coingeckoService, TokenPriceInfo } from '@/services/pricing/coingeckoService';
import { isPricingEnabled } from '@/utils/features';
import { useEffect, useState } from 'react';

export interface TokenPricing {
  [tokenSymbol: string]: TokenPriceInfo | null;
}

export interface UseCoinGeckoPricingReturn {
  pricing: TokenPricing;
  loading: boolean;
  error: string | null;
  refreshPricing: () => void;
  getPriceForSymbol: (symbol: string) => TokenPriceInfo | null;
}

/**
 * Hook to fetch and manage CoinGecko pricing data for tokens
 * @param coingeckoIds - Array of CoinGecko IDs to fetch prices for
 * @param tokenSymbols - Array of token symbols corresponding to the IDs
 * @param autoFetch - Whether to automatically fetch prices on mount (default: true)
 * @param refreshInterval - Interval in ms to auto-refresh prices (default: 60000 = 1 minute)
 */
export const useCoinGeckoPricing = (
  coingeckoIds: string[],
  tokenSymbols: string[],
  autoFetch = true,
  refreshInterval = 60000
): UseCoinGeckoPricingReturn => {
  const [pricing, setPricing] = useState<TokenPricing>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate that coingeckoIds and tokenSymbols arrays have the same length
  if (coingeckoIds.length !== tokenSymbols.length) {
    throw new Error('coingeckoIds and tokenSymbols arrays must have the same length');
  }

  const fetchPricing = async () => {
    // If pricing is disabled, don't fetch anything
    if (!isPricingEnabled()) {
      setLoading(false);
      setError(null);
      setPricing({});
      return;
    }

    if (coingeckoIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Filter out any invalid IDs
      const validIds = coingeckoIds.filter((id) => id && id.trim() !== '');
      const validSymbols = tokenSymbols.filter((_, index) => {
        const id = coingeckoIds[index];
        return id && id.trim() !== '';
      });

      if (validIds.length === 0) {
        setLoading(false);
        return;
      }

      const priceData = await coingeckoService.getMultipleTokenPrices(validIds);

      // Map the price data back to token symbols
      const symbolPricing: TokenPricing = {};
      validIds.forEach((coingeckoId, index) => {
        const symbol = validSymbols[index];
        if (symbol) {
          symbolPricing[symbol] = priceData[coingeckoId] || null;
        }
      });

      setPricing(symbolPricing);
    } catch (err) {
      console.error('Error fetching token pricing:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pricing data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchPricing();
    }
  }, [autoFetch, JSON.stringify(coingeckoIds), JSON.stringify(tokenSymbols)]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!autoFetch || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchPricing();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoFetch, refreshInterval, JSON.stringify(coingeckoIds)]);

  const refreshPricing = () => {
    fetchPricing();
  };

  const getPriceForSymbol = (symbol: string): TokenPriceInfo | null => {
    return pricing[symbol] || null;
  };

  return {
    pricing,
    loading,
    error,
    refreshPricing,
    getPriceForSymbol,
  };
};

/**
 * Hook to fetch pricing for a single token
 */
export const useSingleTokenPricing = (
  coingeckoId: string,
  tokenSymbol: string,
  autoFetch = true,
  refreshInterval = 60000
): UseCoinGeckoPricingReturn => {
  return useCoinGeckoPricing([coingeckoId], [tokenSymbol], autoFetch, refreshInterval);
};

/**
 * Helper hook that fetches pricing for all configured tokens
 */
export const useAllTokensPricing = (
  tokens: { symbol: string; coingeckoId?: string }[],
  autoFetch = true,
  refreshInterval = 60000
): UseCoinGeckoPricingReturn => {
  // Filter tokens that have CoinGecko IDs
  const validTokens = tokens.filter((token) => token.coingeckoId);

  const coingeckoIds = validTokens.map((token) => token.coingeckoId!);
  const tokenSymbols = validTokens.map((token) => token.symbol);

  return useCoinGeckoPricing(coingeckoIds, tokenSymbols, autoFetch, refreshInterval);
};
