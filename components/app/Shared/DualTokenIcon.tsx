import { SecretString } from '@/types';
import React from 'react';
import TokenImageWithFallback from './TokenImageWithFallback';

interface DualTokenIconProps {
  token0Address: SecretString;
  token1Address: SecretString;
  token0Symbol: string;
  token1Symbol: string;
  size?: number;
  className?: string;
}

const DualTokenIcon: React.FC<DualTokenIconProps> = ({
  token0Address,
  token1Address,
  token0Symbol,
  token1Symbol,
  size = 40,
  className = '',
}) => {
  const iconSize = Math.round(size * 0.7); // Each token icon is 70% of the total size
  const offset = Math.round(size * 0.3); // 30% offset for overlap

  return (
    <div
      className={`relative flex items-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* First token (background) */}
      <div className="absolute left-0 top-0 z-10">
        <TokenImageWithFallback
          tokenAddress={token0Address}
          size={iconSize}
          alt={token0Symbol}
          className="rounded-full border-2 border-adamant-background shadow-sm"
        />
      </div>

      {/* Second token (foreground, overlapping) */}
      <div className="absolute top-0 z-20" style={{ left: offset }}>
        <TokenImageWithFallback
          tokenAddress={token1Address}
          size={iconSize}
          alt={token1Symbol}
          className="rounded-full border-2 border-adamant-background shadow-sm"
        />
      </div>
    </div>
  );
};

export default DualTokenIcon;
