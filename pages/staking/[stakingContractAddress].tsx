import AppLayout from '@/components/app/Global/AppLayout';
import { StakingPageStatic } from '@/components/staking/StakingPageStatic';
import { useRouter } from 'next/router';

/**
 * Dynamic route for individual staking contracts
 * URL: /staking/[stakingContractAddress]
 * Example: /staking/secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev
 */
export default function StakingContractPage() {
  const router = useRouter();
  const { stakingContractAddress } = router.query;

  // Handle loading state and invalid addresses
  if (!stakingContractAddress) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adamant-accentText mx-auto mb-4"></div>
            <p className="text-adamant-text-box-secondary">Loading staking contract...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (typeof stakingContractAddress !== 'string') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-adamant-text-box-main mb-2">
              Invalid Staking Contract
            </h1>
            <p className="text-adamant-text-box-secondary mb-4">
              The provided staking contract address is not valid.
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-adamant-accentText text-white rounded-lg hover:bg-opacity-80 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <StakingPageStatic stakingContractAddress={stakingContractAddress} />
    </AppLayout>
  );
}
