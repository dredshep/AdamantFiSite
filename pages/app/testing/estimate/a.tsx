import { Window as KeplrWindow } from "@keplr-wallet/types";
import { useState, useEffect } from "react";
import { SecretNetworkClient, TxOptions, TxResultCode } from "secretjs";
import Decimal from "decimal.js";
import { getTokenDecimals, getTokenName } from "@/utils/apis/tokenInfo";
import { fullPoolsData } from "../../../../components/app/Testing/fullPoolsData";
import SelectComponent2 from "@/components/app/Testing/SelectComponent2";
import SwapResult from "@/components/app/Testing/SwapResult";
import ViewingKeyModal from "@/components/app/Testing/ViewingKeyModal";
import { useViewingKeyStore } from "@/store/viewingKeyStore";
import { SecretString } from "@/types";
import AllowanceBox from "@/components/app/Testing/AllowanceBox";

interface PoolQueryResponse {
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

interface PoolData {
  reserves: {
    [token: string]: { amount: Decimal; decimals: number };
  };
  fee: number;
}

interface TokenPoolMap {
  [tokenAddress: string]: string[]; // Maps token address to a list of pool addresses
}

const buildTokenPoolMap = (pools: typeof fullPoolsData): TokenPoolMap => {
  const tokenPoolMap: TokenPoolMap = {};

  pools.forEach((pool) => {
    pool.query_result.assets
      .filter((asset) => asset.info.token !== undefined)
      .forEach((asset) => {
        const tokenAddr = asset.info.token!.contract_addr;
        if (!(tokenAddr in tokenPoolMap)) {
          tokenPoolMap[tokenAddr] = [];
        }
        tokenPoolMap[tokenAddr]?.push(pool.contract_address);
      });
  });

  return tokenPoolMap;
};
const getPossibleOutputsForToken = (
  startToken: string,
  pools: typeof fullPoolsData,
  maxHops: number = 5
): string[] => {
  const tokenPoolMap = buildTokenPoolMap(pools);
  const reachableTokens = findAllReachableTokens(
    tokenPoolMap,
    startToken,
    maxHops
  );
  return Array.from(reachableTokens);
};
const findAllReachableTokens = (
  tokenPoolMap: TokenPoolMap,
  startToken: string,
  maxHops: number = 5 // Allows flexibility in the depth of search
): Set<string> => {
  const reachableTokens: Set<string> = new Set();
  const visited: Set<string> = new Set();

  const dfs = (currentToken: string, hops: number) => {
    if (hops > maxHops || visited.has(currentToken)) return;

    visited.add(currentToken);

    const pools = tokenPoolMap[currentToken] ?? [];
    pools.forEach((poolAddress) => {
      const poolTokens = fullPoolsData
        .find((pool) => pool.contract_address === poolAddress)
        ?.query_result.assets.filter((asset) => asset.info.token !== undefined)
        .map((asset) => asset.info.token!.contract_addr);

      poolTokens?.forEach((nextToken) => {
        if (nextToken !== currentToken && !reachableTokens.has(nextToken)) {
          reachableTokens.add(nextToken);
          dfs(nextToken, hops + 1);
        }
      });
    });

    visited.delete(currentToken);
  };

  dfs(startToken, 0);

  return reachableTokens;
};
export interface Path {
  pools: string[]; // Array of pool addresses
  tokens: string[]; // Array of token addresses in the path
}

const findPaths = (
  tokenPoolMap: TokenPoolMap,
  startToken: string,
  endToken: string,
  maxHops: number = 3
): Path[] => {
  const paths: Path[] = [];
  const visited: Set<string> = new Set();

  const dfs = (currentToken: string, path: Path, hops: number) => {
    if (hops > maxHops || visited.has(currentToken)) return;
    if (currentToken === endToken) {
      paths.push({ pools: [...path.pools], tokens: [...path.tokens] });
      return;
    }

    visited.add(currentToken);

    const pools = tokenPoolMap[currentToken] ?? [];
    pools.forEach((poolAddress) => {
      const poolTokens = fullPoolsData
        .find((pool) => pool.contract_address === poolAddress)
        ?.query_result.assets.filter((asset) => asset.info.token !== undefined)
        .map((asset) => asset.info.token!.contract_addr);

      poolTokens?.forEach((nextToken) => {
        if (nextToken !== currentToken) {
          path.pools.push(poolAddress);
          path.tokens.push(nextToken);
          dfs(nextToken, path, hops + 1);
          path.pools.pop();
          path.tokens.pop();
        }
      });
    });

    visited.delete(currentToken);
  };

  dfs(startToken, { pools: [], tokens: [startToken] }, 0);

  return paths;
};
export interface PathEstimation {
  path: Path;
  finalOutput: Decimal;
  totalPriceImpact: string;
  totalLpFee: Decimal;
  totalGasCost: string;
  idealOutput: Decimal;
}

const estimateBestPath = async (
  secretjs: SecretNetworkClient,
  paths: Path[],
  initialAmountIn: Decimal
): Promise<PathEstimation | null> => {
  let bestEstimation: PathEstimation | null = null;

  for (const path of paths) {
    let amountIn = initialAmountIn;
    let totalLpFee = new Decimal(0);
    let totalPriceImpact = new Decimal(0);
    let cumulativeIdealOutput = new Decimal(0); // Track cumulative ideal output
    const hopGasCost =
      path.pools.length > 1 ? new Decimal(0.2) : new Decimal(0.12); // 0.12 for single-hop, 0.20 for multi-hop

    try {
      for (let i = 0; i < path.pools.length; i++) {
        const poolAddress = path.pools[i];
        const inputToken = path.tokens[i];
        const outputToken = path.tokens[i + 1];

        console.log(`\n--- Hop ${i + 1} ---`);
        console.log(`Input Token: ${inputToken}`);
        console.log(`Output Token: ${outputToken}`);

        if (
          typeof inputToken !== "string" ||
          typeof outputToken !== "string" ||
          typeof poolAddress !== "string"
        ) {
          throw new Error("Invalid token addresses");
        }

        const { output, idealOutput, priceImpact, lpFee } =
          await estimateSingleHopOutput(
            secretjs,
            poolAddress,
            amountIn,
            inputToken,
            outputToken
          );

        console.log(`Output from hop ${i + 1}: ${output.toString()}`);
        console.log(
          `Ideal Output from hop ${i + 1}: ${idealOutput.toString()}`
        );

        if (output.isNegative()) {
          console.error(`Negative output detected after hop ${i + 1}`);
          return null; // Abort if a negative output is detected
        }

        amountIn = output; // The output of one hop becomes the input for the next
        totalLpFee = totalLpFee.add(lpFee);
        totalPriceImpact = totalPriceImpact.add(new Decimal(priceImpact));
        cumulativeIdealOutput = idealOutput; // Update cumulative ideal output to reflect the most recent hop
      }

      const totalGasCost =
        hopGasCost.mul(path.pools.length).toFixed(2) + " SCRT";

      // Directly use the last output amount without subtracting the lpFee again
      const adjustedFinalOutput = amountIn;

      console.log(
        `Final Output after all hops: ${adjustedFinalOutput.toString()}`
      );

      if (
        !bestEstimation ||
        adjustedFinalOutput.greaterThan(bestEstimation.finalOutput)
      ) {
        bestEstimation = {
          path,
          finalOutput: adjustedFinalOutput,
          totalPriceImpact: totalPriceImpact.toFixed(2),
          totalLpFee, // LP Fee is informative, not deducted from output
          totalGasCost,
          idealOutput: cumulativeIdealOutput, // Store the latest ideal output
        };
      }
    } catch (error) {
      console.error("Error estimating path output:", error);
    }
  }

  return bestEstimation;
};

const isValidReserve = (
  reserve: unknown
): reserve is { amount: Decimal; decimals: number } => {
  return (
    reserve !== null &&
    typeof reserve === "object" &&
    "amount" in reserve &&
    reserve.amount instanceof Decimal &&
    "decimals" in reserve &&
    typeof reserve.decimals === "number"
  );
};

const calculateSingleHopOutput = (
  amountIn: Decimal,
  poolData: PoolData,
  inputToken: string,
  outputToken: string
): {
  output: Decimal;
  idealOutput: Decimal;
  priceImpact: string;
  lpFee: Decimal;
} => {
  const rawInputReserve = poolData.reserves[inputToken];
  const rawOutputReserve = poolData.reserves[outputToken];

  if (!isValidReserve(rawInputReserve) || !isValidReserve(rawOutputReserve)) {
    throw new Error("Invalid token addresses or malformed reserve data");
  }

  console.log(`\n--- Calculation Start ---`);
  console.log(`Input Token: ${inputToken}`);
  console.log(`Output Token: ${outputToken}`);
  console.log(
    `Raw Input Reserve: ${rawInputReserve.amount.toString()} (Decimals: ${
      rawInputReserve.decimals
    })`
  );
  console.log(
    `Raw Output Reserve: ${rawOutputReserve.amount.toString()} (Decimals: ${
      rawOutputReserve.decimals
    })`
  );
  console.log(`Amount In: ${amountIn.toString()}`);

  const inputReserve = rawInputReserve.amount;
  const outputReserve = rawOutputReserve.amount;

  // Adjust input amount by input token decimals
  const amountInAdjusted = amountIn.mul(
    Decimal.pow(10, rawInputReserve.decimals)
  );
  console.log(`Amount In Adjusted: ${amountInAdjusted.toString()}`);

  // Calculate fee and adjust input amount
  const feeMultiplier = new Decimal(1).sub(poolData.fee);
  const amountInWithFee = amountInAdjusted.mul(feeMultiplier);
  console.log(`Amount In With Fee: ${amountInWithFee.toString()}`);

  // Compute output using constant product formula
  const productOfReserves = inputReserve.mul(outputReserve);
  const newInputReserve = inputReserve.add(amountInWithFee);
  const newOutputReserve = productOfReserves.div(newInputReserve);
  let output = outputReserve.sub(newOutputReserve);
  console.log(`New Input Reserve: ${newInputReserve.toString()}`);
  console.log(`New Output Reserve: ${newOutputReserve.toString()}`);
  console.log(`Output Before Decimal Adjustment: ${output.toString()}`);

  // Adjust output by output token decimals
  output = output.div(Decimal.pow(10, rawOutputReserve.decimals));
  console.log(`Output After Decimal Adjustment: ${output.toString()}`);

  // Calculate ideal output assuming infinite liquidity (no price impact)
  const idealOutput = amountInAdjusted.mul(outputReserve).div(inputReserve);
  console.log(
    `Ideal Output Before Decimal Adjustment: ${idealOutput.toString()}`
  );

  // Adjust ideal output by output token decimals
  let idealOutputAdjusted = idealOutput.div(
    Decimal.pow(10, rawOutputReserve.decimals)
  );
  console.log(
    `Ideal Output After Decimal Adjustment: ${idealOutputAdjusted.toString()}`
  );

  // Ensure ideal output isn't negative
  if (idealOutputAdjusted.isNegative()) {
    console.warn(
      "Calculated ideal output is negative after decimal adjustment."
    );
    idealOutputAdjusted = new Decimal(0);
  }

  // Calculate price impact
  const priceImpact = idealOutputAdjusted
    .sub(output)
    .div(idealOutputAdjusted)
    .mul(100)
    .toFixed(2);
  console.log(`Price Impact: ${priceImpact}%`);

  // Correct calculation of Liquidity Provider Fee
  const lpFee = amountIn.sub(
    amountInWithFee.div(Decimal.pow(10, rawInputReserve.decimals))
  );
  console.log(`Liquidity Provider Fee: ${lpFee.toString()}`);
  console.log(`--- Calculation End ---\n`);

  // Return the results
  return {
    output,
    idealOutput: idealOutputAdjusted,
    priceImpact, // Now priceImpact is properly initialized and returned
    lpFee,
  };
};

const estimateSingleHopOutput = async (
  secretjs: SecretNetworkClient,
  poolAddress: string,
  amountIn: Decimal,
  inputToken: string,
  outputToken: string
): Promise<{
  output: Decimal;
  idealOutput: Decimal;
  priceImpact: string;
  lpFee: Decimal;
  gasCost: string;
}> => {
  const poolData = await getPoolData(secretjs, poolAddress);
  const { output, idealOutput, priceImpact, lpFee } = calculateSingleHopOutput(
    amountIn,
    poolData,
    inputToken,
    outputToken
  );

  // Gas cost for a single hop
  const gasCost = "0.12 SCRT";

  return {
    output,
    idealOutput,
    priceImpact,
    lpFee,
    gasCost,
  };
};

const getPoolData = async (
  secretjs: SecretNetworkClient,
  poolAddress: string
): Promise<PoolData> => {
  const response: PoolQueryResponse =
    await secretjs.query.compute.queryContract({
      contract_address: poolAddress,
      code_hash:
        "0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490",
      query: { pool: {} },
    });

  if (typeof response !== "object" || response === null) {
    throw new Error("Invalid response from pool contract");
  }

  const reserves = response.assets.reduce(
    (acc: { [key: string]: { amount: Decimal; decimals: number } }, asset) => {
      const decimals =
        asset.info.token?.contract_addr ===
        "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek"
          ? 6
          : getTokenDecimals(asset.info.token.contract_addr) ?? 0;
      console.log({ decimals });
      acc[asset.info.token.contract_addr] = {
        amount: new Decimal(asset.amount),
        decimals,
      };
      return acc;
    },
    {}
  );

  return {
    reserves,
    fee: 0.003, // Assuming a fee of 0.3%
  };
};

const SwapPage = () => {
  const [amountIn, setAmountIn] = useState<string>("");
  const [estimatedOutput, setEstimatedOutput] = useState<string>("");
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [inputToken, setInputToken] = useState<SecretString | "">("");
  const [outputToken, setOutputToken] = useState<SecretString | "">("");
  const [outputOptions, setOutputOptions] = useState<SecretString[]>([]);
  const [bestPathEstimation, setBestPathEstimation] =
    useState<PathEstimation | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const inputViewingKey = useViewingKeyStore((state) =>
    state.getViewingKey(inputToken)
  );
  const outputViewingKey = useViewingKeyStore((state) =>
    state.getViewingKey(outputToken)
  );

  useEffect(() => {
    setEstimatedOutput("");
    setBestPathEstimation(null);
    if (inputToken) {
      const possibleOutputs = getPossibleOutputsForToken(
        inputToken,
        fullPoolsData
      ) as SecretString[];
      setOutputOptions(possibleOutputs);
    }
  }, [inputToken, outputToken]);

  useEffect(() => {
    const connectKeplr = async () => {
      if (!window.keplr) {
        alert("Please install Keplr extension");
        return;
      }

      await window.keplr.enable("secret-4");

      const offlineSigner = (
        window as unknown as KeplrWindow
      ).getOfflineSigner?.("secret-4");
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
        url: "https://lcd.mainnet.secretsaturn.net",
        wallet: offlineSigner,
        walletAddress: accounts[0].address,
      });
      setWalletAddress(accounts[0].address);

      setSecretjs(client);
    };

    void connectKeplr();
  }, []);

  const handleSyncViewingKeys = () => {
    setIsModalOpen(true);
  };

  // first, we estimate the full swap details

  const handleEstimate = async () => {
    if (secretjs && amountIn && inputToken && outputToken) {
      const amountInDecimal = new Decimal(amountIn);
      const tokenPoolMap = buildTokenPoolMap(fullPoolsData);
      const paths = findPaths(tokenPoolMap, inputToken, outputToken);

      if (paths.length === 0) {
        console.log("No available paths found for the selected tokens.");
        return;
      }

      const bestPathEstimation = await estimateBestPath(
        secretjs,
        paths,
        amountInDecimal
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

  // function getViewingKey(tokenAddress: string): string | undefined {
  //   return useViewingKeyStore.getState().getViewingKey(tokenAddress);
  // }

  const handleSwap = async () => {
    if (!secretjs) {
      console.error("SecretNetworkClient is not initialized");
      return;
    }

    const path = bestPathEstimation?.path;
    if (!path) {
      console.error("No path found for swap execution");
      return;
    }

    if (inputViewingKey === undefined || outputViewingKey === undefined) {
      alert("Viewing keys are missing. Please sync them before swapping.");
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
            `Decimals for token ${inputToken} could not be determined`
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
          txOptions
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

  return (
    <div className="bg-gradient-to-r from-adamant-box-dark to-adamant-box-veryDark min-h-screen flex items-center justify-center">
      <div className="bg-adamant-app-boxHighlight rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          Secret Swap Estimator
        </h1>
        <div className="flex flex-col space-y-4">
          <SelectComponent2
            setFrom={setInputToken}
            setTo={setOutputToken}
            outputOptions={outputOptions}
          />
          {inputToken !== "" &&
            typeof walletAddress === "string" &&
            inputViewingKey !== undefined &&
            outputViewingKey !== undefined &&
            (() => {
              // Find the pool that contains the inputToken
              const pool = fullPoolsData.find((pool) =>
                pool.query_result.assets.some(
                  (asset) => asset.info.token?.contract_addr === inputToken
                )
              );

              // If pool is found, extract the spenderAddress and tokenCodeHash
              if (pool) {
                const tokenAsset = pool.query_result.assets.find(
                  (asset) => asset.info.token?.contract_addr === inputToken
                );

                const tokenCodeHash =
                  tokenAsset?.info.token?.token_code_hash ?? "";
                const spenderAddress = pool.contract_address;

                return (
                  <AllowanceBox
                    secretjs={secretjs!}
                    tokenAddress={inputToken}
                    spenderAddress={spenderAddress as SecretString}
                    walletAddress={walletAddress as SecretString}
                    tokenCodeHash={tokenCodeHash}
                    requiredAmount={amountIn}
                    viewingKey={inputViewingKey || ""}
                  />
                );
              } else {
                return <p>Pool not found for the selected token.</p>;
              }
            })()}

          {inputToken && outputToken && (
            <>
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder={`Amount of ${getTokenName(inputToken) ?? "Token"}`}
                className="px-4 py-2 border border-gray-700 bg-adamant-app-input rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-adamant-accentBg text-white"
              />
              <button
                onClick={() => void handleEstimate()}
                className="bg-adamant-accentBg hover:brightness-90 text-black font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-adamant-accentBg"
              >
                Estimate Swap
              </button>

              {bestPathEstimation && ( // prettier-ignore
                <SwapResult
                  bestRoute={bestPathEstimation.path.tokens
                    .map((address) => getTokenName(address))
                    .join(" -> ")}
                  idealOutput={`${bestPathEstimation.idealOutput.toFixed(
                    8
                  )} ${getTokenName(outputToken)}`}
                  actualOutput={`${bestPathEstimation.finalOutput.toFixed(
                    8
                  )} ${getTokenName(outputToken)}`}
                  priceImpact={bestPathEstimation.totalPriceImpact + "%"}
                  lpFee={`${bestPathEstimation.totalLpFee.toFixed(
                    6
                  )} ${getTokenName(inputToken)}`}
                  gasCost={bestPathEstimation.totalGasCost}
                  difference={`${bestPathEstimation.idealOutput
                    .sub(bestPathEstimation.finalOutput)
                    .toFixed(8)} ${getTokenName(outputToken)}`}
                  isMultiHop={bestPathEstimation.path.pools.length > 1}
                />
              )}
            </>
          )}
          <p className="text-2xl text-center text-white">{estimatedOutput}</p>
          {bestPathEstimation && (
            <>
              <button
                onClick={handleSyncViewingKeys}
                className="bg-adamant-accentBg hover:brightness-90 text-black font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-adamant-accentBg"
              >
                Sync Viewing Keys
              </button>
              {inputViewingKey !== undefined &&
              outputViewingKey !== undefined ? (
                <button
                  onClick={() => void handleSwap()}
                  className="bg-adamant-accentBg hover:brightness-90 text-black font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-adamant-accentBg"
                >
                  Execute Swap
                </button>
              ) : (
                <p className="text-xl text-center text-red-400">
                  Viewing keys are required to execute the swap. Sync them
                  first.
                </p>
              )}
            </>
          )}
        </div>
      </div>
      {isModalOpen && inputToken !== "" && outputToken !== "" && (
        <ViewingKeyModal
          tokenIn={inputToken}
          tokenOut={outputToken}
          onClose={() => setIsModalOpen(false)}
          // secretjs={secretjs!}
          // walletAddress={walletAddress!}
        />
      )}
    </div>
  );
};

export default SwapPage;
