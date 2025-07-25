import Navbar from '@/components/app/Global/Navbar';
import Footer from '@/components/layout/Footer';
// import { Roboto } from 'next/font/google';
import Head from 'next/head';
import { ReactNode } from 'react';

// const roboto = Roboto({
//   subsets: ['latin'],
//   weight: ['300', '400', '500', '700', '900'],
// });

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div
      className={
        // roboto.className +
        ' bg-adamant-background bg-cover bg-fixed min-h-screen text-white font-sans flex flex-col pt-6'
      }
    >
      <Head>
        <title>Adamant Finance - Secure & Private DeFi Solutions</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
