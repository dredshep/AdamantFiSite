import { useState, useEffect } from "react";
import { useSwapStore } from "@/store/swapStore";
import { useTokenStore } from "@/store/tokenStore";
import { SwappableToken } from "@/types/Token";
import {
  fetchSwappableTokens,
  fetchChartData,
  calculatePriceImpact,
  calculateTxFee,
  calculateMinReceive,
} from "@/utils/swap";

export const useSwapForm = () => {
  const [swappableTokens, setSwappableTokens] = useState<SwappableToken[]>([]);
  const [chartData, setChartData] = useState<{ time: number; value: number }[]>(
    []
  );
  const { swapTokenInputs: tokenInputs } = useSwapStore();
  const payDetails = tokenInputs["swap.pay"];
  const payToken = useTokenStore(
    (state) => state.tokens?.[payDetails.tokenAddress]
  );
  const receiveDetails = tokenInputs["swap.receive"];
  const receiveToken = useTokenStore(
    (state) => state.tokens?.[receiveDetails.tokenAddress]
  );
  const slippage = useSwapStore((state) => state.sharedSettings.slippage);
  const gas = useSwapStore((state) => state.sharedSettings.gas);

  const [priceImpact, setPriceImpact] = useState("0.7");
  const [txFee, setTxFee] = useState("0.1");
  const [minReceive, setMinReceive] = useState("70");

  useEffect(() => {
    void fetchSwappableTokens().then(setSwappableTokens);
  }, []);

  useEffect(() => {
    if (payToken?.address !== undefined) {
      void fetchChartData(payToken.address).then(setChartData);
    }
  }, [payToken?.address]);

  useEffect(() => {
    setPriceImpact(calculatePriceImpact(payDetails.amount));
    setTxFee(calculateTxFee(payDetails.amount));
    setMinReceive(calculateMinReceive(receiveDetails.amount));
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
Min Receive: ${minReceive} ${receiveToken?.symbol}

RawData: ${JSON.stringify(
      {
        payToken,
        payDetails,
        receiveToken,
        receiveDetails,
        slippage,
        gas,
        priceImpact,
        txFee,
        minReceive,
      },
      null,
      2
    )}`;

    alert(alertMessage);
  };

  return {
    swappableTokens,
    chartData,
    payDetails,
    payToken,
    receiveDetails,
    receiveToken,
    slippage,
    gas,
    priceImpact,
    txFee,
    minReceive,
    handleSwapClick,
  };
};
