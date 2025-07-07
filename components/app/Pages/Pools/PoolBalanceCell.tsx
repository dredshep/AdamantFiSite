import { LoadingPlaceholder } from '@/components/app/Shared/Forms/Input/InputWrappers';
import { PoolBalanceData } from '@/hooks/useMultiplePoolBalances';
import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import React from 'react';
import { RiErrorWarningLine, RiRefreshLine } from 'react-icons/ri';

interface PoolBalanceCellProps {
  poolData: PoolBalanceData | undefined;
  lpTokenAddress: string;
  isLoading?: boolean;
}

export const PoolBalanceCell: React.FC<PoolBalanceCellProps> = ({
  poolData,
  lpTokenAddress,
  isLoading = false,
}) => {
  const { suggestToken } = useBalanceFetcherStore();

  const handleSetLpViewingKey = () => {
    void suggestToken(lpTokenAddress);
  };

  if (isLoading || !poolData) {
    return <LoadingPlaceholder size="medium" />;
  }

  // Check for any errors or loading states
  const hasErrors = poolData.lpError || poolData.stakedError;
  const hasViewingKeyIssues = poolData.lpNeedsViewingKey || poolData.stakedNeedsViewingKey;
  const isAnyLoading = poolData.lpLoading || poolData.stakedLoading;

  // Show loading if any balance is loading
  if (isAnyLoading) {
    return <LoadingPlaceholder size="medium" />;
  }

  // Show error states with actionable UI
  if (hasViewingKeyIssues) {
    return (
      <div className="text-right flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-600/20 px-2 py-1 rounded-md border border-orange-500/20">
          <RiErrorWarningLine className="w-3 h-3 text-orange-400" />
          <span className="text-xs font-medium text-orange-400">Key Required</span>
        </div>
        <button
          onClick={handleSetLpViewingKey}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-adamant-gradientBright/10 hover:bg-adamant-gradientBright/20 border border-adamant-gradientBright/20 hover:border-adamant-gradientBright/40 rounded-md text-adamant-gradientBright hover:text-white transition-all duration-200"
        >
          <RiRefreshLine className="w-3 h-3" />
          Set Key
        </button>
      </div>
    );
  }

  // Show other errors
  if (hasErrors) {
    return (
      <div className="text-right flex flex-col items-end gap-1">
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-red-600/20 px-2 py-1 rounded-md border border-red-500/20">
          <RiErrorWarningLine className="w-3 h-3 text-red-400" />
          <span className="text-xs font-medium text-red-400">Error</span>
        </div>
        <div className="flex gap-1">
          {poolData.lpError && (
            <button
              onClick={poolData.retryLpBalance}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-adamant-gradientBright/10 hover:bg-adamant-gradientBright/20 border border-adamant-gradientBright/20 hover:border-adamant-gradientBright/40 rounded-md text-adamant-gradientBright hover:text-white transition-all duration-200"
            >
              <RiRefreshLine className="w-3 h-3" />
              Retry LP
            </button>
          )}
          {poolData.stakedError && (
            <button
              onClick={poolData.retryStakedBalance}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-adamant-gradientBright/10 hover:bg-adamant-gradientBright/20 border border-adamant-gradientBright/20 hover:border-adamant-gradientBright/40 rounded-md text-adamant-gradientBright hover:text-white transition-all duration-200"
            >
              <RiRefreshLine className="w-3 h-3" />
              Retry Staked
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show balance information
  if (poolData.hasAnyBalance) {
    return (
      <div className="text-right flex flex-col items-end gap-1">
        {poolData.lpBalance !== '-' && parseFloat(poolData.lpBalance) > 0 && (
          <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 px-2 py-1 rounded-md border border-blue-500/20">
            <span className="text-xs font-medium text-blue-400">
              {parseFloat(poolData.lpBalance).toFixed(2)} LP
            </span>
          </div>
        )}
        {poolData.stakedBalance !== '-' && parseFloat(poolData.stakedBalance) > 0 && (
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 px-2 py-1 rounded-md border border-yellow-500/20">
            <span className="text-xs font-medium text-yellow-400">
              {parseFloat(poolData.stakedBalance).toFixed(2)} Staked
            </span>
          </div>
        )}
      </div>
    );
  }

  // No balance
  return (
    <div className="text-right flex justify-end">
      <span className="text-adamant-text-box-secondary text-sm">-</span>
    </div>
  );
};
