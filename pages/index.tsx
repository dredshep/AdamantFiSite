import AppLayout from '@/components/app/Global/AppLayout';
import SwapForm from '@/components/app/Pages/Swap/SwapForm/SwapForm';
import VoiceSwapInterface from '@/components/app/Pages/Swap/VoiceSwapInterface';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
// import { validateIncentives } from '@/lib/keplr/incentives/__tests__/validateIncentives';
import { Roboto } from 'next/font/google';
import { useEffect } from 'react';
// import { useStore } from "@/store/swapStore";
// import { useTokenStore } from "@/store/tokenStore";

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
});

// Then render infoBoxes where you need it in your component tree.

export default function Swap() {
  const { secretjs } = useSecretNetwork();

  // Only run in development and with a specific flag
  useEffect(() => {
    if (
      secretjs &&
      process.env.NODE_ENV === 'development' &&
      process.env['NEXT_PUBLIC_RUN_INCENTIVES_VALIDATION'] === 'true'
    ) {
      console.log('Running incentives validation...');
      // validateIncentives(secretjs).catch(console.error);
      console.log('Incentives validation disabled - module not found');
    }
  }, [secretjs]);

  // const { tokenInputs } = useStore();
  // const { tokens } = useTokenStore();
  // const receiveTokenAddress = tokenInputs["swap.receive"].tokenAddress;
  // const payTokenAddress = tokenInputs["swap.pay"].tokenAddress;
  // const receiveToken = tokens?.[receiveTokenAddress];
  // const payToken = tokens?.[payTokenAddress];
  return (
    <div className={roboto.className + ' bg-adamant-background bg-cover min-h-screen text-white'}>
      <AppLayout>
        <div className="max-w-xl mx-auto mt-28 space-y-6">
          {/* Voice Swap Interface */}
          <VoiceSwapInterface />

          {/* Regular Swap Form */}
          <div className="bg-adamant-app-box bg-opacity-55 leading-none rounded-xl text-xl">
            <SwapForm />
          </div>
        </div>
      </AppLayout>
    </div>
  );
}
