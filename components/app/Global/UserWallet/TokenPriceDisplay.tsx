import { useSingleTokenPricing } from '@/hooks/useCoinGeckoPricing';
import { isPricingEnabled } from '@/utils/features';
import React from 'react';

interface TokenPriceDisplayProps {
  coingeckoId?: string | undefined;
  className?: string;
}

const TokenPriceDisplay: React.FC<TokenPriceDisplayProps> = ({ coingeckoId, className = '' }) => {
  // If pricing is disabled, don't render anything
  if (!isPricingEnabled()) {
    return null;
  }

  const { getPriceForSymbol, loading, error } = useSingleTokenPricing(
    coingeckoId || '',
    'temp-symbol',
    !!coingeckoId, // Only auto-fetch if we have a coingeckoId
    120000 // 2 minute refresh
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

  const priceInfo = getPriceForSymbol('temp-symbol');

  if (!priceInfo) {
    return <span className={`text-sm text-gray-400 ${className}`}>No price</span>;
  }

  const formatPrice = (price: number): string => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(2)}`;
    }
  };

  const formatChange = (change?: number): string => {
    if (!change) return '';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getChangeColor = (change?: number): string => {
    if (!change) return 'text-gray-400';
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className={`flex flex-col items-end ${className}`}>
      <span className="text-sm font-medium text-white">{formatPrice(priceInfo.price)}</span>
      {priceInfo.change24h !== undefined && (
        <span className={`text-xs ${getChangeColor(priceInfo.change24h)}`}>
          {formatChange(priceInfo.change24h)}
        </span>
      )}
    </div>
  );
};

export default TokenPriceDisplay;
