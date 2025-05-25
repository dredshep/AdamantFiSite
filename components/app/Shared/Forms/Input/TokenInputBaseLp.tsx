import PlaceholderImageFromSeed from '@/components/app/Shared/PlaceholderImageFromSeed';
import { useLpTokenBalance } from '@/hooks/useLpTokenBalance';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { SecretString } from '@/types';
import React, { useEffect } from 'react';
import TopRightBalanceLp from '../../TopRightBalanceLp';
import InputLabel from './InputLabel';
import { PoolInputIdentifier } from './TokenInputBase';

interface TokenInputBaseLpProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  tokenSymbol: string;
  tokenAddress: SecretString;
  inputIdentifier: PoolInputIdentifier;
  label: string;
  hasMax: boolean;
  isLoading: boolean;
}

const TokenInputBaseLp: React.FC<TokenInputBaseLpProps> = ({
  inputValue,
  onInputChange,
  tokenSymbol,
  tokenAddress,
  inputIdentifier,
  label = 'Amount',
  hasMax = false,
  isLoading = false,
}) => {
  const { secretjs, connect } = useSecretNetwork();
  const lpTokenData = useLpTokenBalance(tokenAddress);

  // Attempt to connect if not connected
  useEffect(() => {
    if (secretjs === null) {
      void connect();
    }
  }, [secretjs, connect]);

  return (
    <div className="flex flex-col gap-2.5 bg-adamant-app-input/30 backdrop-blur-sm rounded-lg p-4 border border-white/5 transition-all duration-200 hover:bg-adamant-app-input/40">
      <div className="flex justify-between items-center">
        <InputLabel label={label} caseType="normal-case" />
        <TopRightBalanceLp
          balance={lpTokenData.amount}
          tokenSymbol={tokenSymbol}
          hasMax={hasMax}
          inputIdentifier={inputIdentifier}
          loading={lpTokenData.loading}
          error={lpTokenData.error}
          onFetchBalance={() => void lpTokenData.refetch()}
          onSuggestToken={() => void lpTokenData.suggestToken()}
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full bg-transparent text-2xl font-light outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-500/50"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="0.0"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center">
              <div className="h-8 w-32 bg-white/5 animate-pulse rounded" />
            </div>
          )}
        </div>
        <div className="flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 bg-adamant-app-selectTrigger min-w-max">
          <PlaceholderImageFromSeed seed={tokenAddress} size={24} />
          {tokenSymbol}
        </div>
      </div>
    </div>
  );
};

export default TokenInputBaseLp;
