import InputLabel from "@/components/app/atoms/InputLabel";
import TokenInput from "@/components/app/molecules/TokenInput";

import React from "react";
import cn from "classnames";

interface SwapButtonProps {
  disabled?: boolean;
}

const SwapButton: React.FC<SwapButtonProps> = ({ disabled = false }) => {
  return (
    <button
      className={cn({
        "bg-adamant-accentBg hover:brightness-125 transition-all hover:saturate-150 active:saturate-200 active:brightness-150":
          !disabled,
        "bg-adamant-app-buttonDisabled": disabled,
        "text-lg rounded-b-xl text-black py-3 font-bold w-full": true,
      })}
      disabled={disabled}
    >
      SWAP
    </button>
  );
};

export default function RawAttempt() {
  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="flex flex-col gap-6 px-8">
        <div className="flex flex-col gap-2">
          <InputLabel label="You Pay" caseType="uppercase" />

          <TokenInput userAddress="0xfirst token input" maxable />
        </div>
        <div className="flex flex-col gap-2">
          <InputLabel label="You Receive" caseType="uppercase" />
          <TokenInput userAddress="0xsecond token input" />
        </div>
        <div className="flex justify-between normal-case">
          <div className="flex items-center space-x-4">
            <InputLabel label="Slippage" caseType="normal-case" />
            <input
              className="rounded-xl text-sm font-bold py-2 px-4 bg-adamant-app-input w-20"
              placeholder="0.5%"
            />
          </div>
          <div className="flex items-center space-x-4 ">
            <InputLabel label="Est. gas:" caseType="normal-case" />
            <input
              className="rounded-xl text-sm font-bold py-2 px-4 bg-adamant-app-input w-20"
              placeholder="0.0"
            />
          </div>
        </div>
      </div>
      <SwapButton disabled={false} />
    </div>
  );
}
