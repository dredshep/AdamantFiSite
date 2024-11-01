import Decimal from "decimal.js";
import { SecretNetworkClient } from "secretjs";
import { calculateSingleHopOutput, getPoolData } from ".";

// if (
//   !isNotNullish(process.env["NEXT_PUBLIC_SECRET_NETWORK_URL"]) ||
//   !isNotNullish(process.env["NEXT_PUBLIC_SECRET_NETWORK_CHAIN_ID"])
// ) {
//   throw new Error(
//     "NEXT_PUBLIC_SECRET_NETWORK_URL and NEXT_PUBLIC_SECRET_NETWORK_CHAIN_ID must be set"
//   );
// }

// const secretjs = new SecretNetworkClient({
//   url: process.env["NEXT_PUBLIC_SECRET_NETWORK_URL"],
//   chainId: process.env["NEXT_PUBLIC_SECRET_NETWORK_CHAIN_ID"],
// });

export const calculateEdgeWeight = async (
  inputToken: string,
  outputToken: string,
  poolAddress: string,
  secretjs: SecretNetworkClient
): Promise<number> => {
  const amountIn = new Decimal(1); // Test with a unit amount
  const poolData = await getPoolData(secretjs, poolAddress);

  const { output } = calculateSingleHopOutput(
    amountIn,
    poolData,
    inputToken,
    outputToken
  );

  // Avoid division by zero
  if (output.isZero()) {
    return Infinity;
  }

  // Calculate the negative logarithm of the normalized output as the weight
  const weight = -Math.log(output.toNumber());
  return weight;
};
