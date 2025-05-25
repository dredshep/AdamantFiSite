import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { ConfigToken } from '@/config/tokens';
import { AlertTriangle } from 'lucide-react';
import React from 'react';

interface PoolLiquidityDisplayProps {
  title: string;
  isLoading: boolean;
  hasLiquidity: boolean;
  token0?: ConfigToken | undefined;
  token1?: ConfigToken | undefined;
  token0Amount?: string;
  token1Amount?: string;
  totalLpSupply?: string;
  showLpSupply?: boolean;
  emptyStateMessage?: {
    title: string;
    description: string;
  };
}

const PoolLiquidityDisplay: React.FC<PoolLiquidityDisplayProps> = ({
  title,
  isLoading,
  hasLiquidity,
  token0,
  token1,
  token0Amount,
  token1Amount,
  totalLpSupply,
  showLpSupply = false,
  emptyStateMessage,
}) => {
  return (
    <div className="mb-4 p-4 bg-adamant-app-box-lighter/30 rounded-xl border border-white/5">
      <div className="text-sm font-medium text-white/80 mb-3">{title}</div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 bg-white/5 animate-pulse rounded" />
          <div className="h-4 bg-white/5 animate-pulse rounded" />
          {showLpSupply && <div className="h-4 bg-white/5 animate-pulse rounded" />}
        </div>
      ) : hasLiquidity ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              {token0?.address && (
                <TokenImageWithFallback tokenAddress={token0.address} size={16} />
              )}
              <span className="text-white/60">{token0?.symbol || 'Token A'}:</span>
            </div>
            <span className="font-mono text-white">{token0Amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              {token1?.address && (
                <TokenImageWithFallback tokenAddress={token1.address} size={16} />
              )}
              <span className="text-white/60">{token1?.symbol || 'Token B'}:</span>
            </div>
            <span className="font-mono text-white">{token1Amount}</span>
          </div>
          {showLpSupply && totalLpSupply && (
            <div className="flex justify-between text-sm pt-1 border-t border-white/10">
              <span className="text-white/60">LP Supply:</span>
              <span className="font-mono text-white">{totalLpSupply}</span>
            </div>
          )}
        </div>
      ) : (
        emptyStateMessage && (
          <div className="text-sm text-amber-400 bg-adamant-app-box/50 p-3 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-amber-300">{emptyStateMessage.title}</div>
                <div className="text-xs text-amber-400/80 mt-1">
                  {emptyStateMessage.description}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default PoolLiquidityDisplay;
