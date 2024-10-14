import React, { useState, useEffect } from "react";
import InputLabel from "@/components/app/Shared/Forms/Input/InputLabel";
import TokenInput from "@/components/app/Shared/Forms/Input/TokenInput";
import { useStore } from "@/store/swapStore";
import DynamicField from "@/components/app/Shared/Forms/Input/DynamicField";
import { useTokenStore } from "@/store/tokenStore";
import FormButton from "@/components/app/Shared/Forms/FormButton";
import MaxButton from "@/components/app/Shared/Forms/Input/TokenInput/MaxButton";

const SwapForm: React.FC = () => {
  // You might want to fetch or calculate balances dynamically, as an example here
  const balancePay = 100; // Example balance for pay
  const balanceReceive = 50; // Example balance for receive
  const { tokenInputs } = useStore.getState();
  const payDetails = tokenInputs["swap.pay"];
  const payToken = useTokenStore(
    (state) => state.tokens?.[payDetails.tokenAddress]
  );
  const receiveDetails = tokenInputs["swap.receive"];
  const receiveToken = useTokenStore(
    (state) => state.tokens?.[receiveDetails.tokenAddress]
  );
  const slippage = useStore((state) => state.sharedSettings.slippage);
  const gas = useStore((state) => state.sharedSettings.gas);

  const [priceImpact, setPriceImpact] = useState("0.7");
  const [txFee, setTxFee] = useState("0.1");
  const [minReceive, setMinReceive] = useState("70");

  // You might want to calculate these values dynamically based on the swap details
  useEffect(() => {
    // Example calculations (replace with actual logic)
    setPriceImpact((parseFloat(payDetails.amount) * 0.007).toFixed(4));
    setTxFee((parseFloat(payDetails.amount) * 0.001).toFixed(4));
    setMinReceive((parseFloat(receiveDetails.amount) * 0.99).toFixed(2));
  }, [payDetails.amount, receiveDetails.amount]);

  const handleSwapClick = () => {
    const alertMessage = `Swapping Details:
    
  Pay Token: ${payToken?.symbol ?? "payToken-undefined"}
  Pay Amount: ${payDetails.amount}

  Receive Token: ${receiveToken?.symbol ?? "receiveToken-undefined"}
  Receive Amount: ${receiveDetails.amount}

  Slippage: ${slippage}
  Gas: ${gas}

  Price Impact: ${priceImpact}% = ${(
      (parseFloat(priceImpact) / 100) *
      parseFloat(payDetails.amount)
    ).toFixed(4)} ${payToken?.symbol}
  TX Fee: ${txFee} ${payToken?.symbol} = ${(
      (parseFloat(txFee) / parseFloat(payDetails.amount)) *
      100
    ).toFixed(2)}%
  Min Receive: ${minReceive} ${receiveToken?.symbol}`;

    alert(alertMessage);
  };

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
    <div className="flex flex-col gap-6 py-2.5 px-2.5">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5 bg-adamant-app-input bg-opacity-50 rounded-lg p-4">
          <div className="flex justify-between">
            <InputLabel label="Sell" caseType="normal-case" />
            <TopRightBalance
              hasMax={true}
              balance={balancePay}
              tokenSymbol={payToken?.symbol ?? ""}
            />
          </div>
          <TokenInput inputIdentifier="swap.pay" balance={balancePay} />
          <BottomRightPrice
            amount={parseFloat(payDetails.amount)}
            tokenSymbol={payToken?.symbol ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2.5 bg-adamant-app-input bg-opacity-50 rounded-lg p-4">
          <div className="flex justify-between">
            <InputLabel label="Buy" caseType="normal-case" />
            <TopRightBalance
              hasMax={false}
              balance={balanceReceive}
              tokenSymbol={receiveToken?.symbol ?? ""}
            />
          </div>
          <TokenInput inputIdentifier="swap.receive" balance={balanceReceive} />
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
      <FormButton onClick={handleSwapClick} text="Swap" />
    </div>
  );
};

export default SwapForm;
