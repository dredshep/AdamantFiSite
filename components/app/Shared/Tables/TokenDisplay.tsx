import TokenImageWithFallback from "@/components/app/Shared/TokenImageWithFallback";
import { LIQUIDITY_PAIRS, TOKENS } from "@/config/tokens";
import { SecretString } from "@/types";
import React from "react";

interface TokenDisplayProps {
  seed: SecretString;
  name: string;
  showFee?: boolean;
}

const TokenDisplay: React.FC<TokenDisplayProps> = ({ seed, name, showFee = false }) => {
  // Check if this is a liquidity pair
  const liquidityPair = LIQUIDITY_PAIRS.find(pair => pair.pairContract === seed);
  
  if (liquidityPair) {
    // Find token addresses for the pair
    const token0 = TOKENS.find(t => t.symbol === liquidityPair.token0);
    const token1 = TOKENS.find(t => t.symbol === liquidityPair.token1);

    return (
      <div className="flex items-center min-w-60">
        <div className="relative flex items-center">
          {/* First token image */}
          {token0 && (
            <TokenImageWithFallback
              tokenAddress={token0.address}
              size={32}
              alt={token0.symbol}
              className="rounded-full border-2 border-adamant-app-input z-10"
            />
          )}
          {/* Second token image - overlapping */}
          {token1 && (
            <TokenImageWithFallback
              tokenAddress={token1.address}
              size={32}
              alt={token1.symbol}
              className="rounded-full border-2 border-adamant-app-input -ml-2"
            />
          )}
        </div>
        <div className="ml-3">
          <div className="font-medium text-white text-base">{name}</div>
          {showFee && (
            <div className="text-sm text-adamant-text-box-secondary">
              {liquidityPair.fee}%
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for single tokens or unknown pairs
  return (
    <div className="flex items-center min-w-60">
      <TokenImageWithFallback
        tokenAddress={seed}
        size={32}
        alt={name}
        className="rounded-full"
      />
      <div className="ml-3">
        <div className="font-medium text-white text-base">{name}</div>
        {/* No fee display for unknown pairs - we don't know what it should be */}
      </div>
    </div>
  );
};

export default TokenDisplay;
