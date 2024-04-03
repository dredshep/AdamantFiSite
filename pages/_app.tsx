import "@radix-ui/themes/styles.css";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Theme } from "@radix-ui/themes";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Theme color="black" grayColor="olive" accentColor="amber">
      <Component {...pageProps} />
    </Theme>
  );
}
