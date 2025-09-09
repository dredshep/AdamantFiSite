import { LpTokenBalanceError } from '@/hooks/useLpTokenBalance';
import React from 'react';
import FetchButton from './Forms/Input/TokenInput/FetchButton';
import PoolMaxButton from './Forms/Input/TokenInput/PoolMaxButton';
import { PoolInputIdentifier } from './Forms/Input/TokenInputBase';
import AddLpViewingKeyButton from './ViewingKeys/AddLpViewingKeyButton';

interface TopRightBalanceLpProps {
  balance: string | null;
  loading: boolean;
  error: LpTokenBalanceError | null;
  tokenSymbol: string;
  tokenAddress: string;
  hasMax?: boolean;
  inputIdentifier?: PoolInputIdentifier;
  onFetchBalance?: () => void;
  withLabel?: boolean;
}

const TopRightBalanceLp: React.FC<TopRightBalanceLpProps> = ({
  balance,
  loading,
  error,
  tokenSymbol,
  tokenAddress,
  hasMax = false,
  inputIdentifier,
  onFetchBalance,
  withLabel = true,
}) => {
  const formatBalance = (bal: string | null): string => {
    if (bal === null || bal === undefined) return '-';
    if (bal === '-') return '-'; // Handle unfetched state from centralized store
    const num = parseFloat(bal);
    if (isNaN(num)) return '-';
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
    if (onFetchBalance) {
      onFetchBalance();
    }
  };

  // Show AddLpViewingKeyButton when we have viewing key errors
  const showAddLpKeyButton =
    error &&
    (error === LpTokenBalanceError.NO_VIEWING_KEY ||
      error === LpTokenBalanceError.LP_TOKEN_NOT_FOUND ||
      error === LpTokenBalanceError.VIEWING_KEY_REJECTED);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end gap-1">
        {withLabel && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Available: {formatBalance(balance)} {tokenSymbol}
            </span>

            {showAddLpKeyButton ? (
              <AddLpViewingKeyButton
                error={error}
                onSuccess={handleFetchClick}
                tokenSymbol={tokenSymbol}
                tokenAddress={tokenAddress}
              />
            ) : (
              <FetchButton
                loading={loading}
                error={!!error}
                hasBalance={balance !== null && balance !== '-'}
                errorMessage={error ? getErrorMessage(error) : 'Error'}
                onFetch={handleFetchClick}
              />
            )}
          </div>
        )}
        {hasMax && inputIdentifier && <PoolMaxButton poolInputIdentifier={inputIdentifier} />}
      </div>
    </div>
  );
};

export default TopRightBalanceLp;
