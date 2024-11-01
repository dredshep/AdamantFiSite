import { useState, useEffect } from "react";
import { usePoolStore } from "@/store/forms/poolStore";
import { useTxStore } from "@/store/txStore";
import { PoolTokenInputs } from "@/types";
import { getApiTokenSymbol } from "@/utils/apis/getSwappableTokens";
import { calculatePriceImpact, calculateTxFee } from "@/utils/swap";
import { getCodeHashByAddress } from "@/utils/secretjs/getCodeHashByAddress";
import { provideLiquidity } from "@/utils/secretjs/provideLiquidity";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { fetchPoolData, validatePoolAddress } from "./queryFunctions";
import type {
  LoadingState,
  SelectedPoolType,
  UsePoolDepositFormResult,
} from "./types";
import { SecretNetworkClient, TxResultCode } from "secretjs";
import { Window } from "@keplr-wallet/types";
import isNotNullish from "@/utils/isNotNullish";
import { Asset, ContractInfo } from "@/types/secretswap/shared";

// Define the store's token input type with proper index signature
interface TokenInputs extends PoolTokenInputs {
  [key: string]: { amount: string; balance: string };
}

export function usePoolForm(
  poolAddress: string | string[] | undefined,
): UsePoolDepositFormResult {
  const { tokenInputs, selectedPool, setTokenInputAmount, setSelectedPool } =
    usePoolStore();

  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  // const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { setPending, setResult } = useTxStore.getState();

  // TODO: reduce this code duplication. the same effect is defined in the swap form
  useEffect(() => {
    const keplr = (window as unknown as Window).keplr;
    const connectKeplr = async () => {
      if (!isNotNullish(keplr)) {
        alert("Please install Keplr extension");
        return;
      }

      await keplr.enable("secret-4");

      const offlineSigner = keplr.getOfflineSignerOnlyAmino("secret-4");
      const enigmaUtils = keplr.getEnigmaUtils("secret-4");
      const accounts = await offlineSigner?.getAccounts();

      if (
        accounts !== undefined &&
        accounts.length === 0 &&
        accounts[0] === undefined
      ) {
        alert("No accounts found");
        return;
      }
      if (offlineSigner === undefined) {
        alert("No offline signer found");
        return;
      }

      const client = new SecretNetworkClient({
        chainId: "secret-4",
        url: "https://rpc.ankr.com/http/scrt_cosmos",
        wallet: offlineSigner,
        walletAddress: accounts[0]!.address,
        encryptionUtils: enigmaUtils,
      });

      // setWalletAddress(accounts[0]!.address);

      setSecretjs(client);
    };

    void connectKeplr();
  }, []);

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
          balance,
        );
      }
    }
  };

  const handleDepositClick = async (): Promise<void> => {
    if (!selectedPool?.token0 || !selectedPool?.token1) return;
    if (!secretjs) return;

    const inputIdentifier1 = `pool.deposit.tokenA`;
    const inputIdentifier2 = `pool.deposit.tokenB`;

    const amount0 = safeTokenInputs[inputIdentifier1]?.amount ?? "0";
    const amount1 = safeTokenInputs[inputIdentifier2]?.amount ?? "0";

    if (amount0 === "0" || amount1 === "0") {
      toast.error("Please enter an amount for both tokens");
      return;
    }

    const address0 = selectedPool.token0.address;
    const address1 = selectedPool.token1.address;

    if (address0 === undefined || address1 === undefined) {
      toast.error("Undefined token address");
      return;
    }

    const priceImpact = calculatePriceImpact(amount1);
    const txFee = calculateTxFee(amount1);

    // TODO: Map pair address to code_hash. They will all be the same for now.
    const pairContract: ContractInfo = {
      address: selectedPool.address,
      code_hash:
        "0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490",
    };

    const asset0: Asset = {
      info: {
        token: {
          contract_addr: address0,
          token_code_hash: getCodeHashByAddress(address0),
          viewing_key: "SecretSwap",
        },
      },
      amount: amount0,
    };

    const asset1: Asset = {
      info: {
        token: {
          contract_addr: address1,
          token_code_hash: getCodeHashByAddress(address1),
          viewing_key: "SecretSwap",
        },
      },
      amount: amount1,
    };

    console.log("Deposit clicked", {
      pool: selectedPool.address,
      token0: getApiTokenSymbol(selectedPool.token0),
      amount0,
      token1: getApiTokenSymbol(selectedPool.token1),
      amount1,
      priceImpact,
      txFee,
    });

    try {
      setPending(true);

      const result = await provideLiquidity(
        secretjs,
        pairContract,
        asset0,
        asset1,
      );

      setPending(false);
      setResult(result);

      console.log("Transaction Result:", result);

      if (result.code !== TxResultCode.Success) {
        throw new Error(`Swap failed: ${result.rawLog}`);
      }
    } catch (error) {
      console.error("Error during tx execution:", error);
      alert("Transaction failed. Check the console for more details.");
    }
  };

  // TODO: make this async
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
      token0: getApiTokenSymbol(selectedPool.token0),
      amount1,
      token1: getApiTokenSymbol(selectedPool.token1),
      amount2,
      priceImpact,
      txFee,
    });
  };

  const handleClick = (intent: "deposit" | "withdraw"): void => {
    if (intent === "deposit") {
      void handleDepositClick();
    } else if (intent === "withdraw") {
      void handleWithdrawClick();
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
