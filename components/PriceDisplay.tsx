import { useSingleTokenPricing } from '@/hooks/useCoinGeckoPricing';
import { isPricingEnabled } from '@/utils/features';

interface PriceDisplayProps {
  symbol: 'SCRT' | 'SEFI' | 'ETH' | 'ATOM' | 'USDC';
  amount?: number | string;
  className?: string;
}

// Map symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  SCRT: 'secret',
  SEFI: 'secret', // SEFI might not have its own CoinGecko ID, using SCRT as fallback
  ETH: 'ethereum',
  ATOM: 'cosmos',
  USDC: 'usd-coin',
};

export const PriceDisplay = ({ symbol, amount = 1, className = '' }: PriceDisplayProps) => {
  // If pricing is disabled, don't render anything
  if (!isPricingEnabled()) {
    return null;
  }

  const coingeckoId = SYMBOL_TO_COINGECKO_ID[symbol];
  
  // If we don't have a coingeckoId for this symbol, return null
  if (!coingeckoId) {
    return null;
  }

  const { getPriceForSymbol, loading, error } = useSingleTokenPricing(
    coingeckoId,
    symbol,
    true, // autoFetch
    300000 // 5 minute refresh to match server cache
  );

  const priceInfo = getPriceForSymbol(symbol);

  if (error) {
    return <span className={`${className} text-red-500`}>Price unavailable</span>;
  }

  if (loading || !priceInfo) {
    return <span className={`${className} text-gray-400`}>Loading...</span>;
  }

  const value = (parseFloat(amount.toString()) * priceInfo.price).toFixed(2);
  return <span className={`${className} text-gray-600`}>${value}</span>;
};

// Default styling
PriceDisplay.defaultProps = {
  className: 'text-sm font-medium',
};
