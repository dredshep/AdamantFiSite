import { TokenBalanceError } from '@/hooks/useTokenBalance';
import React from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle } from 'react-icons/bi';
import { FiRefreshCw } from 'react-icons/fi';
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
  withLabel = true,
}) => {
  console.log('🎨 TopRightBalance render:', {
    balance,
    loading,
    error,
    tokenSymbol,
    hasMax,
    inputIdentifier,
    hasFetchCallback: !!onFetchBalance,
  });

  const handleFetchClick = () => {
    console.log('🔄 Regular TopRightBalance Fetch button clicked');
    if (onFetchBalance) {
      console.log('✅ Calling onFetchBalance callback');
      onFetchBalance();
    } else {
      console.log('❌ No onFetchBalance callback provided');
    }
  };

  const isSwapInput = typeof inputIdentifier === 'string' && inputIdentifier.startsWith('swap.');
  const showMaxButton = hasMax && inputIdentifier;

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end gap-1">
        {withLabel && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Balance: {balance !== null ? balance.toFixed(6) : '0'} {tokenSymbol}
            </span>
            {loading ? (
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <AiOutlineLoading3Quarters className="h-3 w-3 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : error ? (
              <button
                onClick={handleFetchClick}
                className="px-2 py-0.5 text-xs bg-red-700/30 hover:bg-red-700/50 rounded-full transition-colors flex items-center gap-1"
                title="Error - Click to retry"
                disabled={loading}
              >
                <BiErrorCircle className="h-3 w-3" />
                <span>Error</span>
              </button>
            ) : balance === null ? (
              <button
                onClick={handleFetchClick}
                className="px-2 py-0.5 text-xs bg-gray-700/30 hover:bg-gray-700/50 rounded-full transition-colors flex items-center gap-1"
                title="Fetch balance"
                disabled={loading}
              >
                <FiRefreshCw className="h-3 w-3" />
                <span>Fetch</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="tabular-nums text-right">
                  {balance.toFixed(6)} {tokenSymbol}
                </span>
                {onFetchBalance && (
                  <button
                    onClick={handleFetchClick}
                    className="px-1 py-0.5 text-xs bg-gray-700/20 hover:bg-gray-700/40 rounded transition-colors flex items-center"
                    title="Refresh balance"
                    disabled={loading}
                  >
                    <FiRefreshCw className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
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
