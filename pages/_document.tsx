import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta
          name="description"
          content="Adamant Finance provides secure and private DeFi solutions on Secret Network"
        />
        <meta
          name="keywords"
          content="adamant, finance, secret, network, defi, privacy, security, blockchain"
        />
        <meta name="author" content="Adamant Finance" />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#0c0a23" />
        <meta name="msapplication-TileColor" content="#0c0a23" />
        <meta name="theme-color" content="#ffffff" />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
