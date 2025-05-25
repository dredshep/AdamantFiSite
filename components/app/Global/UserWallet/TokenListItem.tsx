import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import TopRightBalance from '@/components/app/Shared/TopRightBalance';
import { ConfigToken } from '@/config/tokens';
import { useLoadBalancePreference } from '@/hooks/useLoadBalancePreference';
import { useTokenBalance } from '@/hooks/useTokenBalance';

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
      <div className="flex flex-col items-end">
        <TopRightBalance
          hasMax={false}
          balance={balance}
          tokenSymbol={token.symbol}
          loading={loading}
          error={error}
          onFetchBalance={() => void refetch()}
          withLabel={false}
        />
      </div>
    </div>
  );
};
