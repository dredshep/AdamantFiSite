import { isPricingEnabled } from '@/utils/features';
import { useNativeSCRTBalance } from './useNativeSCRTBalance';
import { useSCRTPrice } from './useSCRTPrice';
import { useWalletTotalValue } from './useWalletTotalValue';

export interface WalletBalance {
  totalUsdValue: number;
  scrtEquivalent: string;
  scrtPrice: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useWalletBalance = (): WalletBalance => {
  const { refetch: refetchNativeBalance } = useNativeSCRTBalance();
  const { pricing, loading: priceLoading, error: priceError } = useSCRTPrice();
  const walletTotal = isPricingEnabled() ? useWalletTotalValue() : null;

  // Get total USD value of all tokens (including SCRT)
  const totalUsdValue = walletTotal?.totalUSD || 0;

  // Get SCRT price for conversion
  const scrtPrice = pricing['SCRT']?.price || 0;

  // Convert total USD to SCRT equivalent
  const scrtEquivalentNum = scrtPrice > 0 ? totalUsdValue / scrtPrice : 0;
  const scrtEquivalent = scrtEquivalentNum.toFixed(4);

  const loading = (isPricingEnabled() && priceLoading) || walletTotal?.loading || false;
  const error = (isPricingEnabled() ? priceError : null) || walletTotal?.error || null;

  return {
    totalUsdValue,
    scrtEquivalent,
    scrtPrice,
    loading,
    error,
    refetch: refetchNativeBalance,
  };
};
