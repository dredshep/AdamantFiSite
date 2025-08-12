import { useSingleTokenPricing } from './useCoinGeckoPricing';

export const useSCRTPrice = () => {
  return useSingleTokenPricing('secret', 'SCRT', true, 60000); // Refresh every minute
};
