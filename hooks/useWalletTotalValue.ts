import { TOKENS } from '@/config/tokens';
import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { isPricingEnabled } from '@/utils/features';
import { useEffect, useState } from 'react';
import { useAllTokensPricing } from './useCoinGeckoPricing';

export interface WalletTotalValue {
  totalUSD: number;
  change24hUSD: number;
  change24hPercent: number;
  loading: boolean;
  error: string | null;
}

export const useWalletTotalValue = (): WalletTotalValue => {
  // If pricing is disabled, return disabled state immediately
  if (!isPricingEnabled()) {
    return {
      totalUSD: 0,
      change24hUSD: 0,
      change24hPercent: 0,
      loading: false,
      error: null,
    };
  }

  // FIX: Subscribe to stable store state directly (following Safe Harbor pattern)
  const allBalances = useBalanceFetcherStore((state) => state.balances);

  const [totalValue, setTotalValue] = useState<WalletTotalValue>({
    totalUSD: 0,
    change24hUSD: 0,
    change24hPercent: 0,
    loading: false,
    error: null,
  });

  // FIX: Use TOKENS directly to avoid unstable function calls
  const tokens = TOKENS;
  const { pricing, loading: pricingLoading, error: pricingError } = useAllTokensPricing(tokens);

  useEffect(() => {
    const calculateTotalValue = () => {
      let totalUSD = 0;
      let totalChange24hUSD = 0;
      let totalPreviousValue = 0;

      tokens.forEach((token) => {
        const balanceState = allBalances[token.address];
        const priceInfo = pricing[token.symbol];

        if (balanceState?.balance && priceInfo && balanceState.balance !== '-') {
          const balance = parseFloat(balanceState.balance);
          const currentPrice = priceInfo.price;
          const change24hPercent = priceInfo.change24h || 0;

          if (!isNaN(balance) && balance > 0) {
            const tokenValueUSD = balance * currentPrice;
            const previousPrice = currentPrice / (1 + change24hPercent / 100);
            const previousTokenValueUSD = balance * previousPrice;

            totalUSD += tokenValueUSD;
            totalPreviousValue += previousTokenValueUSD;
          }
        }
      });

      totalChange24hUSD = totalUSD - totalPreviousValue;
      const change24hPercent =
        totalPreviousValue > 0 ? (totalChange24hUSD / totalPreviousValue) * 100 : 0;

      setTotalValue({
        totalUSD,
        change24hUSD: totalChange24hUSD,
        change24hPercent,
        loading: pricingLoading,
        error: pricingError,
      });
    };

    calculateTotalValue();
  }, [allBalances, pricing, pricingLoading, pricingError]);

  return totalValue;
};
