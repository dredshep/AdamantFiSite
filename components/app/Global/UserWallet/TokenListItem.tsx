import PlaceholderImageFromSeed from '@/components/app/Shared/PlaceholderImageFromSeed';
import TopRightBalance from '@/components/app/Shared/TopRightBalance';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { Token } from '@/types';
import { getApiTokenAddress, getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import { formatUSD } from '@/utils/formatters';

interface TokenListItemProps {
  token: Token;
}

export const TokenListItem = ({ token }: TokenListItemProps) => {
  const tokenAddress = getApiTokenAddress(token);
  const { amount, loading, error, refetch } = useTokenBalance(tokenAddress);
  const balance = amount !== null && amount !== '' ? parseFloat(amount) : null;
  const usdValue =
    balance !== null && typeof token.price === 'number' ? balance * token.price : null;

  return (
    <div className="flex justify-between items-center cursor-pointer hover:bg-adamant-app-boxHighlight py-2 rounded-xl mx-2 px-2">
      <div className="flex items-center">
        <PlaceholderImageFromSeed seed={tokenAddress} size={40} />
        <div className="flex-grow ml-3 flex flex-col">
          <span className="font-bold">{getApiTokenSymbol(token)}</span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <TopRightBalance
          hasMax={false}
          balance={balance}
          tokenSymbol={getApiTokenSymbol(token)}
          loading={loading}
          error={error}
          onFetchBalance={() => void refetch()}
          withLabel={false}
        />
        {usdValue !== null && (
          <span className="text-xs text-adamant-accentText">{formatUSD(usdValue)}</span>
        )}
      </div>
    </div>
  );
};
