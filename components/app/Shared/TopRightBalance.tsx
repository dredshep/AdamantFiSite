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
  const showMaxButton =
    hasMax &&
    typeof inputIdentifier === 'string' &&
    inputIdentifier.length > 0 &&
    !loading &&
    error === null &&
    balance !== null;

  const isSwapInput = typeof inputIdentifier === 'string' && inputIdentifier.startsWith('swap.');

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-gray-400 text-sm">
        {withLabel && <span>Balance:</span>}
        {loading ? (
          <AiOutlineLoading3Quarters className="animate-spin h-3.5 w-3.5" />
        ) : error !== null ? (
          <div className="flex items-center gap-1 text-red-400">
            <BiErrorCircle className="h-3.5 w-3.5" />
            <span>Error</span>
          </div>
        ) : balance === null ? (
          <button
            onClick={onFetchBalance}
            className="px-2 py-0.5 text-xs bg-gray-700/30 hover:bg-gray-700/50 rounded-full transition-colors flex items-center gap-1"
            title="Fetch balance"
            disabled={loading}
          >
            <FiRefreshCw className="h-3 w-3" />
            <span>Fetch</span>
          </button>
        ) : (
          <span className="tabular-nums text-right">
            {balance.toFixed(6)} {tokenSymbol}
          </span>
        )}
      </div>
      {showMaxButton &&
        (isSwapInput ? (
          <SwapMaxButton
            inputIdentifier={inputIdentifier as SwapInputIdentifier}
            balance={balance}
          />
        ) : (
          <PoolMaxButton poolInputIdentifier={inputIdentifier as PoolInputIdentifier} />
        ))}
    </div>
  );
};

export default TopRightBalance;
