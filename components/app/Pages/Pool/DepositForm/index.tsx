import React from "react";
import FormButton from "@/components/app/Shared/Forms/FormButton";
import { usePoolDepositForm } from "@/hooks/usePoolDepositForm";
import PoolTokenInput from "@/components/app/Shared/Forms/Input/PoolTokenInput";
import { SecretString } from "@/types";
interface DepositFormProps {
  token1: {
    symbol: string;
    balance: number;
    address: SecretString;
  };
  token2: {
    symbol: string;
    balance: number;
    address: SecretString;
  };
}

const DepositForm: React.FC<DepositFormProps> = ({ token1, token2 }) => {
  const { apr, estimatedLPTokens, handleDepositClick } = usePoolDepositForm();

  return (
    <div className="flex flex-col gap-6 py-2.5 px-2.5 flex-1 justify-between">
      <div className="flex flex-col gap-6">
        <PoolTokenInput
          inputIdentifier={`pool.${token1.symbol}`}
          token={token1}
          label="Deposit"
        />
        <PoolTokenInput
          inputIdentifier={`pool.${token2.symbol}`}
          token={token2}
          label="And"
        />
        <div className="flex flex-col gap-2 px-2.5 text-gray-400 text-sm">
          <div className="flex justify-between">
            <span>APR:</span>
            <span>{apr}%</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated LP Tokens:</span>
            <span>{estimatedLPTokens}</span>
          </div>
        </div>
      </div>
      <FormButton onClick={handleDepositClick} text="Provide Liquidity" />
    </div>
  );
};

export default DepositForm;
