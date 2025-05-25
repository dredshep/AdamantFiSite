import { LpTokenBalanceError } from '@/hooks/useLpTokenBalance';
import React from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle } from 'react-icons/bi';
import { FiRefreshCw } from 'react-icons/fi';
import { HiOutlinePlus } from 'react-icons/hi';
import PoolMaxButton from './Forms/Input/TokenInput/PoolMaxButton';
import { PoolInputIdentifier } from './Forms/Input/TokenInputBase';

interface TopRightBalanceLpProps {
  balance: string | null;
  loading: boolean;
  error: LpTokenBalanceError | null;
  tokenSymbol: string;
  hasMax?: boolean;
  inputIdentifier?: PoolInputIdentifier;
  onFetchBalance?: () => void;
  onSuggestToken?: () => void;
  withLabel?: boolean;
}

const TopRightBalanceLp: React.FC<TopRightBalanceLpProps> = ({
  balance,
  loading,
  error,
  tokenSymbol,
  hasMax = false,
  inputIdentifier,
  onFetchBalance,
  onSuggestToken,
  withLabel = true,
}) => {
  const formatBalance = (bal: string | null): string => {
    if (bal === null || bal === undefined) return '0';
    const num = parseFloat(bal);
    if (isNaN(num)) return '0';
    return num.toFixed(6);
  };

  const getErrorMessage = (errorType: LpTokenBalanceError): string => {
    switch (errorType) {
      case LpTokenBalanceError.NO_KEPLR:
        return 'Keplr not found';
      case LpTokenBalanceError.NO_VIEWING_KEY:
        return 'No viewing key';
      case LpTokenBalanceError.VIEWING_KEY_REJECTED:
        return 'Key rejected';
      case LpTokenBalanceError.LP_TOKEN_NOT_FOUND:
        return 'LP token not found';
      case LpTokenBalanceError.NETWORK_ERROR:
        return 'Network error';
      default:
        return 'Error';
    }
  };

  const handleFetchClick = () => {
    console.log('🔄 Fetch button clicked');
    if (onFetchBalance) {
      onFetchBalance();
    } else {
      console.log('❌ No onFetchBalance callback provided');
    }
  };

  const handleSuggestClick = () => {
    console.log('📤 Suggest token button clicked');
    if (onSuggestToken) {
      onSuggestToken();
    } else {
      console.log('❌ No onSuggestToken callback provided');
    }
  };

  const getActionButton = () => {
    if (loading) {
      return (
        <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
          <AiOutlineLoading3Quarters className="h-3 w-3 animate-spin" />
          Loading...
        </button>
      );
    }

    if (error) {
      const errorMessage = getErrorMessage(error);

      if (
        error === LpTokenBalanceError.NO_VIEWING_KEY ||
        error === LpTokenBalanceError.LP_TOKEN_NOT_FOUND
      ) {
        return (
          <button
            onClick={handleSuggestClick}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            title="Add LP token to Keplr"
          >
            <HiOutlinePlus className="h-3 w-3" />
            Add Token
          </button>
        );
      }

      return (
        <button
          onClick={handleFetchClick}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
          title={`${errorMessage} - Click to retry`}
        >
          <BiErrorCircle className="h-3 w-3" />
          {errorMessage}
        </button>
      );
    }

    if (balance !== null) {
      return (
        <button
          onClick={handleFetchClick}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
          title="Refresh balance"
        >
          <FiRefreshCw className="h-3 w-3" />
          Refresh
        </button>
      );
    }

    return (
      <button
        onClick={handleFetchClick}
        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        title="Fetch balance"
      >
        <FiRefreshCw className="h-3 w-3" />
        Fetch
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end gap-1">
        {withLabel && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Balance: {formatBalance(balance)} {tokenSymbol}
            </span>
            {getActionButton()}
          </div>
        )}
        {hasMax && inputIdentifier && <PoolMaxButton poolInputIdentifier={inputIdentifier} />}
      </div>
    </div>
  );
};

export default TopRightBalanceLp;
