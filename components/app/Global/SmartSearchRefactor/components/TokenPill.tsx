import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { ConfigToken } from '@/config/tokens';

interface TokenPillProps {
  token: ConfigToken;
  size?: number;
  className?: string;
}

export default function TokenPill({ token, size = 24, className = '' }: TokenPillProps) {
  return (
    <div
      className={`flex items-center gap-2.5 bg-adamant-box-regular rounded-full p-2 max-w-max px-4 ${className}`}
    >
      <TokenImageWithFallback tokenAddress={token.address} size={size} alt={token.symbol} />
      <span className="text-sm font-medium">{token.symbol}</span>
    </div>
  );
}
