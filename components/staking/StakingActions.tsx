import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { useStaking } from '@/hooks/useStaking';
import { getStakingContractInfoByAddress } from '@/utils/staking/stakingRegistry';
import { motion } from 'framer-motion';
import React from 'react';

interface StakingActionsProps {
  stakingContractAddress: string;
  lpTokenAddress: string;
  canStake: boolean;
  stakeAmount: string;
  unstakeAmount: string;
  onTransactionComplete?: () => void;
}

export const StakingActions: React.FC<StakingActionsProps> = ({
  stakingContractAddress,
  lpTokenAddress,
  canStake,
  stakeAmount,
  unstakeAmount,
  onTransactionComplete,
}) => {
  console.log('🎯 STAKING ACTIONS: Component rendered with props:', {
    stakingContractAddress,
    lpTokenAddress,
    canStake,
    stakeAmount,
    unstakeAmount,
  });

  const { secretjs, walletAddress } = useKeplrConnection();

  // Get staking contract info for the useStaking hook
  const stakingInfo = getStakingContractInfoByAddress(stakingContractAddress);

  // Use the real staking hook
  const { stakeLpTokens, unstakeLpTokens, claimStakingRewards, isOperationLoading } = useStaking({
    secretjs,
    walletAddress,
    stakingInfo,
  });

  // Real staking functions using the useStaking hook
  const handleStake = async () => {
    console.log('🎯 STAKE ACTION: Real stake button clicked! Amount:', stakeAmount);
    console.log('🎯 STAKE ACTION: Current state:', {
      stakingContractAddress,
      lpTokenAddress,
      canStake,
      stakeAmount,
      secretjs: !!secretjs,
      walletAddress,
      stakingInfo: !!stakingInfo,
    });

    if (!stakeAmount || stakeAmount === '0' || stakeAmount === '') {
      console.log('🎯 STAKE ACTION: No amount specified, cannot stake');
      return;
    }

    if (!secretjs) {
      console.log('🎯 STAKE ACTION: No secretjs client available');
      return;
    }

    if (!walletAddress) {
      console.log('🎯 STAKE ACTION: No wallet address available');
      return;
    }

    if (!stakingInfo) {
      console.log('🎯 STAKE ACTION: No staking info available');
      return;
    }

    try {
      console.log('🎯 STAKE ACTION: Executing real stake transaction...');
      console.log('🎯 STAKE ACTION: Calling stakeLpTokens with amount:', stakeAmount);

      const success = await stakeLpTokens(stakeAmount);

      if (success) {
        console.log('🎯 STAKE ACTION: Stake successful!');
        onTransactionComplete?.();
      } else {
        console.log('🎯 STAKE ACTION: Stake failed');
      }
    } catch (error) {
      console.error('🎯 STAKE ACTION: Error during stake:', error);
      console.error('🎯 STAKE ACTION: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  const handleUnstake = async () => {
    console.log('🎯 UNSTAKE ACTION: Real unstake button clicked! Amount:', unstakeAmount);

    if (!unstakeAmount || unstakeAmount === '0' || unstakeAmount === '') {
      console.log('🎯 UNSTAKE ACTION: No amount specified, cannot unstake');
      return;
    }

    try {
      console.log('🎯 UNSTAKE ACTION: Executing real unstake transaction...');
      const success = await unstakeLpTokens(unstakeAmount);

      if (success) {
        console.log('🎯 UNSTAKE ACTION: Unstake successful!');
        onTransactionComplete?.();
      } else {
        console.log('🎯 UNSTAKE ACTION: Unstake failed');
      }
    } catch (error) {
      console.error('🎯 UNSTAKE ACTION: Error during unstake:', error);
    }
  };

  const handleClaim = async () => {
    console.log('🎯 CLAIM ACTION: Real claim button clicked!');

    try {
      console.log('🎯 CLAIM ACTION: Executing real claim transaction...');
      const success = await claimStakingRewards();

      if (success) {
        console.log('🎯 CLAIM ACTION: Claim successful!');
        onTransactionComplete?.();
      } else {
        console.log('🎯 CLAIM ACTION: Claim failed');
      }
    } catch (error) {
      console.error('🎯 CLAIM ACTION: Error during claim:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Claim Rewards Button - Most prominent */}
      <motion.button
        onClick={() => void handleClaim()}
        disabled={!canStake || isOperationLoading('claim')}
        className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg ${
          !canStake || isOperationLoading('claim')
            ? 'bg-adamant-app-buttonDisabled text-adamant-app-boxHighlight cursor-not-allowed border border-adamant-box-border'
            : 'bg-adamant-button-form-main text-adamant-button-form-secondary hover:opacity-90 border border-adamant-box-border'
        }`}
        whileHover={canStake && !isOperationLoading('claim') ? { scale: 1.02, y: -2 } : {}}
        whileTap={canStake && !isOperationLoading('claim') ? { scale: 0.98 } : {}}
      >
        {isOperationLoading('claim') ? (
          <span className="flex items-center justify-center gap-3">
            <LoadingSpinner size={20} />
            <span>Claiming Rewards...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>Claim Rewards</span>
          </span>
        )}
      </motion.button>

      {/* Stake and Unstake Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          onClick={() => {
            console.log('🎯 STAKE ACTION: Button clicked! Checking conditions...');
            console.log('🎯 STAKE ACTION: canStake:', canStake);
            console.log(
              '🎯 STAKE ACTION: isOperationLoading("stake"):',
              isOperationLoading('stake')
            );
            console.log('🎯 STAKE ACTION: stakeAmount:', stakeAmount);

            if (!canStake) {
              console.log('🎯 STAKE ACTION: Cannot stake - canStake is false');
              return;
            }

            if (isOperationLoading('stake')) {
              console.log('🎯 STAKE ACTION: Cannot stake - operation already loading');
              return;
            }

            console.log('🎯 STAKE ACTION: Conditions passed, calling handleStake...');
            void handleStake();
          }}
          disabled={!canStake || isOperationLoading('stake')}
          className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 shadow-md ${
            !canStake || isOperationLoading('stake')
              ? 'bg-adamant-app-buttonDisabled text-adamant-app-boxHighlight cursor-not-allowed border border-adamant-box-border'
              : 'bg-adamant-button-form-main text-adamant-button-form-secondary hover:opacity-90 border border-adamant-box-border'
          }`}
          whileHover={canStake && !isOperationLoading('stake') ? { scale: 1.02 } : {}}
          whileTap={canStake && !isOperationLoading('stake') ? { scale: 0.98 } : {}}
        >
          {isOperationLoading('stake') ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size={16} />
              <span className="text-sm">Staking...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Stake</span>
            </span>
          )}
        </motion.button>

        <motion.button
          onClick={() => void handleUnstake()}
          disabled={!canStake || isOperationLoading('unstake')}
          className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 shadow-md ${
            !canStake || isOperationLoading('unstake')
              ? 'bg-adamant-app-buttonDisabled text-adamant-app-boxHighlight cursor-not-allowed border border-adamant-box-border'
              : 'bg-adamant-button-form-main text-adamant-button-form-secondary hover:opacity-90 border border-adamant-box-border'
          }`}
          whileHover={canStake && !isOperationLoading('unstake') ? { scale: 1.02 } : {}}
          whileTap={canStake && !isOperationLoading('unstake') ? { scale: 0.98 } : {}}
        >
          {isOperationLoading('unstake') ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size={16} />
              <span className="text-sm">Unstaking...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Unstake</span>
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
};
