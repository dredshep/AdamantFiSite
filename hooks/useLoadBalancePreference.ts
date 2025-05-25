import { LoadBalancePreference } from '@/utils/env';
import { useMemo } from 'react';

export interface LoadBalanceConfig {
  shouldAutoLoad: boolean;
  shouldShowFetchButton: boolean;
  preference: LoadBalancePreference;
}

/**
 * Hook to manage load balance preferences
 * Controls when balances should be fetched automatically vs manually
 */
export function useLoadBalancePreference(): LoadBalanceConfig {
  const config = useMemo(() => {
    try {
      // Get the preference directly from environment variable
      const preference = process.env[
        'NEXT_PUBLIC_LOAD_BALANCE_PREFERENCE'
      ] as LoadBalancePreference;

      // Validate the preference value
      if (preference && Object.values(LoadBalancePreference).includes(preference)) {
        switch (preference) {
          case LoadBalancePreference.None:
            return {
              shouldAutoLoad: false,
              shouldShowFetchButton: true,
              preference,
            };

          case LoadBalancePreference.All:
            return {
              shouldAutoLoad: true,
              shouldShowFetchButton: false,
              preference,
            };

          case LoadBalancePreference.Pair:
            return {
              shouldAutoLoad: false,
              shouldShowFetchButton: true,
              preference,
            };
        }
      }

      // Fallback to safe mode if preference is not set or invalid
      console.warn(
        `Invalid or missing NEXT_PUBLIC_LOAD_BALANCE_PREFERENCE: "${preference}". Using safe mode (Pair).`
      );
      return {
        shouldAutoLoad: false,
        shouldShowFetchButton: true,
        preference: LoadBalancePreference.Pair,
      };
    } catch (error) {
      console.error('Error reading load balance preference:', error);
      // Fallback to safe mode
      return {
        shouldAutoLoad: false,
        shouldShowFetchButton: true,
        preference: LoadBalancePreference.Pair,
      };
    }
  }, []);

  return config;
}
