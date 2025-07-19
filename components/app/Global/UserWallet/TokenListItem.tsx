import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { ConfigToken } from '@/config/tokens';
import WalletBalance from './WalletBalance';

interface TokenListItemProps {
  token: ConfigToken;
}

export const TokenListItem = ({ token }: TokenListItemProps) => {
  return (
    <div className="group flex justify-between items-center cursor-pointer hover:bg-adamant-box-dark/50 py-3 rounded-xl px-3 transition-all duration-200 border border-transparent hover:border-adamant-gradientBright/20">
      <div className="flex items-center gap-3">
        <TokenImageWithFallback
          tokenAddress={token.address}
          size={40}
          alt={token.symbol}
          className="rounded-lg"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-white group-hover:text-white transition-colors text-base">
            {token.symbol}
          </span>
          <span className="text-sm text-adamant-text-box-secondary">{token.name}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <WalletBalance
          tokenAddress={token.address}
          tokenSymbol={token.symbol}
          className="text-right"
        />
      </div>
    </div>
  );
};
