import React, { ReactNode } from "react";
import Head from "next/head";
import { Roboto } from "next/font/google";
import Navbar from "@/components/app/Global/Navbar";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div
      className={
        roboto.className +
        " bg-tubeshapes-light bg-cover bg-fixed min-h-screen text-white"
      }
    >
      <Head>
        <title>Adamant Finance - Secure & Private DeFi Solutions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Navbar />
      {children}
    </div>
  );
}
