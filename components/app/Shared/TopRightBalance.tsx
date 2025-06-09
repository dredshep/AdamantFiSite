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
  error?: string | null;
  onFetchBalance?: () => void;
  onSuggestToken?: () => void;
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
  onSuggestToken,
  withLabel = true,
}) => {
  const handleFetchClick = () => {
    if (onFetchBalance) {
      onFetchBalance();
    }
  };

  const handleSuggestClick = () => {
    if (onSuggestToken) {
      onSuggestToken();
    }
  };

  const isSwapInput = typeof inputIdentifier === 'string' && inputIdentifier.startsWith('swap.');
  const showMaxButton = hasMax && inputIdentifier;
  const shouldShowAddToken =
    error &&
    (error.toLowerCase().includes('viewing key') || error.toLowerCase().includes('not found'));

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end gap-1">
        {withLabel && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Balance: {balance !== null ? balance.toFixed(6) : '0'} {tokenSymbol}
            </span>
            <FetchButton
              loading={loading}
              error={!!error}
              hasBalance={balance !== null}
              onFetch={handleFetchClick}
              errorMessage={error ?? 'Error'}
              showAddToken={!!shouldShowAddToken}
              onAddToken={handleSuggestClick}
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
