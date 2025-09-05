import DualTokenIcon from '@/components/app/Shared/DualTokenIcon';
import { LoadingPlaceholder } from '@/components/app/Shared/LoadingPlaceholder';
import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { SecretString } from '@/types';
import React from 'react';

interface UserPositionProps {
  userPosition: {
    status: 'loading' | 'success' | 'error' | 'no_viewing_key';
    data: {
      stakedBalance: string;
      pendingRewards: string;
      stakedValueUsd?: number;
      userSharePercentage: number;
      dailyEarnings?: number;
    } | null;
    error: string | null;
  };
  stakingInfo: {
    poolName: string;
    lpTokenAddress: string;
    stakingCodeHash: string;
    lpTokenCodeHash: string;
  };
  rewardSymbol: string;
}

export const UserPosition: React.FC<UserPositionProps> = ({
  userPosition,
  stakingInfo,
  rewardSymbol,
}) => {
  // Helper to format numbers cleanly
  const formatBalance = (value: string | number): string => {
    if (!value || value === '0') return '0';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    // For very small numbers, show more decimals
    if (num < 0.001) return num.toFixed(8);
    // For normal numbers, show up to 6 decimals but remove trailing zeros
    return num.toLocaleString('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    });
  };

  // Helper to format USD values
  const formatUsd = (value: number): string => {
    if (!value || isNaN(value)) return '$0.00';
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Helper to format percentage
  const formatPercentage = (value: number): string => {
    if (isNaN(value)) return '0%';
    return `${value.toFixed(2)}%`;
  };

  // Get LP token information for proper dual icon display
  const lpTokenInfo = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === stakingInfo.lpTokenAddress);
  const token0 = lpTokenInfo ? TOKENS.find((t) => t.symbol === lpTokenInfo.token0) : undefined;
  const token1 = lpTokenInfo ? TOKENS.find((t) => t.symbol === lpTokenInfo.token1) : undefined;

  // Get reward token for display
  const rewardToken = TOKENS.find((t) => t.symbol === rewardSymbol);

  // Check if user has staked tokens
  const hasStakedTokens =
    userPosition.data &&
    userPosition.data.stakedBalance !== '0' &&
    parseFloat(userPosition.data.stakedBalance) > 0;

  const hasPendingRewards =
    userPosition.data &&
    userPosition.data.pendingRewards !== '0' &&
    parseFloat(userPosition.data.pendingRewards) > 0;

  return (
    <div className="space-y-4">
      {/* Viewing Key Status Notice */}
      {userPosition.status === 'no_viewing_key' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            Valid viewing keys required to display your staking position. Please set up viewing keys
            above.
          </p>
        </div>
      )}

      {/* Error State */}
      {userPosition.status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">Failed to load your position: {userPosition.error}</p>
        </div>
      )}

      {/* Staked Balance */}
      <div className="bg-adamant-box-dark/50 backdrop-blur-sm rounded-xl p-4 border border-adamant-box-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {token0 && token1 ? (
              <DualTokenIcon
                token0Address={token0.address}
                token1Address={token1.address}
                token0Symbol={token0.symbol}
                token1Symbol={token1.symbol}
                size={40}
                className="rounded-lg"
              />
            ) : (
              <div className="w-10 h-10 bg-adamant-box-dark rounded-lg flex items-center justify-center">
                <span className="text-adamant-text-box-secondary text-xs">LP</span>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-adamant-text-box-main">Your Staked Position</p>
              <p className="text-xs text-adamant-text-box-secondary">LP Tokens</p>
              {userPosition.data?.stakedValueUsd && (
                <p className="text-xs text-adamant-text-box-secondary">
                  {formatUsd(userPosition.data.stakedValueUsd)}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            {userPosition.status === 'loading' ? (
              <LoadingPlaceholder size="medium" />
            ) : userPosition.status === 'success' && userPosition.data ? (
              <div className="text-xl font-semibold text-adamant-text-box-main">
                {formatBalance(userPosition.data.stakedBalance)}
              </div>
            ) : (
              <div className="text-xl font-semibold text-adamant-text-box-secondary">—</div>
            )}
          </div>
        </div>
      </div>

      {/* Pool Share */}
      {userPosition.status === 'success' && userPosition.data && (
        <div className="bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl p-4 border border-adamant-box-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-adamant-text-box-main">Your Pool Share</p>
              <p className="text-xs text-adamant-text-box-secondary">Percentage of total staked</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-adamant-text-box-main">
                {formatPercentage(userPosition.data.userSharePercentage)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Rewards */}
      {(hasPendingRewards || hasStakedTokens || userPosition.status === 'loading') && (
        <div className="bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl p-4 border border-adamant-accentText/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TokenImageWithFallback
                tokenAddress={rewardToken?.address || ('' as SecretString)}
                size={32}
                alt={`${rewardSymbol} rewards`}
                className="rounded-lg opacity-80"
              />
              <div>
                <p className="text-sm font-medium text-adamant-text-box-main">Pending Rewards</p>
                <p className="text-xs text-adamant-text-box-secondary">{rewardSymbol}</p>
                {userPosition.data?.dailyEarnings && userPosition.data.dailyEarnings > 0 && (
                  <p className="text-xs text-adamant-accentText">
                    +{formatBalance(userPosition.data.dailyEarnings)}/day
                  </p>
                )}
              </div>
            </div>

            <div className="text-right flex items-center gap-2">
              {userPosition.status === 'loading' ? (
                <LoadingPlaceholder size="small" />
              ) : userPosition.status === 'success' && userPosition.data ? (
                <>
                  <div className="text-xl font-semibold text-adamant-accentText">
                    {formatBalance(userPosition.data.pendingRewards)}
                  </div>
                  {hasPendingRewards && (
                    <div className="w-2 h-2 bg-adamant-accentText rounded-full animate-pulse"></div>
                  )}
                </>
              ) : (
                <div className="text-xl font-semibold text-adamant-text-box-secondary">—</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

