import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { balanceService } from '@/services/balanceService';
import { getSecretNetworkEnvVars, LoadBalancePreference } from '@/utils/env';
import { useEffect } from 'react';

/**
 * Initializes the BalanceService when the wallet is connected.
 * Also triggers a global balance fetch if the env preference is set to 'All'.
 * This should be called once from a top-level component (e.g., _app.tsx or Layout).
 */
export const useBalanceServiceInitializer = () => {
  const { secretjs, walletAddress } = useKeplrConnection();

  useEffect(() => {
    if (secretjs && walletAddress) {
      // Initialize the service first
      balanceService.initialize(secretjs, walletAddress);

      // Check preference and fetch all if needed
      try {
        const envVars = getSecretNetworkEnvVars();
        if (envVars.LOAD_BALANCE_PREFERENCE === LoadBalancePreference.All) {
          balanceService.requestFetchAll();
        }
      } catch (error) {
        // This can happen if env vars are missing, which is a critical error
        // The getSecretNetworkEnvVars function will throw a detailed error to the console
        console.error('BalanceService Initializer: Could not get env vars.', error);
      }
    }
  }, [secretjs, walletAddress]);
};
