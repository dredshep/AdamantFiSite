import FormButton from '@/components/app/Shared/Forms/FormButton';
import {
  ButtonContainer,
  InfoContainer,
  SmallInput,
} from '@/components/app/Shared/Forms/Input/InputWrappers';
import TokenInput from '@/components/app/Shared/Forms/Input/TokenInput';
import { useSwapFormLean as useSwapForm } from '@/hooks/useSwapFormLean';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckIcon, Cross2Icon, InfoCircledIcon, ReloadIcon } from '@radix-ui/react-icons';
import React, { useEffect, useState } from 'react';
import { HiArrowsUpDown } from 'react-icons/hi2';
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
    swapTokens,
    refreshEstimation,
  } = useSwapForm();

  // const { resetTokenSelections } = useSwapStore();

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

  const [, setMinReceiveInput] = useState(minReceive?.toString() ?? '');
  const [tempSlippage, setTempSlippage] = useState(slippage);
  const [hasSlippageChanges, setHasSlippageChanges] = useState(false);

  useEffect(() => {
    setMinReceiveInput(minReceive?.toString() ?? '');
  }, [minReceive]);

  useEffect(() => {
    setTempSlippage(slippage);
    setHasSlippageChanges(false);
  }, [slippage]);

  const handleSlippageChange = (value: number) => {
    setTempSlippage(value);
    setHasSlippageChanges(value !== slippage);
  };

  const applySlippageChanges = () => {
    setSlippage(tempSlippage);
    setHasSlippageChanges(false);
  };

  const InfoDialog: React.FC<{ title: string; data: unknown; children: React.ReactNode }> = ({
    title,
    data,
    children,
  }) => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="ml-1 text-gray-400 hover:text-white transition-colors">
          <InfoCircledIcon className="w-3 h-3" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-lg p-4 w-[90vw] max-w-md max-h-[90vh] overflow-auto z-50">
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="text-lg font-semibold text-white">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-white">
                <Cross2Icon className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="space-y-3">
            {children}
            <div className="bg-gray-800 p-3 rounded border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Raw Data:</h4>
              <pre className="text-xs text-gray-400 overflow-auto max-h-32">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

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
      {/* Header with Reset Button */}
      {/* <div className="flex justify-between items-center px-2">
        <h2 className="text-lg font-semibold text-gray-300">Swap Tokens</h2> */}
      {/* <button
          onClick={resetTokenSelections}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 bg-adamant-app-input/30 hover:bg-adamant-app-input/50 px-3 py-1.5 rounded-lg"
          title="Reset token selections"
        >
          <MdClear className="w-4 h-4" />
          Reset
        </button> */}
      {/* </div> */}

      <div className="flex flex-col gap-6 relative">
        {/* <div className="flex flex-col gap-2.5 bg-adamant-app-input bg-opacity-50 rounded-lg p-4"> */}
        <TokenInput inputIdentifier="swap.pay" formType="swap" />
        {/* {payToken !== undefined && (
            <BottomRightPrice
              amount={parseFloat(payDetails.amount)}
              tokenSymbol={getApiTokenSymbol(payToken)}
            />
          )} */}
        {/* </div> */}

        {/* Swap Direction Toggle Button */}
        <div className="flex justify-center relative -my-3 z-10">
          <button
            onClick={swapTokens}
            className="bg-adamant-app-input hover:bg-adamant-app-input/90 border border-adamant-box-inputBorder hover:border-white/20 rounded-xl p-3 transition-all duration-200 group"
            title="Swap token positions"
          >
            <HiArrowsUpDown className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-200" />
          </button>
        </div>

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
        <InfoContainer className="flex flex-col gap-3 px-2.5 text-gray-400 text-sm">
          {/* Header with refresh button */}
          <div className="flex justify-between items-center -mt-1 mb-1">
            <span className="text-xs font-medium text-gray-300">Swap Details</span>
            <ButtonContainer
              onClick={refreshEstimation}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors duration-200 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ReloadIcon className={`w-3 h-3 ${isEstimating ? 'animate-spin' : ''}`} />
              Refresh
            </ButtonContainer>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <span>Price impact:</span>
              <InfoDialog
                title="Price Impact Details"
                data={{
                  priceImpact,
                  payAmount: payDetails.amount,
                  isEstimating,
                  payToken: payToken?.symbol,
                  receiveToken: receiveToken?.symbol,
                  rawPriceImpact: priceImpact,
                  parsedPriceImpact: parseFloat(priceImpact),
                  isValidNumber: !isNaN(parseFloat(priceImpact)),
                  effectiveRate:
                    payDetails.amount && parseFloat(payDetails.amount) > 0
                      ? (parseFloat(estimatedOutput) / parseFloat(payDetails.amount)).toFixed(6)
                      : 'N/A',
                  estimatedOutput,
                }}
              >
                <div className="text-sm text-gray-300">
                  <p>
                    <strong>Status:</strong> {isEstimating ? 'Calculating...' : 'Ready'}
                  </p>
                  <p>
                    <strong>Price Impact:</strong> {priceImpact || 'undefined'}%
                  </p>
                  <p>
                    <strong>Effective Rate:</strong> 1 {payToken?.symbol} ={' '}
                    {payDetails.amount && parseFloat(payDetails.amount) > 0
                      ? (parseFloat(estimatedOutput) / parseFloat(payDetails.amount)).toFixed(6)
                      : 'N/A'}{' '}
                    {receiveToken?.symbol}
                  </p>
                  <p>
                    <strong>You Get:</strong> {estimatedOutput} {receiveToken?.symbol}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Price impact shows how much worse your rate is compared to the ideal rate with
                    infinite liquidity. The effective rate is what you actually get.
                  </p>
                </div>
              </InfoDialog>
            </div>
            <span className="transition-opacity duration-200 ease-in-out">
              {isEstimating ? (
                <span className="text-yellow-400">Calculating...</span>
              ) : payDetails.amount && parseFloat(payDetails.amount) > 0 ? (
                priceImpact === 'N/A' ? (
                  <span className="text-orange-400 text-xs">💧 No liquidity</span>
                ) : isNaN(parseFloat(priceImpact)) ? (
                  <span className="text-amber-400 text-xs">⚠️ Unable to calculate</span>
                ) : (
                  <div className="text-right">
                    <div>{priceImpact}%</div>
                    <div className="text-xs text-gray-500">
                      Effective: 1 {payToken.symbol} ={' '}
                      {(parseFloat(estimatedOutput) / parseFloat(payDetails.amount)).toFixed(4)}{' '}
                      {receiveToken.symbol}
                    </div>
                  </div>
                )
              ) : (
                <span className="text-gray-500">Enter amount</span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <span>TX fee:</span>
              <InfoDialog
                title="Transaction Fee Details"
                data={{
                  txFee,
                  payAmount: payDetails.amount,
                  isEstimating,
                  payToken: payToken?.symbol,
                  receiveToken: receiveToken?.symbol,
                  rawTxFee: txFee,
                  parsedTxFee: parseFloat(txFee),
                  isValidNumber: !isNaN(parseFloat(txFee)),
                  feePercentage:
                    payDetails.amount &&
                    !isNaN(parseFloat(txFee)) &&
                    !isNaN(parseFloat(payDetails.amount))
                      ? ((parseFloat(txFee) / parseFloat(payDetails.amount)) * 100).toFixed(4)
                      : 'N/A',
                }}
              >
                <div className="text-sm text-gray-300">
                  <p>
                    <strong>Status:</strong> {isEstimating ? 'Calculating...' : 'Ready'}
                  </p>
                  <p>
                    <strong>Raw Value:</strong> {txFee || 'undefined'}
                  </p>
                  <p>
                    <strong>Is Valid Number:</strong> {!isNaN(parseFloat(txFee)) ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Pay Amount:</strong> {payDetails.amount || 'Not set'}
                  </p>
                  {!isNaN(parseFloat(txFee)) && payDetails.amount && (
                    <p>
                      <strong>Fee Percentage:</strong>{' '}
                      {((parseFloat(txFee) / parseFloat(payDetails.amount)) * 100).toFixed(4)}%
                    </p>
                  )}
                </div>
              </InfoDialog>
            </div>
            <span className="transition-opacity duration-200 ease-in-out">
              {isEstimating ? (
                <span className="text-yellow-400">Calculating...</span>
              ) : payDetails.amount && parseFloat(payDetails.amount) > 0 ? (
                txFee === 'N/A' ? (
                  <span className="text-orange-400 text-xs">💧 No liquidity</span>
                ) : isNaN(parseFloat(txFee)) ? (
                  <span className="text-amber-400 text-xs">⚠️ Unable to calculate</span>
                ) : (
                  <>
                    {txFee} {payToken.symbol} ≈{' '}
                    {((parseFloat(txFee) / parseFloat(payDetails.amount)) * 100).toFixed(2)}%
                  </>
                )
              ) : (
                <span className="text-gray-500">Enter amount</span>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Slippage</span>
            <div className="flex items-center gap-2">
              <SmallInput
                type="number"
                value={tempSlippage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0) {
                    handleSlippageChange(value);
                  }
                }}
                className="w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span>%</span>
              {hasSlippageChanges && (
                <button
                  onClick={applySlippageChanges}
                  className="ml-1 p-1 text-green-400 hover:text-green-300 transition-colors duration-200 bg-green-400/10 hover:bg-green-400/20 rounded"
                  title="Apply slippage changes"
                >
                  <CheckIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>Min receive</span>
            <div className="flex items-center gap-2">
              {/* <input
                type="text"
                value={minReceiveInput}
                readOnly
                className="w-20 bg-adamant-app-input/20 backdrop-blur-sm border border-white/5 rounded-lg px-2.5 py-1 text-right outline-none text-gray-400 cursor-not-allowed"
              /> */}
              <span>{minReceive}</span>
              <span>{receiveToken.symbol}</span>
            </div>
          </div>
        </InfoContainer>
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
