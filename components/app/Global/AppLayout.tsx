import React, { ReactNode } from "react";
import Head from "next/head";
import { Jura } from "next/font/google";
import Navbar from "@/components/app/Global/Navbar";

const jura = Jura({ subsets: ["latin"] });

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div
      className={
        jura.className + " bg-tubeshapes-light bg-cover min-h-screen text-white"
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
