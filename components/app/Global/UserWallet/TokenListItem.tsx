import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { ConfigToken } from '@/config/tokens';
import { isPricingEnabled } from '@/utils/features';
import TokenPriceDisplay from './TokenPriceDisplay';
import WalletBalance from './WalletBalance';

interface TokenListItemProps {
  token: ConfigToken;
}

export const TokenListItem = ({ token }: TokenListItemProps) => {
  return (
    <div className="group flex justify-between items-center cursor-pointer hover:bg-white hover:bg-opacity-5 py-3 pl-6 pr-4 transition-all duration-200">
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
        <TokenImageWithFallback
          tokenAddress={token.address}
          size={40}
          alt={token.symbol}
          className="rounded-lg flex-shrink-0"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-white group-hover:text-white transition-colors text-base">
            {token.symbol}
          </span>
          <span className="text-sm text-adamant-text-box-secondary leading-tight">
            {token.name}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <WalletBalance
          tokenAddress={token.address}
          tokenSymbol={token.symbol}
          className="text-right"
        />
        {isPricingEnabled() && (
          <TokenPriceDisplay coingeckoId={token.coingeckoId} className="text-right" />
        )}
      </div>
    </div>
  );
};
