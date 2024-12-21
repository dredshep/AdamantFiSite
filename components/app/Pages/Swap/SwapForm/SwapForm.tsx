import FormButton from '@/components/app/Shared/Forms/FormButton';
import TokenInput from '@/components/app/Shared/Forms/Input/TokenInput';
import { useSwapForm } from '@/hooks/useSwapForm';
import { getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import React, { useEffect, useState } from 'react';
// import BestRouteEstimator from '../../BestRouteEstimator';

const SwapForm: React.FC = () => {
  const {
    payDetails,
    payToken,
    receiveToken,
    priceImpact,
    txFee,
    minReceive,
    handleSwapClick,
    slippage,
    setSlippage,
    estimatedOutput,
    isEstimating,
  } = useSwapForm();

  // console.log(
  //   JSON.stringify(
  //     {
  //       payDetails,
  //       payToken,
  //       // receiveDetails,
  //       receiveToken,
  //       priceImpact,
  //       txFee,
  //       minReceive,
  //       handleSwapClick,
  //       slippage,
  //       setSlippage,
  //       estimatedOutput,
  //     },
  //     null,
  //     2
  //   )
  // );

  const [minReceiveInput, setMinReceiveInput] = useState(minReceive?.toString() ?? '');

  useEffect(() => {
    setMinReceiveInput(minReceive?.toString() ?? '');
  }, [minReceive]);

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
    <div className="flex flex-col gap-6 py-2.5 px-2.5">
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
        <TokenInput
          inputIdentifier="swap.receive"
          formType="swap"
          value={estimatedOutput}
          isLoading={isEstimating}
        />
        {/* {receiveToken !== undefined && (
            <BottomRightPrice
              amount={receiveDetails.amount.length ? parseFloat(receiveDetails.amount) : 0}
              tokenSymbol={getApiTokenSymbol(receiveToken)}
            />
          )} */}
        {/* </div> */}
      </div>
      {payToken !== undefined && receiveToken !== undefined && (
        <div className="flex flex-col gap-2 px-2.5 text-gray-400 text-sm backdrop-blur-sm bg-adamant-app-input/30 rounded-lg p-4">
          <div className="flex justify-between">
            <span>Price impact:</span>
            <span className="transition-opacity duration-200 ease-in-out">
              {isEstimating ? (
                <div className="h-4 w-20 bg-white/5 animate-pulse rounded" />
              ) : payDetails.amount && parseFloat(payDetails.amount) > 0 ? (
                <>
                  {priceImpact}% ≈{' '}
                  {((parseFloat(priceImpact) / 100) * parseFloat(payDetails.amount)).toFixed(4)}{' '}
                  {getApiTokenSymbol(payToken)}
                </>
              ) : (
                <>0.00% ≈ 0.00 {getApiTokenSymbol(payToken)}</>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>TX fee:</span>
            <span className="transition-opacity duration-200 ease-in-out">
              {isEstimating ? (
                <div className="h-4 w-20 bg-white/5 animate-pulse rounded" />
              ) : payDetails.amount && parseFloat(payDetails.amount) > 0 ? (
                <>
                  {txFee} {getApiTokenSymbol(payToken)} ≈{' '}
                  {((parseFloat(txFee) / parseFloat(payDetails.amount)) * 100).toFixed(2)}%
                </>
              ) : (
                <>0.00 {getApiTokenSymbol(payToken)} ≈ 0.00%</>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Min receive</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minReceiveInput}
                placeholder="0.00"
                onChange={(e) => {
                  const value = e.target.value;
                  setMinReceiveInput(value);
                }}
                className="w-20 bg-adamant-app-input/30 backdrop-blur-sm border border-white/5 rounded-lg px-2.5 py-1.5 text-right outline-none transition-all duration-200 hover:bg-adamant-app-input/40 focus:bg-adamant-app-input/50 focus:border-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-500/50"
              />
              <span>{getApiTokenSymbol(receiveToken)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>Slippage</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={slippage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0) {
                    setSlippage(value);
                  }
                }}
                className="w-20 bg-adamant-app-input/30 backdrop-blur-sm border border-white/5 rounded-lg px-2.5 py-1.5 text-right outline-none transition-all duration-200 hover:bg-adamant-app-input/40 focus:bg-adamant-app-input/50 focus:border-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span>%</span>
            </div>
          </div>
        </div>
      )}
      {/* <BestRouteEstimator
        // amountIn={payDetails.amount}
        // inputToken={payToken?.address ?? ""}
        // outputToken={receiveToken?.address ?? ""}
        secretjs={secretClient ?? null}
      /> */}
      <FormButton
        onClick={() => void handleSwapClick()}
        text="Swap"
        disabled={isEstimating}
        className={isEstimating ? 'opacity-50 cursor-not-allowed' : ''}
      />
    </div>
  );
};

export default SwapForm;
