import React from "react";
import { usePoolStore } from "@/store/forms/poolStore";
import PoolMaxButton from "@/components/app/Shared/Forms/Input/TokenInput/PoolMaxButton";
import { PoolTokenInputs } from "@/types";

interface PoolTokenInputProps {
  poolInputIdentifier: keyof PoolTokenInputs;
  balance: number;
}

const PoolTokenInput: React.FC<PoolTokenInputProps> = ({
  poolInputIdentifier: inputIdentifier,
  // balance,
}) => {
  const { tokenInputs, setTokenInputAmount } = usePoolStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenInputAmount(inputIdentifier, e.target.value);
  };
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={tokenInputs[inputIdentifier].amount}
        onChange={handleInputChange}
        className="w-full bg-transparent text-2xl font-medium focus:outline-none"
        placeholder="0.0"
      />
      <PoolMaxButton poolInputIdentifier={inputIdentifier} />
    </div>
  );
};

export default PoolTokenInput;
