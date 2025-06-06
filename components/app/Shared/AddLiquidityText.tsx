import { useSwapStore } from '@/store/swapStore';
import { useTokenStore } from '@/store/tokenStore';

const AddLiquidityPrompt = () => {
  const { swapTokenInputs: tokenInputs } = useSwapStore();
  const { tokens } = useTokenStore();
  const receiveTokenAddress = tokenInputs['swap.receive'].tokenAddress;
  const payTokenAddress = tokenInputs['swap.pay'].tokenAddress;
  const receiveToken = tokens?.[receiveTokenAddress];
  const payToken = tokens?.[payTokenAddress];

  return payToken !== undefined && receiveToken !== undefined ? (
    <div>
      + Add liquidity for {payToken.symbol} and {receiveToken.symbol}
    </div>
  ) : (
    <div>Loading tokens...</div>
  );
};
export default AddLiquidityPrompt;
