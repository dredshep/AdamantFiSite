import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { SecretString } from '@/types';
import { RefreshCw } from 'lucide-react';
import React from 'react';

interface StakingOverviewProps {
  stakedBalance: string | null;
  pendingRewards: string | null;
  rewardSymbol: string;
  isLoading: boolean;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  stakingContractAddress?: string;
  pairSymbol?: string;
}

const StakingOverview: React.FC<StakingOverviewProps> = ({
  stakedBalance,
  pendingRewards,
  rewardSymbol,
  isLoading,
  showRefreshButton = false,
  onRefresh,
  isRefreshing,
  stakingContractAddress = 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev',
  pairSymbol = 'LP',
}) => {
  // Helper to format numbers cleanly
  const formatBalance = (value: string | null): string => {
    if (!value || value === '0') return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';

    // For very small numbers, show more decimals
    if (num < 0.001) return num.toFixed(8);
    // For normal numbers, show up to 6 decimals but remove trailing zeros
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    });
  };

  const hasStakedTokens = stakedBalance && stakedBalance !== '0';
  const hasPendingRewards =
    pendingRewards && pendingRewards !== '0' && parseFloat(pendingRewards) > 0;

  // Empty state - but check if we need to fetch balances first
  if (!isLoading && !hasStakedTokens) {
    // If balances are null (not fetched yet) and we have a refresh function, show fetch button
    if (stakedBalance === null && showRefreshButton && onRefresh) {
      return (
        <div className="bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl p-6 border border-adamant-box-border">
          <div className="text-center space-y-4">
            <TokenImageWithFallback
              tokenAddress={stakingContractAddress as SecretString}
              size={56}
              alt={`${pairSymbol} staking pool`}
              className="mx-auto opacity-60"
            />
            <div>
              <h3 className="text-lg font-medium text-adamant-text-box-main mb-1">
                Staking balances not loaded
              </h3>
              <p className="text-adamant-text-box-secondary text-sm mb-4">
                Click below to check your staked {pairSymbol} tokens and {rewardSymbol} rewards
              </p>
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="bg-adamant-button-form-main hover:bg-adamant-button-form-main/80 disabled:bg-adamant-app-buttonDisabled text-adamant-button-form-secondary px-6 py-3 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Loading balances...' : 'Load staking balances'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // True empty state - balances were fetched and are actually zero
    return (
      <div className="bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl p-6 border border-adamant-box-border">
        <div className="text-center space-y-4">
          <TokenImageWithFallback
            tokenAddress={stakingContractAddress as SecretString}
            size={56}
            alt={`${pairSymbol} staking pool`}
            className="mx-auto opacity-60"
          />
          <div>
            <h3 className="text-lg font-medium text-adamant-text-box-main mb-1">
              No staked {pairSymbol} tokens
            </h3>
            <p className="text-adamant-text-box-secondary text-sm">
              Stake your LP tokens to earn {rewardSymbol} rewards
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Staked Balance - Simple and clean */}
      <div className="bg-adamant-box-dark/50 backdrop-blur-sm rounded-xl p-4 border border-adamant-box-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TokenImageWithFallback
              tokenAddress={stakingContractAddress as SecretString}
              size={32}
              alt={`${pairSymbol} staking`}
              className="rounded-lg"
            />
            <div>
              <p className="text-sm font-medium text-adamant-text-box-main">Staked</p>
              <p className="text-xs text-adamant-text-box-secondary">{pairSymbol} LP</p>
            </div>
          </div>

          <div className="text-right">
            {isLoading ? (
              <div className="h-6 w-20 bg-adamant-app-input/30 animate-pulse rounded"></div>
            ) : (
              <div className="text-xl font-semibold text-adamant-text-box-main">
                {formatBalance(stakedBalance)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Rewards - Only show if there are rewards or if loading */}
      {(hasPendingRewards || isLoading) && (
        <div className="bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl p-4 border border-adamant-accentText/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TokenImageWithFallback
                tokenAddress={stakingContractAddress as SecretString}
                size={32}
                alt={`${rewardSymbol} rewards`}
                className="rounded-lg opacity-80"
              />
              <div>
                <p className="text-sm font-medium text-adamant-text-box-main">Rewards</p>
                <p className="text-xs text-adamant-text-box-secondary">{rewardSymbol}</p>
              </div>
            </div>

            <div className="text-right flex items-center gap-2">
              {isLoading ? (
                <div className="h-6 w-16 bg-adamant-app-input/30 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="text-xl font-semibold text-adamant-accentText">
                    {formatBalance(pendingRewards)}
                  </div>
                  {hasPendingRewards && (
                    <div className="w-2 h-2 bg-adamant-accentText rounded-full animate-pulse"></div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button - Minimal when needed */}
      {showRefreshButton && (
        <div className="flex justify-center">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-adamant-text-box-secondary hover:text-adamant-accentText text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StakingOverview;
