import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { PoolTokenInputs, SecretString, SwapTokenInputs } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import React, { useEffect } from 'react';
import { PiApproximateEquals } from 'react-icons/pi';
import TokenImageWithFallback from '../../TokenImageWithFallback';
import TopRightBalance from '../../TopRightBalance';
import PoolSelectionModal from '../Select/PoolSelectionModal';
import TokenSelectionModal from '../Select/TokenSelectionModal';
import InputLabel from './InputLabel';
import {
  InputContainer,
  InputField,
  InputHeader,
  InputRow,
  LoadingOverlay,
  LoadingPlaceholder,
  TokenSelectorClickable,
} from './inputStyles';

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
    <InputContainer>
      <InputHeader>
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
      </InputHeader>
      <InputRow>
        <div className="relative flex-1">
          <InputField
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="0.0"
            disabled={isLoading}
            data-input-id={inputIdentifier}
          />
          {isLoading && (
            <LoadingOverlay>
              <LoadingPlaceholder />
            </LoadingOverlay>
          )}
        </div>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <TokenSelectorClickable>
              <TokenImageWithFallback tokenAddress={tokenAddress} size={24} />
              {tokenSymbol}
            </TokenSelectorClickable>
          </Dialog.Trigger>
          {isSwapInput ? (
            <TokenSelectionModal inputIdentifier={inputIdentifier as SwapInputIdentifier} />
          ) : (
            <PoolSelectionModal />
          )}
        </Dialog.Root>
      </InputRow>
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
    </InputContainer>
  );
};

export default TokenInputBase;
