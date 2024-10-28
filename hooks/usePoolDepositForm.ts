import { useState, useEffect } from "react";
import { usePoolStore } from "@/store/forms/poolStore";
import { calculatePriceImpact, calculateTxFee } from "@/utils/swap";
import BigNumber from "bignumber.js";

export const usePoolDepositForm = () => {
  const { tokenInputs, selectedPool } = usePoolStore();
  const [apr, setApr] = useState(0);
  const [estimatedLPTokens, setEstimatedLPTokens] = useState(0);

  useEffect(() => {
    if (selectedPool?.token0 && selectedPool?.token1) {
      const inputIdentifier1 = `pool.${selectedPool.token0.symbol}`;
      const inputIdentifier2 = `pool.${selectedPool.token1.symbol}`;
      const amount1 = new BigNumber(
        tokenInputs[inputIdentifier1]?.amount ?? "0"
      );
      const amount2 = new BigNumber(
        tokenInputs[inputIdentifier2]?.amount ?? "0"
      );

      // Calculate APR (placeholder)
      const calculatedApr = amount1.plus(amount2).times(0.1).toNumber();
      setApr(calculatedApr);

      // Calculate estimated LP tokens (placeholder)
      const calculatedLPTokens = amount1.plus(amount2).times(0.5).toNumber();
      setEstimatedLPTokens(calculatedLPTokens);
    }
  }, [tokenInputs, selectedPool]);

  const handleDepositClick = () => {
    if (selectedPool?.token0 && selectedPool?.token1) {
      const inputIdentifier1 = `pool.${selectedPool.token0.symbol}`;
      const inputIdentifier2 = `pool.${selectedPool.token1.symbol}`;
      const amount1 = tokenInputs[inputIdentifier1]?.amount ?? "0";
      const amount2 = tokenInputs[inputIdentifier2]?.amount ?? "0";

      const priceImpact = calculatePriceImpact(amount1);
      const txFee = calculateTxFee(amount1);

      console.log("Deposit clicked", {
        pool: selectedPool.address,
        token0: selectedPool.token0.symbol,
        amount1,
        token1: selectedPool.token1.symbol,
        amount2,
        priceImpact,
        txFee,
        estimatedLPTokens,
      });
    }
  };

  return {
    selectedPool,
    apr,
    estimatedLPTokens,
    handleDepositClick,
  };
};
