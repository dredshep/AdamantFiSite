import '@/styles/globals.css';
import '@radix-ui/themes/styles.css';
import type { AppProps } from 'next/app';
// import { Theme } from "@radix-ui/themes";
import { useSwapStore } from '@/store/swapStore';
import { useTokenStore } from '@/store/tokenStore';
import { ApiToken, getApiToken, getApiTokenAddress } from '@/utils/apis/getSwappableTokens';
import { useEffect, useState } from 'react';
// import { SwappableToken } from "@/types";
import { SecretNetworkProvider } from '@/contexts/SecretNetworkContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function App({ Component, pageProps }: AppProps) {
  const setSwappableTokens = useSwapStore((state) => state.setSwappableTokens);
  const initializeTokens = useTokenStore((state) => state.initializeTokens);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
            gcTime: 1000 * 60 * 30, // Cache kept for 30 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    const fetchTokens = async () => {
      const tokens = await getApiToken();
      setSwappableTokens(tokens);
      const indexedTokens = tokens.reduce((acc: Record<string, ApiToken>, token) => {
        acc[getApiTokenAddress(token)] = token;
        return acc;
      }, {});
      initializeTokens(indexedTokens);
    };

    void fetchTokens();
  }, [setSwappableTokens, initializeTokens]);
  return (
    <SecretNetworkProvider>
      <QueryClientProvider client={queryClient}>
        <div className="bg-[#151321] min-h-screen text-white">
          <Component {...pageProps} />
        </div>
      </QueryClientProvider>
    </SecretNetworkProvider>
  );
}
