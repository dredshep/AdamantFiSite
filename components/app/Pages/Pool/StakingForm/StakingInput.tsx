/**
 * REUSABILITY ANALYSIS: StakingInput vs StakingInput2
 *
 * This file demonstrates two approaches to building staking input components:
 * 1. StakingInput: Custom implementation built from scratch
 * 2. StakingInput2: Reusing existing token input infrastructure
 *
 * REUSABLE COMPONENTS FROM EXISTING INFRASTRUCTURE:
 *
 * 1. FROM TokenInputBase.tsx:
 *    ✅ Input styling patterns (bg-adamant-app-input/30, backdrop-blur-sm, etc.)
 *    ✅ Input validation patterns (/^\d*\.?\d*$/ regex)
 *    ✅ Loading state overlay structure
 *    ✅ Placeholder styling and behavior
 *    ✅ Input field structure and CSS classes
 *    ✅ Token display section layout (rounded-xl, bg-adamant-app-selectTrigger)
 *
 * 2. FROM TokenInputBaseLp.tsx:
 *    ✅ LP token specific styling patterns
 *    ✅ Balance display structure
 *    ✅ Input container layout
 *    ✅ Error handling patterns
 *
 * 3. FROM TopRightBalance.tsx:
 *    ✅ Balance formatting logic (toFixed(6))
 *    ✅ MAX button styling and behavior
 *    ✅ Loading/error state display patterns
 *    ✅ Balance label structure
 *
 * 4. FROM TokenInputs.ts & tokenInputsStore.ts:
 *    ✅ Input state management patterns
 *    ✅ Store integration patterns
 *    ✅ Type definitions for input identifiers
 *
 * WHAT CANNOT BE DIRECTLY REUSED:
 *
 * 1. Token selection modal (not needed for staking - fixed LP token)
 * 2. Price estimation display (not applicable to staking)
 * 3. Swap-specific input identifiers (need staking-specific ones)
 * 4. Pool selection functionality (staking is pool-specific)
 *
 * BENEFITS OF REUSING INFRASTRUCTURE (StakingInput2):
 *
 * 1. CONSISTENCY: Matches existing UI patterns across the app
 * 2. MAINTAINABILITY: Changes to base components benefit all inputs
 * 3. REDUCED CODE: ~50% less custom styling and logic
 * 4. ACCESSIBILITY: Inherits accessibility improvements from base components
 * 5. RESPONSIVE: Inherits responsive design patterns
 * 6. TESTING: Can leverage existing test coverage
 *
 * TRADE-OFFS:
 *
 * 1. StakingInput (Custom):
 *    + More control over specific styling
 *    + Simpler component structure
 *    + No dependencies on other components
 *    - More code duplication
 *    - Inconsistent with app patterns
 *    - Manual maintenance of styling
 *
 * 2. StakingInput2 (Reusing Infrastructure):
 *    + Consistent with app design system
 *    + Leverages existing patterns
 *    + Easier to maintain
 *    + Better accessibility
 *    - Slightly more complex structure
 *    - Dependency on base components
 *
 * RECOMMENDATION: Use StakingInput2 approach for production
 */

import { InfoContainer } from '@/components/app/Shared/Forms/Input/InputWrappers';
import StakingPoolSelectionModal from '@/components/app/Shared/Forms/Select/StakingPoolSelectionModal';
import { LoadingPlaceholder } from '@/components/app/Shared/LoadingPlaceholder';
import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { getActiveStakingPools } from '@/config/staking';
import { useRewardEstimates } from '@/hooks/staking/useRewardEstimates';
import { useStakingStore } from '@/store/staking/stakingStore';
import { SecretString } from '@/types';
import { amountExceedsBalance } from '@/utils/staking/convertStakingAmount';
import * as Dialog from '@radix-ui/react-dialog';
import React, { useState } from 'react';

interface StakingInputProps {
  inputIdentifier: 'stakeAmount' | 'unstakeAmount';
  operation: 'stake' | 'unstake';
  balance: string;
  balanceLabel?: string;
  isLoading?: boolean;
  tokenSymbol?: string;
  stakingContractAddress?: string;
}

