import { usePoolStore } from "@/store/forms/poolStore";
import { calculatePriceImpact, calculateTxFee } from "@/utils/swap";
import { PoolTokenInputs, TablePool } from "@/types";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { getTablePools } from "@/utils/apis/getTablePools";
import { queryPool } from "@/utils/apis/getPairPool";
import { queryFactoryPairs } from "@/utils/apis/getFactoryPairs";
import { getSwappableTokens } from "@/utils/apis/getSwappableTokens";

interface PairPoolData {
  assets: {
    info: {
      token: {
        contract_addr: string;
        token_code_hash: string;
        viewing_key: string;
      };
    };
    amount: string;
  }[];
  total_share: string;
}

export const usePoolDepositForm = (
  poolAddress: string | string[] | undefined
) => {
  const {
    tokenInputs,
    selectedPool,
    setTokenInputAmount,
    setSelectedPool,
    // setPoolTokens,
  } = usePoolStore();
  const [pools, setPools] = useState<TablePool[]>([]);
  const [pairPoolData, setPairPoolData] = useState<PairPoolData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (typeof poolAddress !== "string") return;

        const [poolsData, pairData, factoryPairs, tokens] = await Promise.all([
          getTablePools(),
          queryPool(poolAddress),
          queryFactoryPairs(),
          getSwappableTokens(),
        ]);

        setPools(poolsData);
        if (pairData !== null && typeof pairData === "object") {
          setPairPoolData(pairData);
        }

        // Find the corresponding pair and set it in both stores
        const pair = factoryPairs.find((p) => p.contract_addr === poolAddress);
        if (pair !== undefined) {
          const token0Address = pair.asset_infos[0]?.token?.contract_addr;
          const token1Address = pair.asset_infos[1]?.token?.contract_addr;

          if (
            typeof token0Address === "string" &&
            token0Address.length > 0 &&
            typeof token1Address === "string" &&
            token1Address.length > 0
          ) {
            const token0 = tokens.find((t) => t.address === token0Address);
            const token1 = tokens.find((t) => t.address === token1Address);

            if (token0 !== undefined && token1 !== undefined) {
              // Set pool for deposit form
              setSelectedPool({
                address: poolAddress,
                token0,
                token1,
                pairInfo: pair,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [poolAddress, setSelectedPool]);

  const setMax = (inputIdentifier: keyof PoolTokenInputs) => {
    setTokenInputAmount(inputIdentifier, tokenInputs[inputIdentifier].balance);
  };

  const handleDepositClick = () => {
    if (selectedPool?.token0 && selectedPool?.token1) {
      const inputIdentifier1 = `pool.deposit.tokenA`;
      const inputIdentifier2 = `pool.deposit.tokenB`;
      const amount1 = tokenInputs[inputIdentifier1].amount;
      const amount2 = tokenInputs[inputIdentifier2].amount;

      if (amount1 === "0" || amount2 === "0") {
        toast.error("Please enter an amount for both tokens", {});
        return;
      }

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
      });
    }
  };

  const poolDetails = pools.find((p) => p.contract_address === poolAddress);

  return {
    tokenInputs,
    setTokenInputAmount,
    setMax,
    selectedPool,
    handleDepositClick,
    loading,
    poolDetails,
    pairPoolData,
  };
};
