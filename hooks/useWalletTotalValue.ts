import { TOKENS } from '@/config/tokens';
import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { isPricingEnabled } from '@/utils/features';
import { useEffect, useState } from 'react';
import { useAllTokensPricing } from './useCoinGeckoPricing';
import { useNativeSCRTBalance } from './useNativeSCRTBalance';

export interface WalletTotalValue {
  totalUSD: number;
  change24hUSD: number;
  change24hPercent: number;
  loading: boolean;
  error: string | null;
}

interface TokenBalanceState {
  balance: string;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  needsViewingKey: boolean;
}

interface TokenPriceInfo {
  price: number;
  change24h: number;
  lastUpdated: number;
}

interface TokenCalculations {
  balanceNumber: number;
  currentPrice: number;
  change24hPercent: number;
  tokenValueUSD: number;
  previousPrice: number;
  previousTokenValueUSD: number;
  contributsToTotal: true;
}

interface TokenCalculationsError {
  reason: string;
  balanceNumber?: number;
  contributsToTotal: false;
}

interface TokenDetail {
  symbol: string;
  address: string;
  coingeckoId: string | undefined;
  balance: string;
  balanceState: TokenBalanceState | 'No balance state';
  priceInfo: TokenPriceInfo | 'No price info';
  calculations: TokenCalculations | TokenCalculationsError;
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

  // Get native SCRT balance
  const {
    balance: nativeScrtBalance,
    loading: nativeScrtLoading,
    error: nativeScrtError,
  } = useNativeSCRTBalance();

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

      // Collect detailed token information for logging
      const tokenDetails: TokenDetail[] = [];

      // First, add native SCRT to the calculation
      const nativeScrtPriceInfo = pricing['sSCRT']; // Use sSCRT price for native SCRT
      if (nativeScrtBalance && nativeScrtPriceInfo && nativeScrtBalance !== '0') {
        const balance = parseFloat(nativeScrtBalance);
        const currentPrice = nativeScrtPriceInfo.price;
        const change24hPercent = nativeScrtPriceInfo.change24h || 0;

        if (!isNaN(balance) && balance > 0) {
          const tokenValueUSD = balance * currentPrice;
          const previousPrice = currentPrice / (1 + change24hPercent / 100);
          const previousTokenValueUSD = balance * previousPrice;

          totalUSD += tokenValueUSD;
          totalPreviousValue += previousTokenValueUSD;

          tokenDetails.push({
            symbol: 'SCRT (native)',
            address: 'uscrt',
            coingeckoId: 'secret',
            balance: nativeScrtBalance,
            balanceState: {
              balance: nativeScrtBalance,
              loading: nativeScrtLoading,
              error: nativeScrtError,
              lastUpdated: Date.now(),
              needsViewingKey: false,
            },
            priceInfo: {
              price: nativeScrtPriceInfo.price,
              change24h: nativeScrtPriceInfo.change24h || 0,
              lastUpdated: nativeScrtPriceInfo.lastUpdated,
            },
            calculations: {
              balanceNumber: balance,
              currentPrice,
              change24hPercent,
              tokenValueUSD,
              previousPrice,
              previousTokenValueUSD,
              contributsToTotal: true,
            },
          });
        } else {
          tokenDetails.push({
            symbol: 'SCRT (native)',
            address: 'uscrt',
            coingeckoId: 'secret',
            balance: nativeScrtBalance,
            balanceState: {
              balance: nativeScrtBalance,
              loading: nativeScrtLoading,
              error: nativeScrtError,
              lastUpdated: Date.now(),
              needsViewingKey: false,
            },
            priceInfo: {
              price: nativeScrtPriceInfo.price,
              change24h: nativeScrtPriceInfo.change24h || 0,
              lastUpdated: nativeScrtPriceInfo.lastUpdated,
            },
            calculations: {
              reason: 'Balance is NaN or <= 0',
              balanceNumber: balance,
              contributsToTotal: false,
            },
          });
        }
      } else {
        tokenDetails.push({
          symbol: 'SCRT (native)',
          address: 'uscrt',
          coingeckoId: 'secret',
          balance: nativeScrtBalance || '0',
          balanceState: {
            balance: nativeScrtBalance || '0',
            loading: nativeScrtLoading,
            error: nativeScrtError,
            lastUpdated: Date.now(),
            needsViewingKey: false,
          },
          priceInfo: nativeScrtPriceInfo
            ? {
                price: nativeScrtPriceInfo.price,
                change24h: nativeScrtPriceInfo.change24h || 0,
                lastUpdated: nativeScrtPriceInfo.lastUpdated,
              }
            : 'No price info',
          calculations: {
            reason: 'Missing native SCRT balance or price info',
            contributsToTotal: false,
          },
        });
      }

      // Then process all other tokens
      tokens.forEach((token) => {
        const balanceState = allBalances[token.address];
        const priceInfo = pricing[token.symbol];

        // Log every token, even if it has no balance or price
        const tokenDetail: TokenDetail = {
          symbol: token.symbol,
          address: token.address,
          coingeckoId: token.coingeckoId,
          balance: balanceState?.balance || 'No balance',
          balanceState: balanceState
            ? {
                balance: balanceState.balance,
                loading: balanceState.loading,
                error: balanceState.error,
                lastUpdated: balanceState.lastUpdated,
                needsViewingKey: balanceState.needsViewingKey,
              }
            : 'No balance state',
          priceInfo: priceInfo
            ? {
                price: priceInfo.price,
                change24h: priceInfo.change24h || 0,
                lastUpdated: priceInfo.lastUpdated,
              }
            : 'No price info',
          calculations: {
            reason: 'Initial placeholder',
            contributsToTotal: false,
          },
        };

        if (balanceState?.balance && priceInfo && balanceState.balance !== '-') {
          const balance = parseFloat(balanceState.balance);
          const currentPrice = priceInfo.price;
          const change24hPercent = priceInfo.change24h || 0;

          // Debug logging removed to reduce console spam

          if (!isNaN(balance) && balance > 0) {
            const tokenValueUSD = balance * currentPrice;
            const previousPrice = currentPrice / (1 + change24hPercent / 100);
            const previousTokenValueUSD = balance * previousPrice;

            // Calculation debug logging removed to reduce console spam

            tokenDetail.calculations = {
              balanceNumber: balance,
              currentPrice,
              change24hPercent,
              tokenValueUSD,
              previousPrice,
              previousTokenValueUSD,
              contributsToTotal: true,
            };

            totalUSD += tokenValueUSD;
            totalPreviousValue += previousTokenValueUSD;
          } else {
            tokenDetail.calculations = {
              balanceNumber: balance,
              reason: 'Balance is NaN or <= 0',
              contributsToTotal: false,
            };
          }
        } else {
          tokenDetail.calculations = {
            reason: 'Missing balance state, price info, or balance is "-"',
            contributsToTotal: false,
          };
        }

        tokenDetails.push(tokenDetail);
      });

      // Wallet total value calculation logging removed to reduce console spam

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
  }, [
    allBalances,
    pricing,
    pricingLoading,
    pricingError,
    nativeScrtBalance,
    nativeScrtLoading,
    nativeScrtError,
  ]);

  return totalValue;
};
