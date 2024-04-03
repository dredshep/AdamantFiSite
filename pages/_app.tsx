import "@radix-ui/themes/styles.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Theme } from "@radix-ui/themes";
import { useEffect } from "react";
import { getSwappableTokens } from "@/utils/apis/getSwappableTokens";
import { useStore } from "@/store/swapStore";

export default function App({ Component, pageProps }: AppProps) {
  const setSwappableTokens = useStore((state) => state.setSwappableTokens);

  useEffect(() => {
    const fetchTokens = async () => {
      const tokens = await getSwappableTokens();
      setSwappableTokens(tokens);
    };

    fetchTokens();
  }, [setSwappableTokens]); // Dependency array is empty to ensure this runs once
  return (
    <Theme color="black" grayColor="olive" accentColor="amber">
      <Component {...pageProps} />
    </Theme>
  );
}
