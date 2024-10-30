import { useState, useEffect } from "react";
import { useSwapStore } from "@/store/swapStore";
import { useTokenStore } from "@/store/tokenStore";
import { SwappableToken } from "@/types/Token";
import {
  fetchSwappableTokens,
  fetchChartData,
  calculatePriceImpact,
  calculateTxFee,
  calculateMinReceive,
} from "@/utils/swap";
// new imports
import { getTokenDecimals } from "@/utils/apis/tokenInfo";
import { SecretNetworkClient, TxOptions, TxResultCode } from "secretjs";
import Decimal from "decimal.js";
import {
  PathEstimation,
  buildTokenPoolMap,
  findPaths,
  estimateBestPath,
} from "@/utils/swap/estimate";
// TODO: Find a way to not need to import this.
import { fullPoolsData } from "@/components/app/Testing/fullPoolsData";

export const useSwapForm = () => {
  const [swappableTokens, setSwappableTokens] = useState<SwappableToken[]>([]);
  const [chartData, setChartData] = useState<{ time: number; value: number }[]>(
    [],
  );
  const { swapTokenInputs: tokenInputs } = useSwapStore.getState();
  const payDetails = tokenInputs["swap.pay"];
  const payToken = useTokenStore(
    (state) => state.tokens?.[payDetails.tokenAddress],
  );
  const receiveDetails = tokenInputs["swap.receive"];
  const receiveToken = useTokenStore(
    (state) => state.tokens?.[receiveDetails.tokenAddress],
  );
  const slippage = useSwapStore((state) => state.sharedSettings.slippage);
  const gas = useSwapStore((state) => state.sharedSettings.gas);

  const [priceImpact, setPriceImpact] = useState("0.7");
  const [txFee, setTxFee] = useState("0.1");
  const [minReceive, setMinReceive] = useState("70");

  // new state
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [bestPathEstimation, setBestPathEstimation] =
    useState<PathEstimation | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<string>("");

  useEffect(() => {
    void fetchSwappableTokens().then(setSwappableTokens);
  }, []);

  useEffect(() => {
    if (payToken?.address !== undefined) {
      void fetchChartData(payToken.address).then(setChartData);
    }
  }, [payToken?.address]);

  useEffect(() => {
    setPriceImpact(calculatePriceImpact(payDetails.amount));
    setTxFee(calculateTxFee(payDetails.amount));
    setMinReceive(calculateMinReceive(receiveDetails.amount));
  }, [payDetails.amount, receiveDetails.amount]);

  // new effects
  useEffect(() => {
    const connectKeplr = async () => {
      if (!window.keplr) {
        alert("Please install Keplr extension");
        return;
      }

      await window.keplr.enable("secret-4");

      const offlineSigner = window.keplr.getOfflineSignerOnlyAmino("secret-4");
      const enigmaUtils = window.keplr.getEnigmaUtils("secret-4");
      const accounts = await offlineSigner?.getAccounts();

      if (!accounts || accounts.length === 0 || accounts[0] === undefined) {
        alert("No accounts found");
        return;
      }
      if (!offlineSigner) {
        alert("No offline signer found");
        return;
      }

      const client = new SecretNetworkClient({
        chainId: "secret-4",
        url: "https://rpc.ankr.com/http/scrt_cosmos",
        wallet: offlineSigner,
        walletAddress: accounts[0].address,
        encryptionUtils: enigmaUtils,
      });

      setWalletAddress(accounts[0].address);

      setSecretjs(client);
    };

    void connectKeplr();
  }, []);

  // first, we estimate the full swap details

  const handleEstimate = async () => {
    if (
      secretjs &&
      payDetails.amount &&
      payToken?.address &&
      receiveToken?.address
    ) {
      const amountInDecimal = new Decimal(payDetails.amount);
      const tokenPoolMap = buildTokenPoolMap(fullPoolsData);
      const paths = findPaths(
        tokenPoolMap,
        payToken.address,
        receiveToken.address,
      );

      if (paths.length === 0) {
        console.log("No available paths found for the selected tokens.");
        return;
      }

      const bestPathEstimation = await estimateBestPath(
        secretjs,
        paths,
        amountInDecimal,
      );

      if (bestPathEstimation) {
        console.log("--- Best Path Estimation in handleEstimate ---");
        console.log("Best Path Estimation:", bestPathEstimation);
        console.log("Final Output:", bestPathEstimation.finalOutput.toString());
        console.log("Ideal Output:", bestPathEstimation.idealOutput.toString());
        console.log("LP Fee:", bestPathEstimation.totalLpFee.toString());
        console.log("Total Price Impact:", bestPathEstimation.totalPriceImpact);
        console.log("Total Gas Cost:", bestPathEstimation.totalGasCost);
        console.log("--- End Best Path Estimation in handleEstimate ---");

        setBestPathEstimation(bestPathEstimation);
      } else {
        setEstimatedOutput("Error in estimating the best route");
      }
    }
  };

  // then, we allow the user to execute the swap

  const handleSwapClick = async () => {
    showDebugAlert();

    if (!secretjs) {
      console.error("SecretNetworkClient is not initialized");
      return;
    }

    const path = bestPathEstimation?.path;
    if (!path) {
      console.error("No path found for swap execution");
      return;
    }

    const inputViewingKey = await window.keplr?.getSecret20ViewingKey(
      "secret-4",
      payToken!.address,
    );
    const outputViewingKey = await window.keplr?.getSecret20ViewingKey(
      "secret-4",
      receiveToken!.address,
    );

    if (inputViewingKey === undefined || outputViewingKey === undefined) {
      alert("Viewing keys are missing. Please create them before swapping.");
      return;
    }

    try {
      // Fetch the account information to get the sequence number and account number
      const accountInfo = await secretjs.query.auth.account({
        address: walletAddress!,
      });

      const baseAccount = accountInfo as {
        "@type": "/cosmos.auth.v1beta1.BaseAccount";
        sequence?: string;
        account_number?: string;
      };

      // Check if sequence number is available
      const sequence =
        baseAccount.sequence != null && baseAccount.sequence !== ""
          ? parseInt(baseAccount.sequence, 10)
          : null;
      const accountNumber =
        baseAccount.account_number != null && baseAccount.account_number !== ""
          ? parseInt(baseAccount.account_number, 10)
          : null;

      for (let i = 0; i < path.pools.length; i++) {
        const poolAddress = path.pools[i];
        const inputToken = path.tokens[i];
        const outputToken = path.tokens[i + 1];

        console.log(`Executing swap ${i + 1} on pool ${poolAddress}`);
        console.log(`Swapping ${inputToken} for ${outputToken}`);
        if (typeof inputToken !== "string") {
          throw new Error(`Input token is not a string (undefined)`);
        }
        const decimals = getTokenDecimals(inputToken);
        if (decimals === undefined) {
          throw new Error(
            `Decimals for token ${inputToken} could not be determined`,
          );
        }

        const swapMsg = {
          swap: {
            offer_asset: {
              info: {
                token: {
                  contract_addr: inputToken,
                  token_code_hash:
                    "0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490",
                  viewing_key: inputViewingKey,
                },
              },
              amount: bestPathEstimation.finalOutput
                .mul(Decimal.pow(10, decimals))
                .toFixed(0),
            },
            belief_price: "0",
            max_spread: "0.5",
            to: walletAddress,
          },
        };

        console.log("Swapping with message:", JSON.stringify(swapMsg, null, 2));

        const txOptions: TxOptions = {
          gasLimit: 200_000,
          gasPriceInFeeDenom: 0.25,
          feeDenom: "uscrt",
          // Only include explicitSignerData if both sequence and accountNumber are available
          ...(sequence !== null && accountNumber !== null
            ? {
              explicitSignerData: {
                accountNumber: accountNumber,
                sequence: sequence + i,
                chainId: "secret-4",
              },
            }
            : {}),
        };

        if (typeof poolAddress !== "string") {
          throw new Error("Pool address is undefined");
        }
        const result = await secretjs.tx.compute.executeContract(
          {
            sender: walletAddress!,
            contract_address: poolAddress,
            code_hash:
              "0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490",
            msg: swapMsg,
            sent_funds: [],
          },
          txOptions,
        );

        console.log("Transaction Result:", result);

        if (result.code !== TxResultCode.Success) {
          throw new Error(`Swap failed at step ${i + 1}: ${result.rawLog}`);
        }

        console.log(`Swap ${i + 1} executed successfully!`);
      }

      alert("Swap completed successfully!");
      setEstimatedOutput("Swap completed successfully!");
    } catch (error) {
      console.error("Error during swap execution:", error);
      alert("Swap failed. Check the console for more details.");
      setEstimatedOutput("Error during swap execution. Please try again.");
    }
  };

  const showDebugAlert = () => {
    const alertMessage = `Swapping Details:
    
Pay Token: ${payToken?.symbol ?? "payToken-undefined"}
Pay Amount: ${payDetails.amount}

Receive Token: ${receiveToken?.symbol ?? "receiveToken-undefined"}
Receive Amount: ${receiveDetails.amount}

Slippage: ${slippage}
Gas: ${gas}

Price Impact: ${priceImpact}% = ${(
        (parseFloat(priceImpact) / 100) *
        parseFloat(payDetails.amount)
      ).toFixed(4)} ${payToken?.symbol}
TX Fee: ${txFee} ${payToken?.symbol} = ${(
        (parseFloat(txFee) / parseFloat(payDetails.amount)) *
        100
      ).toFixed(2)}%
Min Receive: ${minReceive} ${receiveToken?.symbol}

RawData: ${JSON.stringify(
        {
          payToken,
          payDetails,
          receiveToken,
          receiveDetails,
          slippage,
          gas,
          priceImpact,
          txFee,
          minReceive,
        },
        null,
        2,
      )}`;

    alert(alertMessage);
  };

  return {
    swappableTokens,
    chartData,
    payDetails,
    payToken,
    receiveDetails,
    receiveToken,
    slippage,
    gas,
    priceImpact,
    txFee,
    minReceive,
    estimatedOutput,
    handleEstimate,
    handleSwapClick,
  };
};
