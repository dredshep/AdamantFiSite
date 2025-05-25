import { ConfigToken, TOKENS } from '@/config/tokens';
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
import { ViewingKeyDebugger } from '@/components/ViewingKeyDebugger';
import { getSwappableTokens } from '@/utils/apis/getSwappableTokens';
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
    // Initialize only swappable tokens (tokens that have liquidity pairs)
    const swappableTokens = getSwappableTokens();
    setSwappableTokens(swappableTokens);

    // Create an indexed version of ALL tokens for the token store (including non-swappable ones)
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
    <QueryClientProvider client={queryClient}>
      <div className={`${inter.className} bg-[#151321] min-h-screen text-white font-sans`}>
        <Component {...pageProps} />
        <ViewingKeyDebugger />
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
  );
}
