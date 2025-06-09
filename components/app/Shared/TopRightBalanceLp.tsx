import React from 'react';
import FetchButton from './Forms/Input/TokenInput/FetchButton';
import PoolMaxButton from './Forms/Input/TokenInput/PoolMaxButton';
import { PoolInputIdentifier } from './Forms/Input/TokenInputBase';

interface TopRightBalanceLpProps {
  balance: string | null;
  loading: boolean;
  error: string | null;
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

  const shouldShowAddToken =
    error &&
    (error.toLowerCase().includes('viewing key') || error.toLowerCase().includes('not found'));

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end gap-1">
        {withLabel && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Balance: {formatBalance(balance)} {tokenSymbol}
            </span>
            <FetchButton
              loading={loading}
              error={!!error}
              hasBalance={balance !== null}
              errorMessage={error ?? 'Error'}
              showAddToken={!!shouldShowAddToken}
              onFetch={handleFetchClick}
              onAddToken={handleSuggestClick}
            />
          </div>
        )}
        {hasMax && inputIdentifier && <PoolMaxButton poolInputIdentifier={inputIdentifier} />}
      </div>
    </div>
  );
};

export default TopRightBalanceLp;
