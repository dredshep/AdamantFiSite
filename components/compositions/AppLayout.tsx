// _layout.tsx
import { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import Logo from "@/components/SVG/logo";
import UserWallet from "@/components/app/UserWallet";
import Footer from "@/components/Footer";
import { Jura } from "next/font/google";

const jura = Jura({ subsets: ["latin"] });

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div
      className={
        jura.className +
        " bg-tubeshapes-light bg-cover min-h-screen pb-20 text-white"
      }
    >
      <Head>
        <title>Adamant Finance - Secure & Private DeFi Solutions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="px-6 py-8 flex w-full justify-between">
        <Link className="flex items-center" href="/">
          <Logo className="h-10 w-10" />
          <div className="text-white text-lg font-bold leading-6 tracking-wider ml-2">
            ADAMANT<span className="text-adamant-dark">.FI</span>
          </div>
        </Link>
        <div className="flex items-center space-x-11 uppercase text-base font-medium leading-6">
          {/* Navigation Links */}
          {/* You can replace these hrefs with actual paths */}
          <Link
            href="#"
            className="text-white border-b-2 border-[#8A754A] pb-1 px-2"
          >
            Swap
          </Link>
          <Link
            href="#"
            className="text-white border-b-2 border-transparent brightness-50 pb-1 px-2"
          >
            Tokens
          </Link>
          <Link
            href="#"
            className="text-white border-b-2 border-transparent brightness-50 pb-1 px-2"
          >
            Pools
          </Link>
        </div>
        <UserWallet
          isConnected={true}
          userAddress="0x1234567890abcdef"
          balanceSCRT={0}
          balanceADMT={0}
          onConnect={() => console.log("connect")}
        />
      </div>
      {/* Page-specific content will be rendered here */}
      {children}
      {/* <Footer /> */}
    </div>
  );
}
