import { usePoolStore } from "@/store/forms/poolStore";
import { calculatePriceImpact, calculateTxFee } from "@/utils/swap";
import { PoolTokenInputs } from "@/types";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { getTablePools } from "@/utils/apis/getTablePools";
import { queryPool } from "@/utils/apis/getPairPool";
import { queryFactoryPairs } from "@/utils/apis/getFactoryPairs";
import { getApiToken } from "@/utils/apis/getSwappableTokens";

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

interface PoolDetails {
  contract_address: string;
  name: string;
  about: string;
}

interface PoolQueryResult {
  pools: PoolDetails[];
  pairPoolData: PairPoolData;
  poolDetails: PoolDetails | undefined;
}

type LoadingState = {
  status: "loading" | "error" | "success";
  message?: string | undefined;
};

export const usePoolDepositForm = (
  poolAddress: string | string[] | undefined
) => {
  const { tokenInputs, selectedPool, setTokenInputAmount, setSelectedPool } =
    usePoolStore();

  const query = useQuery<PoolQueryResult>({
    queryKey: ["pool-data", poolAddress],
    queryFn: async () => {
      if (typeof poolAddress !== "string") {
        throw new Error("Invalid pool address");
      }

      const [poolsData, pairData, factoryPairs, tokens] = await Promise.all([
        getTablePools(),
        queryPool(poolAddress),
        queryFactoryPairs(),
        getApiToken(),
      ]);

      // Find and set the corresponding pair
      const pair = factoryPairs.find((p) => p.contract_addr === poolAddress);
      if (pair) {
        const token0Address = pair.asset_infos[0]?.token?.contract_addr;
        const token1Address = pair.asset_infos[1]?.token?.contract_addr;

        if (
          typeof token0Address === "string" &&
          typeof token1Address === "string" &&
          token0Address.length > 0 &&
          token1Address.length > 0
        ) {
          const token0 = tokens.find((t) => t.address === token0Address);
          const token1 = tokens.find((t) => t.address === token1Address);

          if (token0 && token1) {
            setSelectedPool({
              address: poolAddress,
              token0,
              token1,
              pairInfo: pair,
            });
          }
        }
      }

      if (pairData === undefined || typeof pairData !== "object") {
        throw new Error("Invalid pair data received");
      }

      const typedPairData = pairData as PairPoolData;

      return {
        pools: poolsData,
        pairPoolData: typedPairData,
        poolDetails: poolsData.find((p) => p.contract_address === poolAddress),
      };
    },
    enabled: typeof poolAddress === "string",
  });

  const loadingState: LoadingState = {
    status: query.isLoading
      ? "loading"
      : query.error instanceof Error
      ? "error"
      : "success",
    message: query.isLoading
      ? "Loading pool data..."
      : query.error instanceof Error
      ? query.error.message
      : undefined,
  };

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

  return {
    tokenInputs,
    setTokenInputAmount,
    setMax,
    selectedPool,
    handleDepositClick,
    loadingState,
    poolDetails: query.data?.poolDetails,
    pairPoolData: query.data?.pairPoolData,
  };
};
