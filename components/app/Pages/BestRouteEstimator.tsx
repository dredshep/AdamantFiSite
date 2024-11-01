import { useSwapForm } from "@/hooks/useSwapForm";
import { PathEstimation } from "@/types/estimation";
import {
  buildTokenPoolMap,
  estimateBestPath,
  findOptimalPath,
} from "@/utils/estimation";
import { fetchPoolData } from "@/utils/estimation/fetchPoolData";
import Decimal from "decimal.js";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SecretNetworkClient } from "secretjs";

interface BestRouteEstimatorProps {
  secretjs: SecretNetworkClient | null;
}

function BestRouteEstimator({ secretjs }: BestRouteEstimatorProps) {
  const { payDetails, receiveDetails } = useSwapForm();
  const [bestPathEstimation, setBestPathEstimation] =
    useState<PathEstimation | null>(null);

  useEffect(() => {
    const handleEstimate = async () => {
      console.log(`\n--- Estimating best path ---`);
      console.log(`Input Token: ${payDetails.tokenAddress}`);
      console.log(`Output Token: ${receiveDetails.tokenAddress}`);
      console.log(`Amount In: ${payDetails.amount}`);
      console.log(`--- Step 1: Fetching pool data ---`);
      if (
        secretjs &&
        payDetails.amount &&
        payDetails.tokenAddress &&
        receiveDetails.tokenAddress &&
        !isNaN(Number(payDetails.amount)) &&
        Number(payDetails.amount) > 0
      ) {
        console.log(`--- Step 2: Building token pool map ---`);
        const amountInDecimal = new Decimal(payDetails.amount.trim());
        console.log(`--- Step 3: Finding optimal path ---`);
        const tokenPoolMap = buildTokenPoolMap(await fetchPoolData());

        try {
          const optimalPath = await findOptimalPath(
            tokenPoolMap,
            payDetails.tokenAddress,
            receiveDetails.tokenAddress,
            secretjs
          );

          const estimation = await estimateBestPath(
            secretjs,
            [optimalPath],
            amountInDecimal
          );
          setBestPathEstimation(estimation);
        } catch (error) {
          console.error("Error finding optimal path:", error);
        }
      } else {
        console.error("Invalid input for estimation:", payDetails);
      }
    };

    void handleEstimate();
  }, [
    secretjs,
    payDetails.tokenAddress,
    receiveDetails.tokenAddress,
    payDetails.amount,
  ]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-2xl font-bold text-white">Best Route Estimation </h2>
      {bestPathEstimation ? (
        <div className="text-white">
          <p>
            Best Route:{" "}
            {bestPathEstimation.path.tokens.map(
              (token: string, index: number) => (
                <span key={token}>
                  {index > 0 && " -> "}
                  {/* Replace with your logo component */}
                  <Image
                    src={`path/to/logo/${token}.png`}
                    alt={token}
                    className="inline w-6 h-6"
                    width={24}
                    height={24}
                  />
                </span>
              )
            )}
          </p>
          <p>Final Output: {bestPathEstimation.finalOutput.toString()}</p>
          <p>Ideal Output: {bestPathEstimation.idealOutput.toString()}</p>
          <p>LP Fee: {bestPathEstimation.totalLpFee.toString()}</p>
          <p>Price Impact: {bestPathEstimation.totalPriceImpact}</p>
          <p>Gas Cost: {bestPathEstimation.totalGasCost}</p>
        </div>
      ) : (
        <p className="text-gray-400">Estimating...</p>
      )}
    </div>
  );
}

export default BestRouteEstimator;
