import TokenInputBase from '@/components/app/Shared/Forms/Input/TokenInputBase';
import TokenInputBaseLp from '@/components/app/Shared/Forms/Input/TokenInputBaseLp';
import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { usePoolStore } from '@/store/forms/poolStore';
import { PoolTokenInputs, SecretString } from '@/types';
import React from 'react';

interface PoolTokenInputProps {
  poolInputIdentifier: keyof PoolTokenInputs;
  token: {
    symbol: string;
    address: SecretString;
  };
  label: string;
  isLoading?: boolean;
}

const PoolTokenInput: React.FC<PoolTokenInputProps> = ({
  poolInputIdentifier: inputIdentifier,
  token,
  label,
  isLoading = false,
}) => {
  const { tokenInputs, setTokenInputAmount } = usePoolStore();

  const handleInputChange = (value: string) => {
    setTokenInputAmount(inputIdentifier, value);
  };

  // Check if this is an LP token by looking it up in LIQUIDITY_PAIRS
  const isLpToken = LIQUIDITY_PAIRS.some((pair) => pair.lpToken === token.address);

  // Use specialized LP component for LP tokens
  if (isLpToken) {
    return (
      <div>
        <TokenInputBaseLp
          inputValue={tokenInputs[inputIdentifier]?.amount ?? ''}
          onInputChange={handleInputChange}
          tokenSymbol={token.symbol}
          tokenAddress={token.address}
          inputIdentifier={inputIdentifier}
          hasMax={true}
          label={label}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // Use regular component for normal tokens
  return (
    <div>
      <TokenInputBase
        inputValue={tokenInputs[inputIdentifier]?.amount ?? ''}
        onInputChange={handleInputChange}
        tokenSymbol={token.symbol}
        tokenAddress={token.address}
        inputIdentifier={inputIdentifier}
        hasMax={true}
        label={label}
        showEstimatedPrice={false}
        estimatedPrice="0"
        isLoading={isLoading}
      />
    </div>
  );
};

export default PoolTokenInput;
