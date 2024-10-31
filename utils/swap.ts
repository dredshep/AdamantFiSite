import { getApiToken } from "@/utils/apis/getSwappableTokens";
import { getTinyChartData } from "@/utils/apis/getTinyChartData";
import { SwappableToken } from "@/types/Token";
import { TokenInputState } from "@/types";

export const fetchSwappableTokens = async (): Promise<SwappableToken[]> => {
  return await getApiToken();
};

export const fetchChartData = async (tokenAddress: string) => {
  return await getTinyChartData(tokenAddress);
};

export const calculatePriceImpact = (amount: string): string => {
  return (parseFloat(amount) * 0.007).toFixed(4);
};

export const calculateTxFee = (amount: string): string => {
  return (parseFloat(amount) * 0.001).toFixed(4);
};

export const calculateMinReceive = (amount: string): string => {
  return (parseFloat(amount) * 0.99).toFixed(2);
};

interface HandleSwapClickProps {
  payToken: SwappableToken;
  payDetails: TokenInputState;
  receiveToken: SwappableToken;
  receiveDetails: TokenInputState;
  slippage: string;
  gas: string;
  priceImpact: string;
  txFee: string;
  minReceive: string;
}
export const handleSwapClick = ({
  payToken,
  payDetails,
  receiveToken,
  receiveDetails,
  slippage,
  gas,
  priceImpact,
  txFee,
  minReceive,
}: HandleSwapClickProps) => {
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
