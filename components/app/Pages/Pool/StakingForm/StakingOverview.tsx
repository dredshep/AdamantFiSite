import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { motion } from 'framer-motion';
import React from 'react';

interface StakingOverviewProps {
  stakedBalance: string | null;
  pendingRewards: string | null;
  rewardSymbol: string;
  isLoading: boolean;
}

const StakingOverview: React.FC<StakingOverviewProps> = ({
  stakedBalance,
  pendingRewards,
  rewardSymbol,
  isLoading,
}) => {
  // Helper to format numbers with commas
  const formatWithCommas = (value: string): string => {
    const num = parseFloat(value);
    return isNaN(num) ? '0' : num.toLocaleString('en-US', { maximumFractionDigits: 6 });
  };

  // Empty state for when there are no staked tokens yet
  if (!isLoading && (stakedBalance === null || stakedBalance === '0')) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center bg-adamant-app-box-darker p-6 rounded-xl gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <div className="text-lg text-gray-300 mb-1">No staked LP tokens</div>
          <div className="text-sm text-gray-500">
            Stake your LP tokens to start earning {rewardSymbol} rewards
          </div>
        </div>
      </motion.div>
    );
  }

  // Safely get formatted balance and rewards
  const formattedStakedBalance = stakedBalance !== null ? formatWithCommas(stakedBalance) : '0';
  const formattedPendingRewards = pendingRewards !== null ? formatWithCommas(pendingRewards) : '0';
  const hasPendingRewards =
    pendingRewards !== null && pendingRewards !== '0' && parseFloat(pendingRewards) > 0;

  return (
    <motion.div
      className="flex flex-col bg-adamant-app-box-darker p-4 rounded-xl gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col">
        <div className="text-sm text-gray-400 mb-1">Staked Balance</div>
        <div className="text-xl font-medium text-white">
          {isLoading ? (
            <div className="flex items-center gap-2 h-7">
              <LoadingSpinner size={20} />
              <span className="text-gray-500">Loading...</span>
            </div>
          ) : (
            <motion.div
              key={stakedBalance}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {formattedStakedBalance} LP
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex flex-col bg-adamant-app-box/30 p-3 rounded-lg">
        <div className="text-sm text-gray-400 mb-1">Pending Rewards</div>
        <div className="flex justify-between items-center">
          <div className="text-xl font-medium text-white">
            {isLoading ? (
              <div className="flex items-center gap-2 h-7">
                <LoadingSpinner size={20} />
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              <motion.div
                key={pendingRewards}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                {formattedPendingRewards}
                <span className="ml-1.5 text-sm text-green-400">{rewardSymbol}</span>
              </motion.div>
            )}
          </div>

          {!isLoading && hasPendingRewards && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatType: 'reverse',
                repeatDelay: 1.5,
              }}
              className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-medium"
            >
              Ready to claim
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StakingOverview;
