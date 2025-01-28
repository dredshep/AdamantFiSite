import { useEffect, useState } from 'react';

interface PriceDisplayProps {
  symbol: 'SCRT' | 'SEFI' | 'ETH' | 'ATOM' | 'USDC';
  amount?: number | string;
  className?: string;
}

interface PriceData {
  SCRT: number;
  SEFI: number;
  ETH: number;
  ATOM: number;
  USDC: number;
}

export const PriceDisplay = ({ symbol, amount = 1, className = '' }: PriceDisplayProps) => {
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/prices');
        const data = (await response.json()) as PriceData;
        const priceValue = data[symbol];
        if (typeof priceValue === 'number') {
          setPrice(priceValue);
        } else {
          setError('Invalid price data');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load price';
        setError(errorMessage);
      }
    };

    // Initial fetch
    void fetchPrice();

    // Update every 5 minutes
    const interval = setInterval(() => {
      void fetchPrice();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (error !== null && error !== '') {
    return <span className={`${className} text-red-500`}>Price unavailable</span>;
  }

  if (price === null) {
    return <span className={`${className} text-gray-400`}>Loading...</span>;
  }

  const value = (parseFloat(amount.toString()) * price).toFixed(2);
  return <span className={`${className} text-gray-600`}>${value}</span>;
};

// Default styling
PriceDisplay.defaultProps = {
  className: 'text-sm font-medium',
};
