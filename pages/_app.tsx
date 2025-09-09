import { ConfigToken, TOKENS } from '@/config/tokens';
import { useSwapStore } from '@/store/swapStore';
import { useTokenStore } from '@/store/tokenStore';
import '@/styles/globals.css';
import '@radix-ui/themes/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
// import inter font
import GlobalViewingKeyModal from '@/components/app/Global/GlobalViewingKeyModal';
import { GlobalSendTokensDialog } from '@/components/app/Global/UserWallet/GlobalSendTokensDialog';
import { RadixToastProvider } from '@/components/app/Shared/Toasts/RadixToastProvider';
import { TokenServiceError, TokenServiceErrorType } from '@/services/secret/TokenService';
import { getSwappableTokens } from '@/utils/apis/getSwappableTokens';
import { toastManager, viewingKeyErrorAggregator } from '@/utils/toast/toastManager';
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

        // Show appropriate toast based on error type using aggregation for viewing key errors
        // Extract token address and symbol from the error
        const tokenAddress = error.tokenAddress || 'unknown';
        const token = TOKENS.find((t) => t.address === tokenAddress);
        const tokenSymbol = token?.symbol;

        switch (error.type) {
          case TokenServiceErrorType.VIEWING_KEY_REQUIRED:
            viewingKeyErrorAggregator.addError({
              tokenAddress,
              tokenSymbol,
              errorType: 'required',
              isLpToken: false,
              timestamp: Date.now(),
            });
            break;
          case TokenServiceErrorType.VIEWING_KEY_INVALID:
            viewingKeyErrorAggregator.addError({
              tokenAddress,
              tokenSymbol,
              errorType: 'invalid',
              isLpToken: false,
              timestamp: Date.now(),
            });
            break;
          case TokenServiceErrorType.LP_TOKEN_VIEWING_KEY_CORRUPTED:
            // For LP tokens, get the symbol from LIQUIDITY_PAIRS
            const lpPair = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === tokenAddress);
            const lpTokenSymbol = lpPair ? `${lpPair.token0}/${lpPair.token1}` : tokenSymbol;
            viewingKeyErrorAggregator.addError({
              tokenAddress,
              tokenSymbol: lpTokenSymbol,
              errorType: 'corrupted',
              isLpToken: true,
              timestamp: Date.now(),
            });
            break;
          case TokenServiceErrorType.VIEWING_KEY_REJECTED:
            viewingKeyErrorAggregator.addError({
              tokenAddress,
              tokenSymbol,
              errorType: 'rejected',
              isLpToken: false,
              timestamp: Date.now(),
            });
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
        <GlobalSendTokensDialog />
        <GlobalViewingKeyModal />
      </div>
    </QueryClientProvider>
  );
}
