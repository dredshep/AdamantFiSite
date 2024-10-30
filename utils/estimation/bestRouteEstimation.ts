import { PathEstimation } from "@/pages/app/testing/estimate/a";
import { Path } from "@/types/estimation/Path";
import Decimal from "decimal.js";
import { SecretNetworkClient } from "secretjs";
import { estimateSingleHopOutput } from ".";

export const estimateBestPath = async (
  secretjs: SecretNetworkClient,
  paths: Path[],
  initialAmountIn: Decimal
): Promise<PathEstimation | null> => {
  let bestEstimation: PathEstimation | null = null;
  console.log(`\n--- Estimating best path ---`);
  console.log(`Paths: ${paths.length}`);
  for (const path of paths) {
    let amountIn = initialAmountIn;
    let totalLpFee = new Decimal(0);
    let totalPriceImpact = new Decimal(0);
    let cumulativeIdealOutput = new Decimal(0); // Track cumulative ideal output
    const hopGasCost =
      path.pools.length > 1 ? new Decimal(0.2) : new Decimal(0.12); // 0.12 for single-hop, 0.20 for multi-hop

    try {
      for (let i = 0; i < path.pools.length; i++) {
        const poolAddress = path.pools[i];
        const inputToken = path.tokens[i];
        const outputToken = path.tokens[i + 1];

        console.log(`\n--- Hop ${i + 1} ---`);
        console.log(`Input Token: ${inputToken}`);
        console.log(`Output Token: ${outputToken}`);

        if (
          typeof inputToken !== "string" ||
          typeof outputToken !== "string" ||
          typeof poolAddress !== "string"
        ) {
          throw new Error("Invalid token addresses");
        }

        const { output, idealOutput, priceImpact, lpFee } =
          await estimateSingleHopOutput(
            secretjs,
            poolAddress,
            amountIn,
            inputToken,
            outputToken
          );

        console.log(`Output from hop ${i + 1}: ${output.toString()}`);
        console.log(
          `Ideal Output from hop ${i + 1}: ${idealOutput.toString()}`
        );

        if (output.isNegative()) {
          console.error(`Negative output detected after hop ${i + 1}`);
          return null; // Abort if a negative output is detected
        }

        amountIn = output; // The output of one hop becomes the input for the next
        totalLpFee = totalLpFee.add(lpFee);
        totalPriceImpact = totalPriceImpact.add(new Decimal(priceImpact));
        cumulativeIdealOutput = idealOutput; // Update cumulative ideal output to reflect the most recent hop
      }

      const totalGasCost =
        hopGasCost.mul(path.pools.length).toFixed(2) + " SCRT";

      // Directly use the last output amount without subtracting the lpFee again
      const adjustedFinalOutput = amountIn;

      console.log(
        `Final Output after all hops: ${adjustedFinalOutput.toString()}`
      );

      if (
        !bestEstimation ||
        adjustedFinalOutput.greaterThan(bestEstimation.finalOutput)
      ) {
        bestEstimation = {
          path,
          finalOutput: adjustedFinalOutput,
          totalPriceImpact: totalPriceImpact.toFixed(2),
          totalLpFee, // LP Fee is informative, not deducted from output
          totalGasCost,
          idealOutput: cumulativeIdealOutput, // Store the latest ideal output
        };
      }
    } catch (error) {
      console.error("Error estimating path output:", error);
    }
  }

  return bestEstimation;
};
