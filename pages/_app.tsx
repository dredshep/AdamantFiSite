import "@radix-ui/themes/styles.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
// import { Theme } from "@radix-ui/themes";
import { useEffect } from "react";
import { getSwappableTokens } from "@/utils/apis/getSwappableTokens";
import { useStore } from "@/store/swapStore";
import { useTokenStore } from "@/store/tokenStore";

export default function App({ Component, pageProps }: AppProps) {
  const setSwappableTokens = useStore((state) => state.setSwappableTokens);
  const initializeTokens = useTokenStore((state) => state.initializeTokens);

  useEffect(() => {
    const fetchTokens = async () => {
      const tokens = await getSwappableTokens();
      setSwappableTokens(tokens);
      const indexedTokens = tokens.reduce((acc: Record<string, any>, token) => {
        acc[token.address] = token;
        return acc;
      }, {});
      initializeTokens(indexedTokens);
    };

    fetchTokens();
  }, [setSwappableTokens, initializeTokens]);
  return (
    // <Theme color="black" grayColor="olive" accentColor="amber">
      <Component {...pageProps} />
    // {/* </Theme> */}
  );
}
