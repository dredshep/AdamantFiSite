import React from "react";
import InputLabel from "@/components/app/atoms/InputLabel";
import TokenInput from "@/components/app/molecules/TokenInput";
import SwapButton from "@/components/app/atoms/SwapButton";
import { Token } from "@/types";

// Props type definition
interface SwapFormLayoutProps {
  tokens: Token[];
  payToken: Token;
  receiveToken: Token;
  payAmount: string;
  receiveAmount: string;
  setPayToken: React.Dispatch<React.SetStateAction<Token>>;
  setReceiveToken: React.Dispatch<React.SetStateAction<Token>>;
  setPayAmount: React.Dispatch<React.SetStateAction<string>>;
  setReceiveAmount: React.Dispatch<React.SetStateAction<string>>;
  handleSwapClick: () => void;
}

const SwapForm: React.FC<SwapFormLayoutProps> = ({
  tokens,
  payToken,
  receiveToken,
  payAmount,
  receiveAmount,
  setPayToken,
  setReceiveToken,
  setPayAmount,
  setReceiveAmount,
  handleSwapClick,
}) => (
  <div className="flex flex-col gap-6 pt-8">
    <div className="flex flex-col gap-6 px-8">
      <div className="flex flex-col gap-2">
        <InputLabel label="You Pay" caseType="uppercase" />
        <TokenInput
          maxable
          tokens={tokens}
          selectedToken={payToken}
          setSelectedToken={setPayToken}
          amount={payAmount}
          setAmount={setPayAmount}
          balance={100}
        />
      </div>
      <div className="flex flex-col gap-2">
        <InputLabel label="You Receive" caseType="uppercase" />
        <TokenInput
          tokens={tokens}
          selectedToken={receiveToken}
          setSelectedToken={setReceiveToken}
          amount={receiveAmount}
          setAmount={setReceiveAmount}
          balance={100}
        />
      </div>
      {/* Consider moving Slippage and Est. gas inputs to their own components if they have specific logic */}
      <div className="flex justify-between normal-case">
        <InputLabel label="Slippage" caseType="normal-case" />
        <input
          className="rounded-xl text-sm font-bold py-2 px-4 bg-adamant-app-input w-20"
          placeholder="0.5%"
        />
        <InputLabel label="Est. gas:" caseType="normal-case" />
        <input
          className="rounded-xl text-sm font-bold py-2 px-4 bg-adamant-app-input w-20"
          placeholder="0.0"
        />
      </div>
    </div>
    <SwapButton disabled={false} onClick={handleSwapClick} />
  </div>
);

export default SwapForm;
