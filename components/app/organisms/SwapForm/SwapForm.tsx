import React from "react";
import InputLabel from "@/components/app/atoms/InputLabel";
import TokenInput from "@/components/app/molecules/TokenInput";
import SwapButton from "@/components/app/atoms/SwapButton";
import { useStore } from "@/store/swapStore"; // Ensure this path matches the location of your store
import DynamicField from "@/components/app/molecules/DynamicField";

const SwapForm: React.FC = () => {
  // You might want to fetch or calculate balances dynamically, as an example here
  const balancePay = 100; // Example balance for pay
  const balanceReceive = 100; // Example balance for receive

  const handleSwapClick = () => {
    const { tokenInputs } = useStore.getState();
    const payDetails = tokenInputs["swap.pay"];
    const receiveDetails = tokenInputs["swap.receive"];

    alert(
      `Swapping ${payDetails.amount} ${payDetails.token.symbol} for ${receiveDetails.amount} ${receiveDetails.token.symbol}`
    );
  };

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="flex flex-col gap-6 px-8">
        <div className="flex flex-col gap-2">
          <InputLabel label="You Pay" caseType="uppercase" />
          <TokenInput inputIdentifier="swap.pay" maxable balance={balancePay} />
        </div>
        <div className="flex flex-col gap-2">
          <InputLabel label="You Receive" caseType="uppercase" />
          <TokenInput inputIdentifier="swap.receive" balance={balanceReceive} />
        </div>
        {/* Implement inputs for slippage and estimated gas if they're managed by the store or elsewhere */}
        <div className="flex justify-between normal-case">
          <div className="flex justify-between normal-case gap-2">
            <InputLabel label="Slippage" caseType="normal-case" />
            <DynamicField fieldIdentifier="slippage" />
          </div>
          <div className="flex justify-between normal-case gap-2">
            <InputLabel label="Est. gas:" caseType="normal-case" />
            <DynamicField fieldIdentifier="gas" />
          </div>
        </div>
      </div>
      <SwapButton disabled={false} onClick={handleSwapClick} />
    </div>
  );
};

export default SwapForm;
