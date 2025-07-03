import { Head, Html, Main, NextScript } from 'next/document';

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

        {/* <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="AdamantFi" />
        <link rel="manifest" href="/site.webmanifest" /> */}
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
