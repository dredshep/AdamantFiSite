import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { ConfigToken } from '@/config/tokens';

interface TokenPillProps {
  token: ConfigToken;
  size?: number;
  className?: string;
}

export default function TokenPill({ token, size = 24, className = '' }: TokenPillProps) {
  // Handle undefined token during build time
  if (!token) {
    return (
      <div
        className={`flex items-center gap-2.5 bg-adamant-box-regular rounded-full p-2 max-w-max px-4 ${className}`}
      >
        <div
          className="rounded-full bg-gray-600 animate-pulse"
          style={{ width: size, height: size }}
        />
        <span className="text-sm font-medium text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 bg-adamant-box-regular rounded-full p-2 max-w-max px-4 ${className}`}
    >
      <TokenImageWithFallback tokenAddress={token.address} size={size} alt={token.symbol} />
      <span className="text-sm font-medium">{token.symbol}</span>
    </div>
  );
}
