import { useStore } from "@/store/swapStore";
import { useTokenStore } from "@/store/tokenStore";

const AddLiquidityPrompt = () => {
  const { tokenInputs } = useStore();
  const { tokens } = useTokenStore();
  const receiveTokenAddress = tokenInputs["swap.receive"].tokenAddress;
  const payTokenAddress = tokenInputs["swap.pay"].tokenAddress;
  const receiveToken = tokens?.[receiveTokenAddress];
  const payToken = tokens?.[payTokenAddress];

  return payToken && receiveToken ? (
    <div>
      + Add liquidity for {payToken.symbol} and {receiveToken.symbol}
    </div>
  ) : (
    <div>Loading tokens...</div>
  );
};
export default AddLiquidityPrompt;
