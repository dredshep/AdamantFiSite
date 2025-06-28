import { getTokenImagePath } from '@/config/tokenImages';
import { SecretString } from '@/types';
import React from 'react';

interface TokenInputBaseProps {
  inputIdentifier: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  tokenSymbol: string;
  tokenAddress: string;
  showEstimatedPrice: boolean;
  estimatedPrice: string;
  label: string;
  hasMax: boolean;
  isLoading: boolean;
}

const TokenInputBase: React.FC<TokenInputBaseProps> = ({
  inputIdentifier,
  inputValue,
  onInputChange,
  tokenSymbol,
  tokenAddress,
  showEstimatedPrice = false,
  estimatedPrice = '',
  label = 'Amount',
  hasMax = false,
  isLoading = false,
}) => {
  return (
    <div className="relative flex flex-col gap-2.5 bg-adamant-app-input backdrop-blur-sm rounded-lg p-4 border border-white/5 transition-all duration-200 hover:bg-adamant-app-input/40">
      <div className="flex justify-between items-center">
        <label htmlFor={inputIdentifier} className="text-sm text-gray-400">
          {label}
        </label>
        {hasMax && (
          <button className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
            MAX
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            id={inputIdentifier}
            type="number"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-2xl font-light outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-500/50"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center">
              <div className="h-8 w-32 bg-white/5 animate-pulse rounded" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const imagePath = getTokenImagePath(tokenAddress as SecretString);
            return imagePath ? (
              <img
                src={imagePath}
                alt={`${tokenSymbol} icon`}
                className="h-8 w-8 rounded-full"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-adamant-app-input/50 flex items-center justify-center text-xs font-medium text-gray-400">
                {tokenSymbol.slice(0, 2).toUpperCase()}
              </div>
            );
          })()}
          <div className="h-8 w-8 rounded-full bg-adamant-app-input/50 hidden" />
          <span className="text-lg">{tokenSymbol}</span>
        </div>
      </div>
      {showEstimatedPrice && (
        <div className="text-sm text-gray-400">
          {isLoading ? (
            <div className="h-4 w-16 bg-white/5 animate-pulse rounded" />
          ) : (
            estimatedPrice
          )}
        </div>
      )}
    </div>
  );
};

export default TokenInputBase;
