import Decimal from "decimal.js";
import { SecretNetworkClient } from "secretjs";
import { calculateSingleHopOutput, getPoolData } from ".";

export const estimateSingleHopOutput = async (
  secretjs: SecretNetworkClient,
  poolAddress: string,
  amountIn: Decimal,
  inputToken: string,
  outputToken: string
): Promise<{
  output: Decimal;
  idealOutput: Decimal;
  priceImpact: string;
  lpFee: Decimal;
  gasCost: string;
}> => {
  const poolData = await getPoolData(secretjs, poolAddress);
  const { output, idealOutput, priceImpact, lpFee } = calculateSingleHopOutput(
    amountIn,
    poolData,
    inputToken,
    outputToken
  );

  // Gas cost for a single hop
  const gasCost = "0.12 SCRT";

  return {
    output,
    idealOutput,
    priceImpact,
    lpFee,
    gasCost,
  };
};
