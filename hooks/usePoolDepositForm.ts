import { useState, useEffect } from "react";
import { usePoolStore } from "@/store/forms/poolStore";
import { getTableTokens } from "@/utils/apis/getTableTokens";
import { Token, TableToken } from "@/types";
import { calculatePriceImpact, calculateTxFee } from "@/utils/swap";
import BigNumber from "bignumber.js";

export const usePoolDepositForm = () => {
  const { tokenInputs } = usePoolStore();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [apr, setApr] = useState(0);
  const [estimatedLPTokens, setEstimatedLPTokens] = useState(0);

  useEffect(() => {
    const fetchTokens = async () => {
      const fetchedTokens = await getTableTokens();
      // Convert TableToken to Token
      const convertedTokens: Token[] = fetchedTokens.map(
        (token: TableToken) => ({
          symbol: token.name, // Assuming name is used as symbol
          address: token.address,
          isNativeToken: false, // Assuming all are not native tokens
          network: token.network,
          usdPrice: token.price,
          balance: "0", // Set a default balance
          viewingKey: "", // Set a default viewing key
          protocol: "", // Set a default protocol
          priceVsNativeToken: "1", // Set a default price vs native token
        })
      );
      setTokens(convertedTokens);
    };
    fetchTokens();
  }, []);

  useEffect(() => {
    if (tokens.length >= 2) {
      const inputIdentifier1 = `pool.${tokens[0].symbol}`;
      const inputIdentifier2 = `pool.${tokens[1].symbol}`;
      const amount1 = new BigNumber(
        tokenInputs[inputIdentifier1]?.amount || "0"
      );
      const amount2 = new BigNumber(
        tokenInputs[inputIdentifier2]?.amount || "0"
      );

      // Calculate APR (this is a placeholder, replace with actual calculation)
      const calculatedApr = amount1.plus(amount2).times(0.1).toNumber();
      setApr(calculatedApr);

      // Calculate estimated LP tokens (this is a placeholder, replace with actual calculation)
      const calculatedLPTokens = amount1.plus(amount2).times(0.5).toNumber();
      setEstimatedLPTokens(calculatedLPTokens);
    }
  }, [tokenInputs, tokens]);

  const handleDepositClick = () => {
    if (tokens.length >= 2) {
      const inputIdentifier1 = `pool.${tokens[0].symbol}`;
      const inputIdentifier2 = `pool.${tokens[1].symbol}`;
      const amount1 = tokenInputs[inputIdentifier1]?.amount || "0";
      const amount2 = tokenInputs[inputIdentifier2]?.amount || "0";

      const priceImpact = calculatePriceImpact(amount1);
      const txFee = calculateTxFee(amount1);

      // This is a placeholder. You should implement the actual deposit logic here.
      console.log("Deposit clicked", {
        token1: tokens[0].symbol,
        amount1,
        token2: tokens[1].symbol,
        amount2,
        priceImpact,
        txFee,
        estimatedLPTokens,
      });
    }
  };

  return {
    tokens,
    apr,
    estimatedLPTokens,
    handleDepositClick,
  };
};
