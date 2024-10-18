import React from "react";
import { usePoolStore } from "@/store/forms/poolStore";
import PoolMaxButton from "./PoolMaxButton";

interface PoolTokenInputProps {
  inputIdentifier: string;
  balance: number;
}

const PoolTokenInput: React.FC<PoolTokenInputProps> = ({
  inputIdentifier,
  balance,
}) => {
  const { getInputValue, setInputValue } = usePoolStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(inputIdentifier, e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={getInputValue(inputIdentifier)}
        onChange={handleInputChange}
        className="w-full bg-transparent text-2xl font-medium focus:outline-none"
        placeholder="0.0"
      />
      <PoolMaxButton inputIdentifier={inputIdentifier} />
    </div>
  );
};

export default PoolTokenInput;
