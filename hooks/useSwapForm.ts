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
import { SecretNetworkClient, TxOptions, TxResponse } from "secretjs";
import { Snip20SendOptions } from "secretjs/dist/extensions/snip20/types";
import { Hop } from "@/types";
import Decimal from "decimal.js";
import {
  PathEstimation,
  buildTokenPoolMap,
  findPaths,
  estimateBestPath,
} from "@/utils/swap/estimate";
import { getTokenDecimals } from "@/utils/apis/tokenInfo";
import { useTxStore } from "@/store/txStore";
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
  const { setPending, setResult } = useTxStore.getState();

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
      setPending(true);

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
      const sequence = baseAccount.sequence
        ? parseInt(baseAccount.sequence, 10)
        : null;
      const accountNumber = baseAccount.account_number
        ? parseInt(baseAccount.account_number, 10)
        : null;

      let txOptions: TxOptions = {
        gasLimit: 500_000,
        gasPriceInFeeDenom: 0.25,
        feeDenom: "uscrt",
        // Only include explicitSignerData if both sequence and accountNumber are available
        // TODO: explicitSignerData is probably not needed. I think secretjs handles this.
        ...(sequence !== null && accountNumber !== null
          ? {
            explicitSignerData: {
              accountNumber: accountNumber,
              sequence: sequence,
              chainId: "secret-4",
            },
          }
          : {}),
      };

      const decimalsIn = getTokenDecimals(payToken!.address);
      if (decimalsIn === undefined) {
        throw new Error(
          `Decimals for token ${payToken!.address} could not be determined`,
        );
      }
      const decimalsOut = getTokenDecimals(receiveToken!.address);
      if (decimalsOut === undefined) {
        throw new Error(
          `Decimals for token ${receiveToken!.address} could not be determined`,
        );
      }

      const send_amount = new Decimal(payDetails.amount)
        .times(Decimal.pow(10, decimalsIn))
        .toFixed(0);

      const expected_return = bestPathEstimation.finalOutput
        .times(Decimal.pow(10, decimalsOut))
        .toFixed(0);

      console.log("Expected Return:", expected_return);

      let sendMsg: Snip20SendOptions;
      let result: TxResponse;
      const hops: Hop[] = [];

      if (path.pools.length >= 2) {
        console.log("Multiple hops. Using Router contract.");

        for (let i = 0; i < path.pools.length; i++) {
          const poolAddress = path.pools[i];
          const inputTokenAddress = path.tokens[i];
          const outputTokenAddress = path.tokens[i + 1];

          // FIXME: How to get code_hash here?? Hardcode known pair details for now.
          const poolCodeHash = "";
          const inputTokenCodeHash = "";

          const hop: Hop = {
            from_token: {
              snip20: {
                address: inputTokenAddress!,
                code_hash: inputTokenCodeHash,
              },
            },
            pair_address: poolAddress!,
            pair_code_hash: poolCodeHash,
          };

          console.debug(`Hop ${i + 1}`, hop);

          hops.push(hop);

          console.log(`Hop ${i + 1} on pool ${poolAddress}`);
          console.log(
            `Swapping ${inputTokenAddress} for ${outputTokenAddress}`,
          );
        }

        sendMsg = {
          send: {
            // NOTE: Router Contract
            recipient: "secret1xy5r5j4zp0v5fzza5r9yhmv7nux06rfp2yfuuv",
            amount: send_amount,
            msg: btoa(
              JSON.stringify({
                to: walletAddress,
                hops,
                expected_return,
              }),
            ),
          },
        };

        console.log("Swapping with message:", JSON.stringify(sendMsg, null, 2));

        // FIXME: hardcoded contract_address and code_hash to sSCRT
        result = await secretjs.tx.snip20.send(
          {
            sender: walletAddress!,
            contract_address: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
            code_hash:
              "af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e",
            msg: sendMsg,
            sent_funds: [],
          },
          txOptions,
        );
      } else {
        console.log("Single hop. Using Pair contract directly.");

        const poolAddress = path.pools[0];
        const inputToken = path.tokens[0];
        const outputToken = path.tokens[1];

        console.log(`Executing swap on pool ${poolAddress}`);
        console.log(`Swapping ${inputToken} for ${outputToken}`);

        const swapMsg = {
          swap: {
            belief_price: expected_return,
            max_spread: bestPathEstimation.totalPriceImpact,
            to: walletAddress,
          },
        };

        sendMsg = {
          send: {
            recipient: poolAddress!,
            amount: send_amount,
            msg: btoa(JSON.stringify(swapMsg)),
          },
        };

        console.log("Swapping with message:", JSON.stringify(sendMsg, null, 2));
        console.log("Callback message:", JSON.stringify(swapMsg, null, 2));

        // gasLimit could be changed depending on single swap or multi hop
        txOptions.gasLimit = 500_000;

        // FIXME: hardcoded contract_address and code_hash to sSCRT
        result = await secretjs.tx.snip20.send(
          {
            sender: walletAddress!,
            contract_address: "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek",
            code_hash:
              "af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e",
            msg: sendMsg,
            sent_funds: [],
          },
          txOptions,
        );
      }

      setResult(result);

      console.log("Transaction Result:", result);

      if (result.code !== 0) {
        throw new Error(`Swap failed: ${result.rawLog}`);
      }

      console.log(`Swap executed successfully!`);

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
