import { useSwapStore } from "@/store/swapStore";
import { useTokenStore } from "@/store/tokenStore";
import { getApiTokenSymbol } from "@/utils/apis/getSwappableTokens";

const AddLiquidityPrompt = () => {
  const { swapTokenInputs: tokenInputs } = useSwapStore();
  const { tokens } = useTokenStore();
  const receiveTokenAddress = tokenInputs["swap.receive"].tokenAddress;
  const payTokenAddress = tokenInputs["swap.pay"].tokenAddress;
  const receiveToken = tokens?.[receiveTokenAddress];
  const payToken = tokens?.[payTokenAddress];

  return payToken && receiveToken ? (
    <div>
      + Add liquidity for {getApiTokenSymbol(payToken)} and{" "}
      {getApiTokenSymbol(receiveToken)}
    </div>
  ) : (
    <div>Loading tokens...</div>
  );
};
export default AddLiquidityPrompt;
