import "@/styles/globals.css";
import "@radix-ui/themes/styles.css";
import type { AppProps } from "next/app";
import { Theme } from "@radix-ui/themes";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Theme>
      <Component {...pageProps} />
    </Theme>
  );
}
