import { TokenBalanceError } from '@/hooks/useTokenBalance';
import React from 'react';
import FetchButton from './Forms/Input/TokenInput/FetchButton';
import SwapMaxButton from './Forms/Input/TokenInput/MaxButton';
import PoolMaxButton from './Forms/Input/TokenInput/PoolMaxButton';
import {
  InputIdentifier,
  PoolInputIdentifier,
  SwapInputIdentifier,
} from './Forms/Input/TokenInputBase';

interface TopRightBalanceProps {
  hasMax: boolean;
  balance: number | null;
  tokenSymbol: string;
  inputIdentifier?: InputIdentifier;
  loading?: boolean;
  error?: TokenBalanceError | null;
  onFetchBalance?: () => void;
  onFetchBalanceWithPriority?: (priority?: 'high' | 'normal' | 'low') => void;
  withLabel?: boolean;
}

const TopRightBalance: React.FC<TopRightBalanceProps> = ({
  hasMax,
  balance,
  tokenSymbol,
  inputIdentifier,
  loading = false,
  error = null,
  onFetchBalance,
  onFetchBalanceWithPriority,
  withLabel = true,
}) => {
  const handleFetchClick = () => {
    if (onFetchBalanceWithPriority) {
      onFetchBalanceWithPriority('high'); // Prioritize form-related balance fetching
    } else if (onFetchBalance) {
      onFetchBalance();
    }
  };

  const isSwapInput = typeof inputIdentifier === 'string' && inputIdentifier.startsWith('swap.');
  const showMaxButton = hasMax && inputIdentifier;

  return (
    <div
      className="flex items-center gap-2"
      onClick={() => (error ? alert(JSON.stringify(error)) : null)}
    >
      <div className="flex items-center gap-1">
        {withLabel && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Available: {balance !== null ? balance.toFixed(6) : '-'} {tokenSymbol}
            </span>
            <FetchButton
              loading={loading}
              error={!!error}
              hasBalance={balance !== null}
              onFetch={handleFetchClick}
            />
          </div>
        )}
        {showMaxButton &&
          (isSwapInput ? (
            <SwapMaxButton
              inputIdentifier={inputIdentifier as SwapInputIdentifier}
              balance={balance ?? 0}
            />
          ) : (
            <PoolMaxButton poolInputIdentifier={inputIdentifier as PoolInputIdentifier} />
          ))}
      </div>
    </div>
  );
};

export default TopRightBalance;
