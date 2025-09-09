import { Breadcrumb } from '@/components/app/Breadcrumb';
import StakingPoolSelectionModal from '@/components/app/Shared/Forms/Select/StakingPoolSelectionModal';
import {
  getStakingContractInfoByAddress,
  getStakingContractInfoForPool,
} from '@/utils/staking/stakingRegistry';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { useRouter } from 'next/router';
import React, { useCallback, useRef, useState } from 'react';

interface PoolTabNavigationProps {
  // Pool page props
  poolAddress?: string | undefined;
  token0Symbol?: string;
  token1Symbol?: string;

  // Staking page props
  stakingContractAddress?: string;
  poolName?: string;

  // Current tab
  activeTab: 'deposit' | 'withdraw' | 'staking';

  // Content for each tab
  depositContent?: React.ReactNode;
  withdrawContent?: React.ReactNode;
  stakingContent?: React.ReactNode;

  // Whether this is being used on a staking page
  isStakingPage?: boolean;
}

const PoolTabNavigation: React.FC<PoolTabNavigationProps> = ({
  poolAddress,
  token0Symbol,
  token1Symbol,
  stakingContractAddress,
  poolName,
  activeTab,
  depositContent,
  withdrawContent,
  stakingContent,
  isStakingPage = false,
}) => {
  const router = useRouter();
  const [showStakingPoolModal, setShowStakingPoolModal] = useState(false);

  // Track recent navigation to prevent only API calls, not navigation itself
  const lastNavigationRef = useRef<number>(0);
  // const RAPID_NAV_THRESHOLD_MS = 500; // Only prevent rapid API calls, not navigation - currently unused

  // Determine breadcrumb text
  const breadcrumbText = isStakingPage ? `${poolName} Staking` : `${token0Symbol}-${token1Symbol}`;

  // For staking page, we need to find the pool address from staking contract
  const effectivePoolAddress =
    poolAddress ||
    (() => {
      if (stakingContractAddress) {
        const stakingInfo = getStakingContractInfoByAddress(stakingContractAddress);
        // We need to find the pool address from the staking info
        // This requires looking up the LP token in LIQUIDITY_PAIRS
        if (stakingInfo) {
          const { LIQUIDITY_PAIRS } = require('@/config/tokens');
          const matchingPair = LIQUIDITY_PAIRS.find(
            (pair: any) => pair.lpToken === stakingInfo.lpTokenAddress
          );
          return matchingPair?.pairContract;
        }
      }
      return undefined;
    })();

  const handleStakingClick = useCallback(() => {
    // Always allow navigation - just track it for API call prevention
    lastNavigationRef.current = Date.now();

    if (effectivePoolAddress) {
      const stakingInfo = getStakingContractInfoForPool(effectivePoolAddress);
      if (stakingInfo) {
        router.push(`/staking/${stakingInfo.stakingAddress}`);
      } else {
        // Show modal for pools without staking
        setShowStakingPoolModal(true);
      }
    } else if (stakingContractAddress) {
      // Already on staking page, no action needed
      return;
    }
  }, [effectivePoolAddress, router, stakingContractAddress]);

  const handleDepositClick = useCallback(() => {
    // Always allow navigation - just track it for API call prevention
    lastNavigationRef.current = Date.now();

    if (effectivePoolAddress) {
      router.push(`/pool/${effectivePoolAddress}?tab=deposit`);
    }
  }, [effectivePoolAddress, router]);

  const handleWithdrawClick = useCallback(() => {
    // Always allow navigation - just track it for API call prevention
    lastNavigationRef.current = Date.now();

    if (effectivePoolAddress) {
      router.push(`/pool/${effectivePoolAddress}?tab=withdraw`);
    }
  }, [effectivePoolAddress, router]);

  // Handle tab changes for Radix UI Tabs (pool page) - always allow navigation
  const handleTabChange = useCallback(
    (value: string) => {
      // Always allow navigation - just track it for API call prevention
      lastNavigationRef.current = Date.now();

      if (value === 'staking') {
        handleStakingClick();
      } else if (effectivePoolAddress) {
        router.push(`/pool/${effectivePoolAddress}?tab=${value}`);
      }
    },
    [effectivePoolAddress, router, handleStakingClick]
  );

  return (
    <>
      <div className="max-w-7xl mx-auto mt-12 flex flex-col gap-4">
        <div className="px-2.5">
          <div className="max-w-full md:max-w-xl mx-auto">
            <Breadcrumb linkPath="/pools" linkText="Pools" currentText={breadcrumbText} />
          </div>

          <div className="mt-4 bg-adamant-app-box rounded-xl max-w-full md:max-w-xl mx-auto mb-4">
            {isStakingPage ? (
              // For staking page, show tabs but don't use Radix Tabs since we handle navigation manually
              <div className="flex flex-col">
                <div className="flex mb-4 p-2.5 gap-2.5" aria-label="Manage your liquidity">
                  <button
                    onClick={handleDepositClick}
                    className="flex-1 bg-adamant-app-box-lighter px-4 py-4 rounded-xl text-white/75
                             hover:bg-white/5 transition-colors font-medium tracking-wide"
                  >
                    Deposit
                  </button>

                  <button
                    onClick={handleWithdrawClick}
                    className="flex-1 bg-adamant-app-box-lighter px-4 py-4 rounded-xl text-white/75
                             hover:bg-white/5 transition-colors font-medium tracking-wide"
                  >
                    Withdraw
                  </button>

                  <button
                    onClick={handleStakingClick}
                    className="flex-1 bg-adamant-app-box-lighter px-4 py-4 rounded-xl text-black bg-gradient-to-br 
                             from-yellow-300/90 to-amber-400/90
                             hover:bg-white/5 transition-all duration-300 font-medium tracking-wide
                             relative overflow-hidden transform hover:scale-105
                             hover:border-2 hover:border-yellow-300/50"
                  >
                    Staking
                  </button>
                </div>

                {/* Staking content */}
                <div className="outline-none py-2.5 px-2.5">{stakingContent}</div>
              </div>
            ) : (
              // For pool page, use Radix Tabs with proper value change handling
              <Tabs.Root
                className="flex flex-col"
                value={activeTab}
                onValueChange={handleTabChange}
              >
                <Tabs.List className="flex mb-4 p-2.5 gap-2.5" aria-label="Manage your liquidity">
                  <Tabs.Trigger
                    key="deposit"
                    className="flex-1 bg-adamant-app-box-lighter px-4 py-4 rounded-xl text-white/75
                             data-[state=active]:text-black data-[state=active]:bg-white/75
                             hover:bg-white/5 transition-colors font-medium tracking-wide"
                    value="deposit"
                  >
                    Deposit
                  </Tabs.Trigger>

                  <Tabs.Trigger
                    key="withdraw"
                    className="flex-1 bg-adamant-app-box-lighter px-4 py-4 rounded-xl text-white/75
                               data-[state=active]:text-black data-[state=active]:bg-white/75
                               hover:bg-white/5 transition-colors font-medium tracking-wide"
                    value="withdraw"
                  >
                    Withdraw
                  </Tabs.Trigger>

                  {effectivePoolAddress && (
                    <Tabs.Trigger
                      value="staking"
                      className="flex-1 bg-adamant-app-box-lighter px-4 py-4 rounded-xl text-white/75
                                 hover:text-black hover:bg-gradient-to-br 
                                 hover:from-yellow-300/90 hover:to-amber-400/90
                                 hover:bg-white/5 transition-all duration-300 font-medium tracking-wide
                                 relative overflow-hidden transform hover:scale-105
                                 hover:border-2 hover:border-yellow-300/50
                                 data-[state=active]:text-black data-[state=active]:bg-gradient-to-br 
                                 data-[state=active]:from-yellow-300/90 data-[state=active]:to-amber-400/90"
                    >
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        {/* Lightning Bolt Icon */}
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Staking
                      </div>
                    </Tabs.Trigger>
                  )}
                </Tabs.List>

                <Tabs.Content value="deposit" className="outline-none">
                  {depositContent}
                </Tabs.Content>

                <Tabs.Content value="withdraw" className="outline-none">
                  {withdrawContent}
                </Tabs.Content>
              </Tabs.Root>
            )}
          </div>
        </div>
      </div>

      {/* Staking Pool Selection Modal */}
      <Dialog.Root open={showStakingPoolModal} onOpenChange={setShowStakingPoolModal}>
        <Dialog.Portal>
          <StakingPoolSelectionModal
            isOpen={showStakingPoolModal}
            onClose={() => setShowStakingPoolModal(false)}
          />
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default PoolTabNavigation;
