import FormButton from '@/components/app/Shared/Forms/FormButton';
import TokenInput from '@/components/app/Shared/Forms/Input/TokenInput';
import { useSwapForm } from '@/hooks/useSwapForm';
import { getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import React from 'react';
// import BestRouteEstimator from '../../BestRouteEstimator';

const SwapForm: React.FC = () => {
  const {
    payDetails,
    payToken,
    // receiveDetails,
    receiveToken,
    priceImpact,
    txFee,
    minReceive,
    handleSwapClick,
  } = useSwapForm();

  // function BottomRightPrice({ amount, tokenSymbol }: { amount: number; tokenSymbol: string }) {
  //   return (
  //     <div className="flex gap-2 self-end text-gray-400">
  //       <div className="text-sm font-light">
  //         ≈ {amount} {tokenSymbol}
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col gap-6 py-2.5  px-2.5">
      <div className="flex flex-col gap-6">
        {/* <div className="flex flex-col gap-2.5 bg-adamant-app-input bg-opacity-50 rounded-lg p-4"> */}
        <TokenInput inputIdentifier="swap.pay" formType="swap" />
        {/* {payToken !== undefined && (
            <BottomRightPrice
              amount={parseFloat(payDetails.amount)}
              tokenSymbol={getApiTokenSymbol(payToken)}
            />
          )} */}
        {/* </div> */}
        {/* <div className="flex flex-col gap-2.5 bg-adamant-app-input bg-opacity-50 rounded-lg p-4"> */}
        <TokenInput inputIdentifier="swap.receive" formType="swap" />
        {/* {receiveToken !== undefined && (
            <BottomRightPrice
              amount={receiveDetails.amount.length ? parseFloat(receiveDetails.amount) : 0}
              tokenSymbol={getApiTokenSymbol(receiveToken)}
            />
          )} */}
        {/* </div> */}
      </div>
      {payToken !== undefined && receiveToken !== undefined && (
        <div className="flex flex-col gap-2 px-2.5 text-gray-400 text-sm">
          <div className="flex justify-between">
            <span>Price impact:</span>
            <span>
              {priceImpact}% ≈{' '}
              {((parseFloat(priceImpact) / 100) * parseFloat(payDetails.amount)).toFixed(4)}{' '}
              {getApiTokenSymbol(payToken)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>TX fee:</span>
            <span>
              {txFee} {getApiTokenSymbol(payToken)} ≈{' '}
              {((parseFloat(txFee) / parseFloat(payDetails.amount)) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Min receive</span>
            <span>
              {minReceive} {getApiTokenSymbol(receiveToken)}
            </span>
          </div>
        </div>
      )}
      {/* <BestRouteEstimator
        // amountIn={payDetails.amount}
        // inputToken={payToken?.address ?? ""}
        // outputToken={receiveToken?.address ?? ""}
        secretjs={secretClient ?? null}
      /> */}
      <FormButton onClick={() => void handleSwapClick()} text="Swap" />
    </div>
  );
};

export default SwapForm;
