import { useRewardEstimates } from '@/hooks/staking/useRewardEstimates';
import { usePoolStore } from '@/store/forms/poolStore';
import { useStakingStore } from '@/store/staking/stakingStore';
import { getStakingContractInfoForPool } from '@/utils/staking/stakingRegistry';
import { AlertTriangle, Check, TrendingUp } from 'lucide-react';
import React from 'react';

interface AutoStakeOptionProps {
  disabled?: boolean;
}

const AutoStakeOption: React.FC<AutoStakeOptionProps> = ({ disabled = false }) => {
  const { autoStake, setAutoStake } = useStakingStore();
  const { selectedPool, tokenInputs } = usePoolStore();

  // Get staking info and reward estimates
  const stakingInfo = selectedPool
    ? getStakingContractInfoForPool(selectedPool.pairContract)
    : null;
  const lpTokenAddress = stakingInfo?.lpTokenAddress;
  const rewardEstimates = useRewardEstimates(lpTokenAddress || '');

  // Calculate estimated LP amount based on current inputs
  // This is a rough estimate - actual LP amount depends on pool ratios
  const tokenAAmount = parseFloat(tokenInputs['pool.deposit.tokenA']?.amount || '0');
  const tokenBAmount = parseFloat(tokenInputs['pool.deposit.tokenB']?.amount || '0');

  // Simple estimate: assume equal value in both tokens for LP calculation
  // In reality, this would need to consider current pool ratios
  const estimatedLpAmount = Math.min(tokenAAmount, tokenBAmount);

  // Get reward estimates for the estimated LP amount
  const estimates =
    estimatedLpAmount > 0 && stakingInfo
      ? rewardEstimates.estimateRewardsForAmount(estimatedLpAmount.toString())
      : null;

  // Helper to format numbers cleanly
  const formatBalance = (value: number): string => {
    if (value < 0.001) return value.toFixed(8);
    return value.toLocaleString('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    });
  };

  const handleToggleAutoStake = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoStake(e.target.checked);
  };

  const hasRewardEstimates = estimates && estimates.dailyRewards > 0;

  return (
    <div className="space-y-3">
      {/* Main checkbox option */}
      <div className="flex items-center px-4 py-3 bg-adamant-app-box rounded-xl border border-adamant-box-border hover:border-adamant-accentText/30 transition-all duration-200">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="autoStake"
            checked={autoStake}
            onChange={handleToggleAutoStake}
            disabled={disabled}
            className="sr-only"
          />
          <label
            htmlFor="autoStake"
            className={`relative flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200 cursor-pointer ${
              disabled
                ? 'border-adamant-app-buttonDisabled bg-adamant-app-buttonDisabled/20'
                : autoStake
                ? 'border-adamant-accentText bg-adamant-accentText'
                : 'border-adamant-text-form-secondary bg-adamant-app-input hover:border-adamant-accentText/50'
            }`}
          >
            {autoStake && !disabled && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </label>
        </div>
        <div className="ml-3 flex-1">
          <label
            htmlFor="autoStake"
            className={`text-sm font-medium cursor-pointer ${
              disabled ? 'text-adamant-app-buttonDisabled' : 'text-adamant-text-form-main'
            }`}
          >
            Auto-stake LP tokens to earn {stakingInfo?.rewardTokenSymbol || 'bADMT'} rewards
          </label>
          {hasRewardEstimates && autoStake && !disabled && (
            <p className="text-xs text-adamant-accentText mt-1">
              Estimated: {formatBalance(estimates.dailyRewards)} {stakingInfo?.rewardTokenSymbol}
              /day
            </p>
          )}
        </div>
      </div>

      {/* Reward Estimates - Show when enabled and estimates available */}
      {autoStake && !disabled && hasRewardEstimates && (
        <div className="bg-adamant-accentText/5 backdrop-blur-sm rounded-xl p-4 border border-adamant-accentText/20">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-adamant-accentText" />
            <h4 className="text-sm font-medium text-adamant-accentText">
              Auto-Stake Rewards Preview
            </h4>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-adamant-text-box-secondary">Daily</p>
              <p className="font-medium text-adamant-text-box-main">
                {formatBalance(estimates.dailyRewards)}
              </p>
              <p className="text-adamant-text-box-secondary">{stakingInfo?.rewardTokenSymbol}</p>
            </div>
            <div>
              <p className="text-adamant-text-box-secondary">Weekly</p>
              <p className="font-medium text-adamant-text-box-main">
                {formatBalance(estimates.weeklyRewards)}
              </p>
              <p className="text-adamant-text-box-secondary">{stakingInfo?.rewardTokenSymbol}</p>
            </div>
            <div>
              <p className="text-adamant-text-box-secondary">Monthly</p>
              <p className="font-medium text-adamant-text-box-main">
                {formatBalance(estimates.monthlyRewards)}
              </p>
              <p className="text-adamant-text-box-secondary">{stakingInfo?.rewardTokenSymbol}</p>
            </div>
          </div>

          <p className="text-xs text-adamant-text-box-secondary mt-2">
            * Estimates based on current pool conditions and may vary
          </p>
        </div>
      )}

      {/* Transaction flow warning */}
      {autoStake && !disabled && (
        <div className="flex items-start gap-3 px-4 py-3 bg-adamant-accentText/10 border border-adamant-accentText/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-adamant-accentText mt-0.5 flex-shrink-0" />
          <div className="text-xs text-adamant-text-form-secondary leading-relaxed">
            <span className="font-medium text-adamant-accentText">Two transactions required:</span>
            <br />
            1. Provide liquidity (approve and wait for confirmation)
            <br />
            2. Auto-stake LP tokens (approve second transaction)
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoStakeOption;
