import { ConfigToken, TOKENS } from '@/config/tokens';
import { SecretNetworkProvider } from '@/contexts/SecretNetworkContext';
import { useSwapStore } from '@/store/swapStore';
import { useTokenStore } from '@/store/tokenStore';
import '@/styles/globals.css';
import '@radix-ui/themes/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import inter font
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

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
    // Initialize tokens from the config file
    setSwappableTokens(TOKENS);

    // Create an indexed version of tokens for the token store
    const indexedTokens = TOKENS.reduce((acc: Record<string, ConfigToken>, token: ConfigToken) => {
      acc[token.address] = token;
      return acc;
    }, {});

    initializeTokens(indexedTokens);
  }, [setSwappableTokens, initializeTokens]);

  useEffect(() => {
    // Removed initializePrices call since it's not available
  }, []);

  return (
    <SecretNetworkProvider>
      <QueryClientProvider client={queryClient}>
        <div className={`${inter.className} bg-[#151321] min-h-screen text-white font-sans`}>
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
