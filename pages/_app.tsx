import "@radix-ui/themes/styles.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
// import { Theme } from "@radix-ui/themes";
import { useEffect } from "react";
import { getSwappableTokens } from "@/utils/apis/getSwappableTokens";
import { useSwapStore } from "@/store/swapStore";
import { useTokenStore } from "@/store/tokenStore";
import { SwappableToken } from "@/types";

export default function App({ Component, pageProps }: AppProps) {
  const setSwappableTokens = useSwapStore((state) => state.setSwappableTokens);
  const initializeTokens = useTokenStore((state) => state.initializeTokens);

  useEffect(() => {
    const fetchTokens = async () => {
      const tokens = await getSwappableTokens();
      setSwappableTokens(tokens);
      const indexedTokens = tokens.reduce(
        (acc: Record<string, SwappableToken>, token) => {
          acc[token.address] = token;
          return acc;
        },
        {}
      );
      initializeTokens(indexedTokens);
    };

    void fetchTokens();
  }, [setSwappableTokens, initializeTokens]);
  return (
    // <Theme color="black" grayColor="olive" accentColor="amber">
    <div className="bg-[#151321] min-h-screen text-white">
      <Component {...pageProps} />
    </div>
    // {/* </Theme> */}
  );
}
