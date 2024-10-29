import { useQuery } from "@tanstack/react-query";
import { usePoolStore } from "@/store/forms/poolStore";
import { calculatePriceImpact, calculateTxFee } from "@/utils/swap";
import { toast } from "react-toastify";
import { fetchPoolData, validatePoolAddress } from "./queryFunctions";
import type {
  UsePoolDepositFormResult,
  LoadingState,
  SelectedPoolType,
} from "./types";
import { PoolTokenInputs } from "@/types";

// Define the store's token input type with proper index signature
interface TokenInputs extends PoolTokenInputs {
  [key: string]: { amount: string; balance: string };
}

export function usePoolForm(
  poolAddress: string | string[] | undefined
): UsePoolDepositFormResult {
  const { tokenInputs, selectedPool, setTokenInputAmount, setSelectedPool } =
    usePoolStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pool-data", poolAddress],
    queryFn: async () => {
      const validPoolAddress = validatePoolAddress(poolAddress);
      return await fetchPoolData(validPoolAddress, (pool: SelectedPoolType) => {
        setSelectedPool({
          address: pool.address,
          token0: pool.token0,
          token1: pool.token1,
          pairInfo: {
            ...pool.pairInfo,
            liquidity_token: "",
            token_code_hash: "",
            asset0_volume: "0",
            asset1_volume: "0",
            factory: {
              address: "",
              code_hash: "",
            },
          },
        });
      });
    },
    enabled: typeof poolAddress === "string",
  });

  const loadingState: LoadingState = {
    status:
      isLoading === true
        ? "loading"
        : error instanceof Error
        ? "error"
        : "success",
    message:
      isLoading === true
        ? "Loading pool data..."
        : error instanceof Error
        ? error.message
        : undefined,
  };

  const safeTokenInputs = tokenInputs as unknown as TokenInputs;

  const setMax = (inputIdentifier: string): void => {
    if (inputIdentifier in safeTokenInputs) {
      const balance = safeTokenInputs[inputIdentifier]?.balance;
      if (balance !== undefined && balance !== "" && balance !== null) {
        setTokenInputAmount(
          inputIdentifier as keyof typeof tokenInputs,
          balance
        );
      }
    }
  };

  const handleDepositClick = (): void => {
    if (!selectedPool?.token0 || !selectedPool?.token1) return;

    const inputIdentifier1 = `pool.deposit.tokenA`;
    const inputIdentifier2 = `pool.deposit.tokenB`;

    const amount1 = safeTokenInputs[inputIdentifier1]?.amount ?? "0";
    const amount2 = safeTokenInputs[inputIdentifier2]?.amount ?? "0";

    if (amount1 === "0" || amount2 === "0") {
      toast.error("Please enter an amount for both tokens");
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
  };

  const handleWithdrawClick = (): void => {
    if (!selectedPool?.token0 || !selectedPool?.token1) return;

    const inputIdentifier1 = `pool.withdraw.tokenA`;
    const inputIdentifier2 = `pool.withdraw.tokenB`;

    const amount1 = safeTokenInputs[inputIdentifier1]?.amount ?? "0";
    const amount2 = safeTokenInputs[inputIdentifier2]?.amount ?? "0";

    if (amount1 === "0" || amount2 === "0") {
      toast.error("Please enter an amount for both tokens");
      return;
    }

    const priceImpact = calculatePriceImpact(amount1);
    const txFee = calculateTxFee(amount1);

    console.log("Withdraw clicked", {
      pool: selectedPool.address,
      token0: selectedPool.token0.symbol,
      amount1,
      token1: selectedPool.token1.symbol,
      amount2,
      priceImpact,
      txFee,
    });
  };

  const handleClick = (intent: "deposit" | "withdraw"): void => {
    if (intent === "deposit") {
      handleDepositClick();
    } else if (intent === "withdraw") {
      handleWithdrawClick();
    }
  };

  const typedSelectedPool = selectedPool
    ? {
        address: selectedPool.address,
        token0: selectedPool.token0!,
        token1: selectedPool.token1!,
        pairInfo: {
          contract_addr: selectedPool.pairInfo.contract_addr,
          asset_infos: selectedPool.pairInfo.asset_infos,
        },
      }
    : null;

  return {
    tokenInputs: safeTokenInputs,
    setTokenInputAmount: (key: string, value: string) =>
      setTokenInputAmount(key as keyof typeof tokenInputs, value),
    setMax,
    selectedPool: typedSelectedPool,
    // handleDepositClick,
    loadingState,
    poolDetails: data?.poolDetails,
    pairPoolData: data?.pairPoolData,
    handleClick,
  };
}