const StakingInput: React.FC<StakingInputProps> = ({
  inputIdentifier,
  operation,
  balance,
  balanceLabel = 'Balance',
  isLoading = false,
  tokenSymbol = 'LP',
  stakingContractAddress = 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev',
}) => {
  const { stakingInputs, setStakingInputAmount } = useStakingStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get LP token address for reward estimates
  // Note: stakingContractAddress is the staking contract, we need to find the LP token
  // We need to reverse lookup from staking contract to LP token
  const stakingInfo = getActiveStakingPools().find(
    (pool) => pool.stakingAddress === stakingContractAddress
  );
  const lpTokenAddress = stakingInfo?.lpTokenAddress;

  // Use reward estimates hook only for stake operations
  const rewardEstimates = useRewardEstimates(lpTokenAddress || '');

  const operationLabel = operation === 'stake' ? 'Stake' : 'Unstake';
  const amount = stakingInputs[inputIdentifier].amount;

  // Properly handle balance states: '-' means unknown, actual numbers are known values
  const isBalanceKnown = balance !== '-';
  const balanceNumber = isBalanceKnown ? parseFloat(balance) : null;
  const isInvalid = isBalanceKnown && amountExceedsBalance(amount, balance);

  // Calculate reward estimates for stake operations when amount is entered
  const shouldShowEstimates =
    operation === 'stake' && amount && parseFloat(amount) > 0 && !isInvalid;
  const estimates = shouldShowEstimates ? rewardEstimates.estimateRewardsForAmount(amount) : null;

  // Helper to format numbers cleanly
  const formatBalance = (value: number): string => {
    if (value < 0.001) return value.toFixed(8);
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    });
  };

  const handleInputChange = (value: string) => {
    // Allow only numbers and decimal point - reusing validation pattern from TokenInputBase
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setStakingInputAmount(inputIdentifier, value);
    }
  };

  const handleMaxClick = () => {
    if (isBalanceKnown) {
      setStakingInputAmount(inputIdentifier, balance);
    }
  };

  const handleTokenSelectorClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <InfoContainer className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-adamant-text-box-main">{operationLabel}</h3>
        <div className="flex gap-3 items-center">
          <div className="text-sm text-adamant-text-box-secondary">{balanceLabel}</div>
          <div className="flex items-center gap-2">
            {isLoading || !isBalanceKnown ? (
              <LoadingPlaceholder size="medium" className="h-5 w-20" />
            ) : (
              <>
                <span className="text-sm font-medium text-adamant-text-box-main">
                  {balanceNumber?.toLocaleString('en-US', { maximumFractionDigits: 6 }) ?? '0'}
                </span>
                {isBalanceKnown && (
                  <button
                    className="font-medium text-base flex items-center justify-center bg-white opacity-80 hover:opacity-100 text-black rounded-md px-2"
                    onClick={handleMaxClick}
                  >
                    max
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            className={`w-full bg-transparent text-2xl font-light outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-500/50 ${
              isInvalid ? 'text-red-400' : ''
            }`}
            value={amount}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="0.0"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center">
              <LoadingPlaceholder size="large" className="h-8 w-32" />
            </div>
          )}
        </div>

        {/* Token display section with modal trigger */}
        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Trigger asChild>
            <div
              className="flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 bg-adamant-app-selectTrigger min-w-max cursor-pointer hover:bg-adamant-app-selectTrigger/80 transition-colors"
              onClick={handleTokenSelectorClick}
            >
              <TokenImageWithFallback
                tokenAddress={stakingContractAddress as SecretString}
                size={24}
                alt={tokenSymbol}
              />
              {tokenSymbol}
            </div>
          </Dialog.Trigger>

          <StakingPoolSelectionModal isOpen={isModalOpen} onClose={handleModalClose} />
        </Dialog.Root>
      </div>

      {/* Error message */}
      {isInvalid && <div className="text-red-500 text-xs">Amount exceeds available balance</div>}

      {/* Reward Estimates - Only show for stake operations */}
      {shouldShowEstimates && estimates && (
        <div className="bg-adamant-accentText/5 backdrop-blur-sm rounded-lg p-3 border border-adamant-accentText/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-adamant-accentText">Estimated bADMT Rewards</h4>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-adamant-text-box-secondary">Daily</p>
              <p className="font-medium text-adamant-text-box-main">
                {formatBalance(estimates.dailyRewards)} bADMT
              </p>
            </div>
            <div>
              <p className="text-adamant-text-box-secondary">Weekly</p>
              <p className="font-medium text-adamant-text-box-main">
                {formatBalance(estimates.weeklyRewards)} bADMT
              </p>
            </div>
            <div>
              <p className="text-adamant-text-box-secondary">Monthly</p>
              <p className="font-medium text-adamant-text-box-main">
                {formatBalance(estimates.monthlyRewards)} bADMT
              </p>
            </div>
          </div>
        </div>
      )}
    </InfoContainer>
  );
};

export default StakingInput;
