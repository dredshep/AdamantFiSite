import PlaceholderImageFromSeed from '@/components/app/Shared/PlaceholderImageFromSeed';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { PoolTokenInputs, SecretString, SwapTokenInputs } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import React, { useEffect } from 'react';
import { PiApproximateEquals } from 'react-icons/pi';
import TopRightBalance from '../../TopRightBalance';
import PoolSelectionModal from '../Select/PoolSelectionModal';
import TokenSelectionModal from '../Select/TokenSelectionModal';
import InputLabel from './InputLabel';

export type SwapInputIdentifier = keyof SwapTokenInputs;
export type PoolInputIdentifier = keyof PoolTokenInputs;
export type InputIdentifier = SwapInputIdentifier | PoolInputIdentifier;

interface TokenInputBaseProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  tokenSymbol: string;
  tokenAddress: SecretString;
  showEstimatedPrice: boolean;
  estimatedPrice: string;
  inputIdentifier: InputIdentifier;
  label: string;
  hasMax: boolean;
  isLoading: boolean;
}

const TokenInputBase: React.FC<TokenInputBaseProps> = ({
  inputValue,
  onInputChange,
  tokenSymbol,
  tokenAddress,
  estimatedPrice = '',
  inputIdentifier,
  label = 'Amount',
  hasMax = false,
  isLoading = false,
  showEstimatedPrice = false,
}) => {
  const { secretjs, connect } = useSecretNetwork();
  const tokenData = useTokenBalance(tokenAddress, false);

  // Attempt to connect if not connected
  useEffect(() => {
    if (secretjs === null) {
      void connect();
    }
  }, [secretjs, connect]);

  // Don't convert null to 0 - pass it through as null
  const balance = tokenData.amount !== null ? Number(tokenData.amount) : null;

  const isSwapInput = typeof inputIdentifier === 'string' && inputIdentifier.startsWith('swap.');

  return (
    <div className="flex flex-col gap-2.5 bg-adamant-app-input/30 backdrop-blur-sm rounded-lg p-4 border border-white/5 transition-all duration-200 hover:bg-adamant-app-input/40">
      <div className="flex justify-between items-center">
        <InputLabel label={label} caseType="normal-case" />
        <TopRightBalance
          balance={balance}
          tokenSymbol={tokenSymbol}
          hasMax={hasMax}
          inputIdentifier={inputIdentifier}
          loading={tokenData.loading}
          error={tokenData.error}
          onFetchBalance={() => void tokenData.refetch()}
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
        <Dialog.Root>
          <Dialog.Trigger className="flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 bg-adamant-app-selectTrigger min-w-max cursor-pointer">
            <PlaceholderImageFromSeed seed={tokenAddress} size={24} />
            {tokenSymbol}
          </Dialog.Trigger>
          {isSwapInput ? (
            <TokenSelectionModal inputIdentifier={inputIdentifier as SwapInputIdentifier} />
          ) : (
            <PoolSelectionModal />
          )}
        </Dialog.Root>
      </div>
      {showEstimatedPrice && (
        <div className="text-sm text-gray-400 place-self-end flex items-center gap-1">
          <PiApproximateEquals className="h-3 w-3" />
          {isLoading ? (
            <div className="h-4 w-16 bg-white/5 animate-pulse rounded" />
          ) : (
            <span>{estimatedPrice}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenInputBase;
