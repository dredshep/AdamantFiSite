import { ConfigToken, TOKENS } from '@/config/tokens';
import { useSwapStore } from '@/store/swapStore';
import { useTokenStore } from '@/store/tokenStore';
import '@/styles/globals.css';
import '@radix-ui/themes/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
// import inter font
import { RadixToastProvider } from '@/components/app/Shared/Toasts/RadixToastProvider';
import { TokenServiceError, TokenServiceErrorType } from '@/services/secret/TokenService';
import { getSwappableTokens } from '@/utils/apis/getSwappableTokens';
import { toastManager } from '@/utils/toast/toastManager';
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

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason as unknown;

      // Handle Keplr rejection errors specifically
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // Check for Keplr-specific rejection messages
        if (
          errorMessage.includes('request rejected') ||
          errorMessage.includes('user rejected') ||
          (errorMessage.includes('rejected') && error.stack?.includes('moz-extension'))
        ) {
          event.preventDefault(); // Prevent the error from being logged to console as unhandled
          console.log('Caught Keplr rejection error - user canceled operation');
          return; // Don't show toast for user cancellations - they're intentional
        }
      }

      // Handle TokenServiceError specifically
      if (error instanceof TokenServiceError) {
        event.preventDefault(); // Prevent the error from being logged to console as unhandled

        console.log('Caught unhandled TokenServiceError:', error.message, error.type);

        // Show appropriate toast based on error type
        switch (error.type) {
          case TokenServiceErrorType.VIEWING_KEY_REQUIRED:
            toastManager.viewingKeyRequired();
            break;
          case TokenServiceErrorType.VIEWING_KEY_INVALID:
            toastManager.viewingKeyRequired();
            break;
          case TokenServiceErrorType.VIEWING_KEY_REJECTED:
            toastManager.viewingKeyRejected();
            break;
          case TokenServiceErrorType.NETWORK_ERROR:
            toastManager.networkError();
            break;
          case TokenServiceErrorType.WALLET_ERROR:
            toastManager.keplrNotInstalled();
            break;
          default:
            toastManager.balanceFetchError();
            break;
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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

  // Immediate Keplr check on mount
  useEffect(() => {
    // Small delay to ensure window is fully loaded
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && !window.keplr) {
        toastManager.keplrNotInstalled();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Removed initializePrices call since it's not available
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`${inter.className} bg-[#151321] min-h-screen text-white font-sans`}>
        <Component {...pageProps} />
        {/* <ViewingKeyDebugger /> */}
        <RadixToastProvider />
      </div>
    </QueryClientProvider>
  );
}
