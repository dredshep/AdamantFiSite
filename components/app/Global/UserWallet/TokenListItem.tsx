import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { ConfigToken } from '@/config/tokens';
import { useLoadBalancePreference } from '@/hooks/useLoadBalancePreference';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { RiRefreshLine } from 'react-icons/ri';

interface TokenListItemProps {
  token: ConfigToken;
}

export const TokenListItem = ({ token }: TokenListItemProps) => {
  const tokenAddress = token.address;
  const loadBalanceConfig = useLoadBalancePreference();

  // Only auto-fetch if preference allows it
  const { amount, loading, error, refetch } = useTokenBalance(
    tokenAddress,
    loadBalanceConfig.shouldAutoLoad
  );

  const balance = amount !== null && amount !== '' ? parseFloat(amount) : null;

  const formatBalance = (bal: number | null): string => {
    if (bal === null) return '0';
    if (bal < 0.001 && bal > 0) return bal.toFixed(8);
    return bal.toLocaleString('en-US', {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    });
  };

  return (
    <div className="group flex justify-between items-center cursor-pointer hover:bg-adamant-box-dark/50 py-3 rounded-xl px-3 transition-all duration-200 border border-transparent hover:border-adamant-gradientBright/20">
      <div className="flex items-center gap-3">
        <TokenImageWithFallback
          tokenAddress={tokenAddress}
          size={40}
          alt={token.symbol}
          className="rounded-lg"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-adamant-text-box-main group-hover:text-white transition-colors">
            {token.symbol}
          </span>
          <span className="text-xs text-adamant-text-box-secondary">{token.name}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 bg-adamant-box-dark animate-pulse rounded"></div>
              <RiRefreshLine className="w-3 h-3 animate-spin text-adamant-text-box-secondary" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Error</span>
              <button
                onClick={() => void refetch()}
                className="p-1 rounded hover:bg-adamant-box-dark/50 text-adamant-text-box-secondary hover:text-adamant-gradientBright transition-all"
                title="Retry"
              >
                <RiRefreshLine className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-sm font-medium text-adamant-text-box-main group-hover:text-white transition-colors">
              {formatBalance(balance)}
            </span>
          )}
        </div>
        {!loading && !error && (
          <span className="text-xs text-adamant-text-box-secondary uppercase tracking-wide">
            {token.symbol}
          </span>
        )}
      </div>
    </div>
  );
};
