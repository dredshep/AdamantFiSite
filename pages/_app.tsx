import { SecretNetworkProvider } from '@/contexts/SecretNetworkContext';
import { useSwapStore } from '@/store/swapStore';
import { useTokenStore } from '@/store/tokenStore';
import '@/styles/globals.css';
import { ApiToken, getApiToken, getApiTokenAddress } from '@/utils/apis/getSwappableTokens';
import '@radix-ui/themes/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      const apiTokens = await getApiToken();
      console.log('Fetched API tokens:', apiTokens);

      setSwappableTokens(apiTokens);

      const indexedTokens = apiTokens.reduce((acc: Record<string, ApiToken>, token) => {
        const address = getApiTokenAddress(token);
        acc[address] = token;
        return acc;
      }, {});
      console.log('Indexed tokens for store:', indexedTokens);

      initializeTokens(indexedTokens);
    };

    void fetchTokens();
  }, [setSwappableTokens, initializeTokens]);

  return (
    <SecretNetworkProvider>
      <QueryClientProvider client={queryClient}>
        <div className="bg-[#151321] min-h-screen text-white">
          <Component {...pageProps} />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </QueryClientProvider>
    </SecretNetworkProvider>
  );
}
