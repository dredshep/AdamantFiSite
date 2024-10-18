import React from "react";
import { usePoolStore } from "@/store/forms/poolStore";
import TokenInputBase from "@/components/app/Shared/Forms/Input/TokenInputBase";
import { SecretString } from "@/types";
import InputLabel from "@/components/app/Shared/Forms/Input/InputLabel";

interface PoolTokenInputProps {
  inputIdentifier: string;
  token: {
    symbol: string;
    balance: number;
    address: SecretString;
  };
  label: string;
}

const PoolTokenInput: React.FC<PoolTokenInputProps> = ({
  inputIdentifier,
  token,
  label,
}) => {
  const { tokenInputs, setTokenInputAmount } = usePoolStore();

  const handleInputChange = (value: string) => {
    setTokenInputAmount(inputIdentifier, value);
  };

  const handleMaxClick = () => {
    setTokenInputAmount(inputIdentifier, token.balance.toString());
  };

  return (
    <div>
      <InputLabel label={label} caseType="normal-case" />
      <TokenInputBase
        inputValue={tokenInputs[inputIdentifier]?.amount || ""}
        onInputChange={handleInputChange}
        tokenSymbol={token.symbol}
        tokenAddress={token.address}
        balance={token.balance.toString()}
        onMaxClick={handleMaxClick}
        onTokenSelect={() => {
          /* Implement token selection logic */
        }}
      />
    </div>
  );
};

export default PoolTokenInput;
