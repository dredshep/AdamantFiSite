import { TokenBalanceError } from '@/hooks/useTokenBalance';
import React from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle } from 'react-icons/bi';
import SwapMaxButton from './Forms/Input/TokenInput/MaxButton';
import PoolMaxButton from './Forms/Input/TokenInput/PoolMaxButton';
import {
    InputIdentifier,
    PoolInputIdentifier
} from './Forms/Input/TokenInputBase';

interface TopRightBalanceProps {
  hasMax: boolean;
  balance: number | null;
  tokenSymbol: string;
  inputIdentifier?: InputIdentifier;
  loading?: boolean;
  error?: TokenBalanceError | null;
}

const TopRightBalance: React.FC<TopRightBalanceProps> = ({
  hasMax,
  balance,
  tokenSymbol,
  inputIdentifier,
  loading = false,
  error = null,
}) => {
  const showMaxButton = 
    hasMax && 
    typeof inputIdentifier === 'string' && 
    inputIdentifier.length > 0 && 
    !loading && 
    error === null && 
    balance !== null;

  const isSwapInput = typeof inputIdentifier === 'string' && 
    inputIdentifier.startsWith('swap.');

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-gray-400 text-sm">
        <span>Balance:</span>
        {loading ? (
          <AiOutlineLoading3Quarters className="animate-spin h-3.5 w-3.5" />
        ) : error !== null ? (
          <div className="flex items-center gap-1 text-red-400">
            <BiErrorCircle className="h-3.5 w-3.5" />
            <span>Error</span>
          </div>
        ) : balance === null ? (
          <span className="text-gray-500">--</span>
        ) : (
          <span className="tabular-nums">
            {balance.toFixed(6)} {tokenSymbol}
          </span>
        )}
      </div>
      {showMaxButton && (
        isSwapInput ? (
          <SwapMaxButton
            inputIdentifier={inputIdentifier}
            balance={balance}
          />
        ) : (
          <PoolMaxButton poolInputIdentifier={inputIdentifier as PoolInputIdentifier} />
        )
      )}
    </div>
  );
};

export default TopRightBalance;
