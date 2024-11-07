import TokenInputBase from '@/components/app/Shared/Forms/Input/TokenInputBase';
import { usePoolStore } from '@/store/forms/poolStore';
import { PoolTokenInputs, SecretString } from '@/types';
import React from 'react';
// import InputLabel from "@/components/app/Shared/Forms/Input/InputLabel";

interface PoolTokenInputProps {
  poolInputIdentifier: keyof PoolTokenInputs;
  token: {
    symbol: string;
    // balance: number;
    address: SecretString;
  };
  label: string;
}

const PoolTokenInput: React.FC<PoolTokenInputProps> = ({
  poolInputIdentifier: inputIdentifier,
  token,
  label,
}) => {
  const { tokenInputs, setTokenInputAmount } = usePoolStore();

  const handleInputChange = (value: string) => {
    setTokenInputAmount(inputIdentifier, value);
  };

  // const handleMaxClick = () => {
  //   setTokenInputAmount(inputIdentifier, token.balance.toString());
  // };

  return (
    <div>
      {/* <InputLabel label={label} caseType="normal-case" /> */}
      <TokenInputBase
        inputValue={tokenInputs[inputIdentifier]?.amount ?? ''}
        onInputChange={handleInputChange}
        tokenSymbol={token.symbol}
        tokenAddress={token.address}
        // balance={token.balance.toString()}
        // onMaxClick={handleMaxClick}
        inputIdentifier={inputIdentifier}
        hasMax={true}
        label={label}
      />
    </div>
  );
};

export default PoolTokenInput;
