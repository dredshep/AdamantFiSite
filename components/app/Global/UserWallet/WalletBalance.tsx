import { TOKENS } from '@/config/tokens';
import { DEFAULT_BALANCE_STATE, useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { useViewingKeyModalStore } from '@/store/viewingKeyModalStore';
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
  const openViewingKeyModal = useViewingKeyModalStore((state) => state.open);

  // Auto-fetch balance when component mounts
  useEffect(() => {
    addToQueue(tokenAddress, 'WalletBalance:AutoFetch');
  }, [tokenAddress, addToQueue]);

  const handleRefresh = () => {
    addToQueue(tokenAddress, 'WalletBalance:Refresh');
  };

  // Tokens that should be rounded (stable coins and low-value tokens)
  const shouldRoundBalance = (symbol: string): boolean => {
    const roundableTokens = ['USDC', 'sSCRT', 'SILK', 'USDT', 'DAI'];
    return roundableTokens.includes(symbol.toUpperCase());
  };

  const formatBalance = (balance: string, symbol: string) => {
    if (balance === '-') return '-';
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.000001) return '< 0.000001';

    // Round certain tokens to 2-3 decimals for better readability
    if (shouldRoundBalance(symbol)) {
      if (num >= 1) {
        return num.toFixed(2); // 2 decimals for values >= 1
      } else {
        return num.toFixed(3); // 3 decimals for values < 1
      }
    }

    return num.toFixed(6); // Default 6 decimals for other tokens
  };

  const getFullBalance = (balance: string): string => {
    if (balance === '-') return '-';
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.000001) return '< 0.000001';
    return num.toFixed(8); // Show more precision in tooltip
  };

  const handleOpenViewingKeyModal = () => {
    // Find the token configuration
    const token = TOKENS.find((t) => t.address === tokenAddress);
    if (token) {
      openViewingKeyModal(token, 'wallet-balance', () => {
        // Refresh balance after successful viewing key creation
        addToQueue(tokenAddress, 'WalletBalance:PostViewingKey');
      });
    } else {
      console.warn('Token not found for viewing key setup:', tokenAddress);
    }
  };

  const displayBalance = formatBalance(balanceState.balance, tokenSymbol);
  const fullBalance = getFullBalance(balanceState.balance);
  const showTooltip =
    shouldRoundBalance(tokenSymbol) &&
    balanceState.balance !== '-' &&
    displayBalance !== fullBalance;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1">
        <span
          className="text-base font-sans text-white font-medium"
          title={showTooltip ? `Full balance: ${fullBalance} ${tokenSymbol}` : undefined}
        >
          {displayBalance}
        </span>
        <span className="text-sm text-white font-normal">{tokenSymbol}</span>
      </div>

      {balanceState.loading && (
        <div className="w-3 h-3 border border-adamant-gradientBright border-t-transparent rounded-full animate-spin"></div>
      )}

      {balanceState.needsViewingKey && (
        <button
          onClick={handleOpenViewingKeyModal}
          className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 hover:text-yellow-300 rounded transition-colors border border-yellow-500/30 whitespace-nowrap flex-shrink-0"
          title="Click to set viewing key in Keplr"
        >
          <RiKeyLine className="w-3 h-3" />
          Set Key
        </button>
      )}

      {balanceState.error && !balanceState.needsViewingKey && (
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
        balanceState.balance !== '-' && (
          <button
            onClick={handleRefresh}
            className="p-1 text-adamant-text-box-secondary hover:text-white transition-colors opacity-0 group-hover:opacity-100"
            title="Refresh balance"
          >
            <RiRefreshLine className="w-3 h-3" />
          </button>
        )}
    </div>
  );
};

export default WalletBalance;
