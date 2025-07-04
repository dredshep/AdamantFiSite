import { DEFAULT_BALANCE_STATE, useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { SecretString } from '@/types';
import React, { useEffect } from 'react';
import { RiKeyLine, RiRefreshLine } from 'react-icons/ri';

interface WalletBalanceProps {
  tokenAddress: SecretString;
  tokenSymbol: string;
  className?: string;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({
  tokenAddress,
  tokenSymbol,
  className = '',
}) => {
  const balanceState = useBalanceFetcherStore(
    (state) => state.balances[tokenAddress] ?? DEFAULT_BALANCE_STATE
  );
  const addToQueue = useBalanceFetcherStore((state) => state.addToQueue);
  const suggestToken = useBalanceFetcherStore((state) => state.suggestToken);

  const [isSettingUpViewingKey, setIsSettingUpViewingKey] = React.useState(false);

  // Auto-fetch balance when component mounts
  useEffect(() => {
    addToQueue(tokenAddress, 'WalletBalance:AutoFetch');
  }, [tokenAddress, addToQueue]);

  const handleRefresh = () => {
    addToQueue(tokenAddress, 'WalletBalance:Refresh');
  };

  const formatBalance = (balance: string) => {
    if (balance === '-') return '-';
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.000001) return '< 0.000001';
    return num.toFixed(6);
  };

  const openKeplrForViewingKey = async () => {
    setIsSettingUpViewingKey(true);
    try {
      await suggestToken(tokenAddress);
    } finally {
      setIsSettingUpViewingKey(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-sm font-mono text-adamant-text-box-main">
          {formatBalance(balanceState.balance)}
        </span>
        <span className="text-xs text-adamant-text-box-secondary uppercase">{tokenSymbol}</span>
      </div>

      {(balanceState.loading || isSettingUpViewingKey) && (
        <div className="w-3 h-3 border border-adamant-gradientBright border-t-transparent rounded-full animate-spin"></div>
      )}

      {balanceState.needsViewingKey && !isSettingUpViewingKey && (
        <button
          onClick={openKeplrForViewingKey}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 hover:text-yellow-300 rounded-md transition-colors border border-yellow-500/30"
          title="Click to set viewing key in Keplr"
        >
          <RiKeyLine className="w-3 h-3" />
          Set Key
        </button>
      )}

      {balanceState.error && !balanceState.needsViewingKey && !isSettingUpViewingKey && (
        <button
          onClick={handleRefresh}
          className="p-1 text-red-400 hover:text-red-300 transition-colors"
          title={`Error: ${balanceState.error}. Click to retry.`}
        >
          <RiRefreshLine className="w-3 h-3" />
        </button>
      )}

      {!balanceState.loading &&
        !balanceState.error &&
        !balanceState.needsViewingKey &&
        !isSettingUpViewingKey &&
        balanceState.balance !== '-' && (
          <button
            onClick={handleRefresh}
            className="p-1 text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors opacity-0 group-hover:opacity-100"
            title="Refresh balance"
          >
            <RiRefreshLine className="w-3 h-3" />
          </button>
        )}
    </div>
  );
};

export default WalletBalance;
