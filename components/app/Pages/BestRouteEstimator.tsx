import React, { useState, useEffect } from "react";
import { SecretNetworkClient } from "secretjs";
import Decimal from "decimal.js";
// import { fullPoolsData } from "../../../../components/app/Testing/fullPoolsData";
import {
  buildTokenPoolMap,
  findPaths,
  estimateBestPath,
} from "@/utils/estimation"; // Assuming these functions are extracted to a utility file
import { fetchPoolData } from "@/utils/estimation/fetchPoolData";
import { PathEstimation } from "@/pages/app/testing/estimate/a";
import Image from "next/image";
import { useSwapForm } from "@/hooks/useSwapForm";

interface BestRouteEstimatorProps {
  secretjs: SecretNetworkClient | null;
  // inputToken: string;
  // outputToken: string;
  // amountIn: string;
}

function BestRouteEstimator({
  secretjs,
}: // inputToken,
// outputToken,
// amountIn,
BestRouteEstimatorProps) {
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
      const fullPoolsData = await fetchPoolData();

      // Validate payDetails before proceeding
      const amountIn = payDetails.amount?.trim(); // Trim whitespace
      if (
        secretjs !== null &&
        amountIn !== null &&
        payDetails.tokenAddress !== null &&
        receiveDetails.tokenAddress !== null &&
        !isNaN(Number(amountIn)) && // Check if amount is a valid number
        amountIn !== "" && // Ensure it's not an empty string
        Number(amountIn) > 0 // Ensure it's a positive number
      ) {
        console.log(`--- Step 2: Building token pool map ---`);
        const amountInDecimal = new Decimal(amountIn);
        const tokenPoolMap = buildTokenPoolMap(fullPoolsData);
        console.log(`--- Step 3: Finding paths ---`);
        const paths = findPaths(
          tokenPoolMap,
          payDetails.tokenAddress,
          receiveDetails.tokenAddress
        );

        if (paths.length === 0) {
          console.log("No available paths found for the selected tokens.");
          return;
        }

        const estimation = await estimateBestPath(
          secretjs,
          paths,
          amountInDecimal
        );
        setBestPathEstimation(estimation);
      } else {
        console.error("Invalid input for estimation:", payDetails);
        if (amountIn === null || amountIn === "") {
          console.error("Amount is null or empty.");
        } else if (isNaN(Number(amountIn))) {
          console.error("Amount is not a valid number:", amountIn);
        } else if (Number(amountIn) <= 0) {
          console.error("Amount must be a positive number:", amountIn);
        }
      }
    };

    if (
      secretjs !== null &&
      payDetails.tokenAddress !== null &&
      receiveDetails.tokenAddress !== null &&
      payDetails.amount !== null &&
      payDetails.amount.trim() !== ""
    ) {
      void handleEstimate();
    } else {
      // console.error("Invalid input for estimation:", payDetails);
    }
  }, [
    secretjs,
    payDetails.tokenAddress,
    receiveDetails.tokenAddress,
    payDetails.amount,
    payDetails,
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
