import { useSingleTokenPricing } from '@/hooks/useCoinGeckoPricing';
import { DEFAULT_BALANCE_STATE, useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { SecretString } from '@/types';
import { isPricingEnabled } from '@/utils/features';
import React from 'react';

interface TokenPriceDisplayProps {
  coingeckoId?: string | undefined;
  tokenAddress?: SecretString;
  tokenSymbol?: string;
  className?: string;
}

const TokenPriceDisplay: React.FC<TokenPriceDisplayProps> = ({
  coingeckoId,
  tokenAddress,
  tokenSymbol = 'temp-symbol',
  className = '',
}) => {
  // If pricing is disabled, don't render anything
  if (!isPricingEnabled()) {
    return null;
  }

  const { getPriceForSymbol, loading, error } = useSingleTokenPricing(
    coingeckoId || '',
    tokenSymbol,
    !!coingeckoId, // Only auto-fetch if we have a coingeckoId
    300000 // 5 minute refresh to match server cache
  );

  const balanceState = useBalanceFetcherStore(
    (state) => (tokenAddress ? state.balances[tokenAddress] : undefined) ?? DEFAULT_BALANCE_STATE
  );

  if (!coingeckoId) {
    return <span className={`text-sm text-gray-400 ${className}`}>No price data</span>;
  }

  if (loading) {
    return <span className={`text-sm text-gray-400 ${className}`}>Loading...</span>;
  }

  if (error) {
    return <span className={`text-sm text-red-400 ${className}`}>Error</span>;
  }

  const priceInfo = getPriceForSymbol(tokenSymbol);

  if (!priceInfo) {
    return <span className={`text-sm text-gray-400 ${className}`}>No price</span>;
  }

  // Intentionally omit unit price rendering to avoid confusing users; display balance-tied USD

  const formatChange = (change?: number): string => {
    if (!change) return '';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getChangeColor = (change?: number): string => {
    if (!change) return 'text-gray-400';
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const balanceNum = balanceState.balance !== '-' ? parseFloat(balanceState.balance) : 0;
  const hasBalance = !isNaN(balanceNum) && balanceNum > 0;
  const usdValue = hasBalance ? balanceNum * priceInfo.price : 0;

  return (
    <div className={`flex flex-col items-end ${className}`}>
      <span className="text-sm font-medium text-white">
        {hasBalance ? `$${usdValue.toFixed(2)}` : '—'}
      </span>
      {priceInfo.change24h !== undefined && (
        <span className={`text-xs ${getChangeColor(priceInfo.change24h)}`}>
          {formatChange(priceInfo.change24h)}
        </span>
      )}
    </div>
  );
};

export default TokenPriceDisplay;
