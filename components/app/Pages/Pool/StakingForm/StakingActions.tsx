import { LoadingSpinner } from '@/components/common/LoadingSpinner';
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
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <button
          onClick={onClaim}
          disabled={isClaimDisabled || isClaimLoading}
          className={`w-full px-4 py-3 rounded-xl font-medium transition-colors ${
            isClaimDisabled
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white'
          }`}
        >
          {isClaimLoading ? (
            <span className="flex items-center justify-center">
              <LoadingSpinner size={16} className="mr-2" />
              Claiming Rewards...
            </span>
          ) : (
            'Claim Rewards'
          )}
        </button>
      </div>

      <button
        onClick={onStake}
        disabled={isStakeDisabled || isStakeLoading}
        className={`px-4 py-3 rounded-xl font-medium transition-colors ${
          isStakeDisabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
        }`}
      >
        {isStakeLoading ? (
          <span className="flex items-center justify-center">
            <LoadingSpinner size={16} className="mr-2" />
            Staking...
          </span>
        ) : (
          'Stake LP Tokens'
        )}
      </button>

      <button
        onClick={onUnstake}
        disabled={isUnstakeDisabled || isUnstakeLoading}
        className={`px-4 py-3 rounded-xl font-medium transition-colors ${
          isUnstakeDisabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
        }`}
      >
        {isUnstakeLoading ? (
          <span className="flex items-center justify-center">
            <LoadingSpinner size={16} className="mr-2" />
            Unstaking...
          </span>
        ) : (
          'Unstake LP Tokens'
        )}
      </button>
    </div>
  );
};

export default StakingActions;
