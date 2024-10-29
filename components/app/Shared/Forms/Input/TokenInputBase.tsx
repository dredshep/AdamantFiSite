import React from "react";
import PlaceholderImageFromSeed from "@/components/app/Shared/PlaceholderImageFromSeed";
import { PoolTokenInputs, SecretString, SwapTokenInputs } from "@/types";
import * as Dialog from "@radix-ui/react-dialog";
import TokenSelectionModal from "../Select/TokenSelectionModal";
import InputLabel from "./InputLabel";

interface TokenInputBaseProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  tokenSymbol: string;
  tokenAddress: SecretString;
  balance: string;
  onMaxClick: () => void;
  showEstimatedPrice?: boolean;
  estimatedPrice?: string;
  swapInputIdentifier: keyof SwapTokenInputs | keyof PoolTokenInputs;
  label: string;
  hasMax: boolean;
}

function TopRightBalance({
  balance,
  tokenSymbol,
  onMaxClick,
  hasMax,
}: {
  balance: number;
  tokenSymbol: string;
  onMaxClick: () => void;
  hasMax: boolean;
}) {
  return (
    <div className="flex gap-2.5 normal-case text-gray-400 items-center">
      <div className="flex gap-2 tracking-wide text-sm font-light">
        <div>Available: </div>
        <div>
          {balance.toFixed(2)} {tokenSymbol}
        </div>
      </div>
      {hasMax && (
        <button
          className="font-medium text-base flex items-center justify-center bg-white opacity-80 hover:opacity-100 text-black rounded-md px-2"
          onClick={onMaxClick}
        >
          max
        </button>
      )}
    </div>
  );
}

const TokenInputBase: React.FC<TokenInputBaseProps> = ({
  inputValue,
  onInputChange,
  tokenSymbol,
  tokenAddress,
  balance,
  onMaxClick,
  showEstimatedPrice = false,
  estimatedPrice = "",
  swapInputIdentifier: inputIdentifier,
  label,
  hasMax,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex justify-between">
        <InputLabel label={label} caseType="normal-case" />
        <TopRightBalance
          balance={Number(balance ?? 0)}
          tokenSymbol={tokenSymbol}
          hasMax={hasMax}
          onMaxClick={onMaxClick}
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
          {inputIdentifier.startsWith("swap") ? (
            <TokenSelectionModal
              inputIdentifier={inputIdentifier as keyof SwapTokenInputs}
            />
          ) : (
            // <TokenSelectionModal
            //   inputIdentifier={inputIdentifier as keyof PoolTokenInputs}
            // />
            // <PoolSelectionModal
            //   inputIdentifier={inputIdentifier as keyof PoolTokenInputs}
            // />
            // <div className="text-sm text-gray-400">Not implemented</div>
            <></>
          )}
        </Dialog.Root>
      </div>
      {showEstimatedPrice && (
        <div className="text-sm text-gray-400">≈ {estimatedPrice}</div>
      )}
    </div>
  );
};

export default TokenInputBase;
