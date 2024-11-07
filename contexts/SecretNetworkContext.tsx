import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { createContext, useContext } from 'react';
import { SecretNetworkClient } from 'secretjs';

interface SecretNetworkContextType {
  secretjs: SecretNetworkClient | null;
  walletAddress: string | null;
  isConnecting: boolean;
  error: string | null;
}

const SecretNetworkContext = createContext<SecretNetworkContextType>({
  secretjs: null,
  walletAddress: null,
  isConnecting: false,
  error: null,
});

export function SecretNetworkProvider({ children }: { children: React.ReactNode }) {
  const { secretjs, walletAddress, isConnecting, error } = useSecretNetwork();

  return (
    <SecretNetworkContext.Provider
      value={{
        secretjs,
        walletAddress,
        isConnecting,
        error,
      }}
    >
      {children}
    </SecretNetworkContext.Provider>
  );
}

export function useSecretNetworkContext() {
  return useContext(SecretNetworkContext);
}
