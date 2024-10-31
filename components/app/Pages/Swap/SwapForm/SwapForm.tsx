import React from "react";
import TokenInput from "@/components/app/Shared/Forms/Input/TokenInput";
import FormButton from "@/components/app/Shared/Forms/FormButton";
import { useSwapForm } from "@/hooks/useSwapForm";
import BestRouteEstimator from "../../BestRouteEstimator";
import { secretClient } from "@/utils/secretClient";

const SwapForm: React.FC = () => {
  const {
    payDetails,
    payToken,
    receiveDetails,
    receiveToken,
    priceImpact,
    txFee,
    minReceive,
    handleSwapClick,
  } = useSwapForm();

  function BottomRightPrice({
    amount,
    tokenSymbol,
  }: {
    amount: number;
    tokenSymbol: string;
  }) {
    return (
      <div className="flex gap-2 self-end text-gray-400">
        <div className="text-sm font-light">
          ≈ {amount} {tokenSymbol}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2.5  px-2.5">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5 bg-adamant-app-input bg-opacity-50 rounded-lg p-4">
          {/* <div className="flex justify-between">
            <InputLabel label="Sell" caseType="normal-case" />
            <TopRightBalance
              hasMax={true}
              balance={Number(payToken?.balance ?? 0)}
              tokenSymbol={payToken?.symbol ?? ""}
            />
          </div> */}
          <TokenInput
            inputIdentifier="swap.pay"
            formType="swap"
            // balance={Number(payToken?.balance ?? 0)}
          />
          <BottomRightPrice
            amount={parseFloat(payDetails.amount)}
            tokenSymbol={payToken?.symbol ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2.5 bg-adamant-app-input bg-opacity-50 rounded-lg p-4">
          <TokenInput
            inputIdentifier="swap.receive"
            formType="swap"
            // balance={Number(receiveToken?.balance ?? 0)}
          />
          <BottomRightPrice
            amount={
              receiveDetails.amount.length
                ? parseFloat(receiveDetails.amount)
                : 0
            }
            tokenSymbol={receiveToken?.symbol ?? ""}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 px-2.5 text-gray-400 text-sm">
        <div className="flex justify-between">
          <span>Price impact:</span>
          <span>
            {priceImpact}% ≈{" "}
            {(
              (parseFloat(priceImpact) / 100) *
              parseFloat(payDetails.amount)
            ).toFixed(4)}{" "}
            {payToken?.symbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span>TX fee:</span>
          <span>
            {txFee} {payToken?.symbol} ≈{" "}
            {(
              (parseFloat(txFee) / parseFloat(payDetails.amount)) *
              100
            ).toFixed(2)}
            %
          </span>
        </div>
        <div className="flex justify-between">
          <span>Min receive</span>
          <span>
            {minReceive} {receiveToken?.symbol}
          </span>
        </div>
      </div>
      <BestRouteEstimator
        // amountIn={payDetails.amount}
        // inputToken={payToken?.address ?? ""}
        // outputToken={receiveToken?.address ?? ""}
        secretjs={secretClient ?? null}
      />
      <FormButton onClick={() => void handleSwapClick()} text="Swap" />
    </div>
  );
};

export default SwapForm;
