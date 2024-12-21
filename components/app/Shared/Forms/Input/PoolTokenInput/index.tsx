import TokenInputBase from '@/components/app/Shared/Forms/Input/TokenInputBase';
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
