// C:\Users\sebas\projects\AdamantFiSite\components\app\Global\UserWallet\TokenListItem.tsx

import PlaceholderImageFromSeed from '@/components/app/Shared/PlaceholderImageFromSeed';
import TopRightBalance from '@/components/app/Shared/TopRightBalance';
import { ConfigToken } from '@/config/tokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';

interface TokenListItemProps {
  token: ConfigToken;
}

export const TokenListItem = ({ token }: TokenListItemProps) => {
  const tokenAddress = token.address;
  const { amount, loading, error, refetch } = useTokenBalance(tokenAddress);
  const balance = amount !== null && amount !== '' ? parseFloat(amount) : null;

  return (
    <div className="flex justify-between items-center cursor-pointer hover:bg-adamant-app-boxHighlight py-2 rounded-xl px-2">
      <div className="flex items-center">
        <PlaceholderImageFromSeed seed={tokenAddress} size={40} />
        <div className="ml-3 flex flex-col">
          <span className="font-bold">{token.symbol}</span>
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
