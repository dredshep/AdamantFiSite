import React from "react";
import PlaceholderImageFromSeed from "@/components/app/Shared/PlaceholderImageFromSeed";
import { SecretString, TokenInputs } from "@/types";
import * as Dialog from "@radix-ui/react-dialog";
import TokenSelectionModal from "../Select/TokenSelectionModal";
import MaxButton from "./TokenInput/MaxButton";
import InputLabel from "./InputLabel";

interface TokenInputBaseProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  tokenSymbol: string;
  tokenAddress: SecretString;
  balance: string;
  onMaxClick: () => void;
  // onTokenSelect: () => void;
  showEstimatedPrice?: boolean;
  estimatedPrice?: string;
  inputIdentifier: keyof TokenInputs;
}
function TopRightBalance({
  hasMax,
  balance,
  tokenSymbol,
}: {
  hasMax: boolean;
  balance: number;
  tokenSymbol: string;
}) {
  return (
    <div className="flex gap-2.5 normal-case text-gray-400 items-center">
      <div className="flex gap-2 tracking-wide text-sm font-light">
        <div>Available: </div>
        <div>
          {balance.toFixed(2)} {tokenSymbol}
        </div>
      </div>
      {hasMax && <MaxButton inputIdentifier="swap.pay" balance={balance} />}
    </div>
  );
}
const TokenInputBase: React.FC<TokenInputBaseProps> = ({
  inputValue,
  onInputChange,
  tokenSymbol,
  tokenAddress,
  balance,
  // onMaxClick,
  // onTokenSelect,
  showEstimatedPrice = false,
  estimatedPrice = "",
  inputIdentifier,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex justify-between">
        {/* <div className="flex justify-between"> */}
        <InputLabel label="Buy" caseType="normal-case" />
        <TopRightBalance
          hasMax={inputIdentifier === "swap.pay"}
          balance={Number(balance ?? 0)}
          tokenSymbol={tokenSymbol}
        />
      </div>
      <div className="flex items-center bg-adamant-app-input bg-opacity-50 rounded-lg p-4">
        <input
          type="text"
          className="bg-transparent border-none outline-none text-2xl font-medium flex-grow"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="0.0"
        />
        <Dialog.Root>
          <Dialog.Trigger className="flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 bg-adamant-app-selectTrigger min-w-max cursor-pointer">
            <PlaceholderImageFromSeed seed={tokenAddress} size={24} />
            {tokenSymbol}
          </Dialog.Trigger>
          <TokenSelectionModal inputIdentifier={inputIdentifier} />
        </Dialog.Root>
      </div>
      {showEstimatedPrice && (
        <div className="text-sm text-gray-400">≈ {estimatedPrice}</div>
      )}
    </div>
  );
};

export default TokenInputBase;
