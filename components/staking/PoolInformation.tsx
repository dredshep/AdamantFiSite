import DualTokenIcon from '@/components/app/Shared/DualTokenIcon';
import { LoadingPlaceholder } from '@/components/app/Shared/LoadingPlaceholder';
import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import React from 'react';

interface PoolInformationProps {
  poolData: {
    status: 'loading' | 'success' | 'error';
    data: {
      totalLocked: string;
      tvlUsd: number;
      dailyRewards: string;
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

export const PoolInformation: React.FC<PoolInformationProps> = ({
  poolData,
  stakingInfo,
  rewardSymbol,
}) => {
  // Helper to format numbers cleanly
  const formatBalance = (value: string): string => {
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

  // Get LP token information for proper dual icon display
  const lpTokenInfo = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === stakingInfo.lpTokenAddress);
  const token0 = lpTokenInfo ? TOKENS.find((t) => t.symbol === lpTokenInfo.token0) : undefined;
  const token1 = lpTokenInfo ? TOKENS.find((t) => t.symbol === lpTokenInfo.token1) : undefined;

  return (
    <div className="bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl p-6 border border-adamant-box-border">
      <div className="flex items-center gap-4 mb-6">
        {token0 && token1 ? (
          <DualTokenIcon
            token0Address={token0.address}
            token1Address={token1.address}
            token0Symbol={token0.symbol}
            token1Symbol={token1.symbol}
            size={48}
            className="rounded-lg"
          />
        ) : (
          <div className="w-12 h-12 bg-adamant-box-dark rounded-lg flex items-center justify-center">
            <span className="text-adamant-text-box-secondary text-xs">LP</span>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-adamant-text-box-main">
            {stakingInfo.poolName}
          </h2>
          <p className="text-sm text-adamant-text-box-secondary">Liquidity Pool Staking</p>
        </div>
      </div>

      {poolData.status === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">Failed to load pool information: {poolData.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Staked */}
        <div className="text-center">
          <p className="text-sm text-adamant-text-box-secondary mb-2">Total Staked</p>
          <div className="text-xl font-semibold text-adamant-text-box-main">
            {poolData.status === 'loading' ? (
              <LoadingPlaceholder size="medium" />
            ) : poolData.status === 'success' && poolData.data ? (
              `${formatBalance(poolData.data.totalLocked)} LP`
            ) : (
              '—'
            )}
          </div>
        </div>

        {/* TVL */}
        <div className="text-center">
          <p className="text-sm text-adamant-text-box-secondary mb-2">Total Value Locked</p>
          <div className="text-xl font-semibold text-adamant-text-box-main">
            {poolData.status === 'loading' ? (
              <LoadingPlaceholder size="medium" />
            ) : poolData.status === 'success' && poolData.data ? (
              formatUsd(poolData.data.tvlUsd)
            ) : (
              '—'
            )}
          </div>
        </div>

        {/* Daily Rewards */}
        <div className="text-center">
          <p className="text-sm text-adamant-text-box-secondary mb-2">Daily Rewards</p>
          <div className="text-xl font-semibold text-adamant-accentText">
            {poolData.status === 'loading' ? (
              <LoadingPlaceholder size="medium" />
            ) : poolData.status === 'success' && poolData.data ? (
              `${formatBalance(poolData.data.dailyRewards)} ${rewardSymbol}`
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

