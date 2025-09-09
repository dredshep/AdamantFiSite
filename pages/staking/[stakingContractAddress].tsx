import AppLayout from '@/components/app/Global/AppLayout';
import PoolTabNavigation from '@/components/app/Shared/Navigation/PoolTabNavigation';
import { StakingPageStatic } from '@/components/staking/StakingPageStatic';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { getStakingContractInfoByAddress } from '@/utils/staking/stakingRegistry';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

/**
 * Dynamic route for individual staking contracts
 * URL: /staking/[stakingContractAddress]
 * Example: /staking/secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev
 */
export default function StakingContractPage() {
  const router = useRouter();
  const { stakingContractAddress } = router.query;
  const { walletAddress } = useKeplrConnection();
  const addToQueue = useBalanceFetcherStore((state) => state.addToQueue);

  // Get staking contract info for navigation (must be before conditional returns to avoid hook issues)
  const stakingInfo =
    typeof stakingContractAddress === 'string'
      ? getStakingContractInfoByAddress(stakingContractAddress)
      : null;

  // PRELOAD BALANCE DATA for staking-related tokens to prevent 429 on tab switches
  // This useEffect must be called before any conditional returns
  useEffect(() => {
    if (walletAddress && stakingInfo && typeof stakingContractAddress === 'string') {
      console.log('🔄 Preloading balance data for staking tokens to prevent 429 on tab switches');
      // Preload LP token balance (required for staking)
      addToQueue(stakingInfo.lpTokenAddress, 'StakingPage:Preload:LPToken', 'low');

      // Also preload the underlying pool tokens for potential tab switches
      import('@/config/tokens')
        .then(({ LIQUIDITY_PAIRS }) => {
          const matchingPair = LIQUIDITY_PAIRS.find(
            (pair) => pair.lpToken === stakingInfo.lpTokenAddress
          );
          if (matchingPair) {
            addToQueue(matchingPair.token0, 'StakingPage:Preload:Token0', 'low');
            addToQueue(matchingPair.token1, 'StakingPage:Preload:Token1', 'low');
          }
        })
        .catch(console.error);
    }
  }, [walletAddress, stakingInfo, addToQueue, stakingContractAddress]);

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

  if (!stakingInfo) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-adamant-text-box-main mb-2">
              Staking Contract Not Found
            </h1>
            <p className="text-adamant-text-box-secondary mb-4">
              The staking contract address{' '}
              <code className="bg-adamant-box-dark px-2 py-1 rounded text-sm">
                {stakingContractAddress}
              </code>{' '}
              is not recognized.
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
      <PoolTabNavigation
        stakingContractAddress={stakingContractAddress}
        poolName={stakingInfo.poolName}
        activeTab="staking"
        isStakingPage={true}
        stakingContent={<StakingPageStatic stakingContractAddress={stakingContractAddress} />}
      />
    </AppLayout>
  );
}
