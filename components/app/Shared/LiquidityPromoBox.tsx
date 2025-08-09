import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

/**
 * A one-off promotional banner for the Pools page highlighting liquidity provision.
 * Not designed for reuse; copy and layout are fixed to match the provided design.
 */
const LiquidityPromoBox: React.FC = () => {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-adamant-box-border bg-adamant-app-box">
      <div className="relative z-10 grid grid-cols-1 gap-6 p-6 md:grid-cols-12 md:p-8">
        {/* Left copy */}
        <div className="md:col-span-8">
          <h2 className="text-3xl leading-tight md:text-4xl font-semibold text-adamant-text-box-main">
            Let your money work for you
            <br className="hidden md:block" /> by providing liquidity.
          </h2>
          <p className="mt-3 text-adamant-text-box-secondary">
            Receive a portion of trading fees and incentives now!
          </p>

          <div className="mt-6">
            <Link
              href="/pools"
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black shadow-sm transition hover:opacity-90"
            >
              Provide liquidity
            </Link>
          </div>
        </div>

        {/* Right side: partnership link */}
        <div className="md:col-span-4 md:flex md:flex-col md:items-end">
          <div className="text-right">
            <div className="text-sm text-adamant-text-box-main/80">Looking for partnership?</div>
            <Link href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300">
              Reach us here
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative coins artwork - positioned to peek from bottom-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 right-11 z-0 hidden select-none md:block"
      >
        <Image
          src="/images/adamant-fi-coins.png"
          alt=""
          width={200}
          height={200}
          className="object-contain drop-shadow-xl"
          priority
        />
      </div>
    </section>
  );
};

export default LiquidityPromoBox;
