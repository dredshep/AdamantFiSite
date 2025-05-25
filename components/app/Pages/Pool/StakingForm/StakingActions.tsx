import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { motion } from 'framer-motion';
import React from 'react';

interface StakingActionsProps {
  onStake: () => void;
  onUnstake: () => void;
  onClaim: () => void;
  isStakeDisabled: boolean;
  isUnstakeDisabled: boolean;
  isClaimDisabled: boolean;
  isStakeLoading: boolean;
  isUnstakeLoading: boolean;
  isClaimLoading: boolean;
}

const StakingActions: React.FC<StakingActionsProps> = ({
  onStake,
  onUnstake,
  onClaim,
  isStakeDisabled,
  isUnstakeDisabled,
  isClaimDisabled,
  isStakeLoading,
  isUnstakeLoading,
  isClaimLoading,
}) => {
  return (
    <div className="space-y-4">
      {/* Claim Rewards Button - Most prominent */}
      <motion.button
        onClick={onClaim}
        disabled={isClaimDisabled || isClaimLoading}
        className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg ${
          isClaimDisabled
            ? 'bg-adamant-app-buttonDisabled text-adamant-app-boxHighlight cursor-not-allowed border border-adamant-box-border'
            : 'bg-adamant-button-form-main text-adamant-button-form-secondary hover:opacity-90 border border-adamant-box-border'
        }`}
        whileHover={!isClaimDisabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!isClaimDisabled ? { scale: 0.98 } : {}}
      >
        {isClaimLoading ? (
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
          onClick={onStake}
          disabled={isStakeDisabled || isStakeLoading}
          className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 shadow-md ${
            isStakeDisabled
              ? 'bg-adamant-app-buttonDisabled text-adamant-app-boxHighlight cursor-not-allowed border border-adamant-box-border'
              : 'bg-adamant-button-form-main text-adamant-button-form-secondary hover:opacity-90 border border-adamant-box-border'
          }`}
          whileHover={!isStakeDisabled ? { scale: 1.02 } : {}}
          whileTap={!isStakeDisabled ? { scale: 0.98 } : {}}
        >
          {isStakeLoading ? (
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
          onClick={onUnstake}
          disabled={isUnstakeDisabled || isUnstakeLoading}
          className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 shadow-md ${
            isUnstakeDisabled
              ? 'bg-adamant-app-buttonDisabled text-adamant-app-boxHighlight cursor-not-allowed border border-adamant-box-border'
              : 'bg-adamant-button-form-main text-adamant-button-form-secondary hover:opacity-90 border border-adamant-box-border'
          }`}
          whileHover={!isUnstakeDisabled ? { scale: 1.02 } : {}}
          whileTap={!isUnstakeDisabled ? { scale: 0.98 } : {}}
        >
          {isUnstakeLoading ? (
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

export default StakingActions;
