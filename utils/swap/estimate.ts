import { getTokenDecimals } from '@/utils/apis/tokenInfo';
import Decimal from 'decimal.js';
import { SecretNetworkClient } from 'secretjs';
// NOTE: This is every single pool, but hardcoded. The asset amounts and total shares are stale, but that's OK for buildTokenPoolMap.
import { fullPoolsData } from '@/components/app/Testing/fullPoolsData';
import { PoolQueryResponse } from '@/types/estimation/PoolQueryResponse';

interface TokenPoolMap {
  [tokenAddress: string]: string[]; // Maps token address to a list of pool addresses
}

interface PoolData {
  reserves: {
    [token: string]: { amount: Decimal; decimals: number };
  };
  fee: number;
}

// interface PoolQueryResponse {
//   assets: {
//     info: {
//       token: {
//         contract_addr: SecretString;
//         token_code_hash: string;
//         viewing_key: string;
//       };
//     };
//     amount: string;
//   }[];
//   total_share: string;
// }

export interface PathEstimation {
  path: Path;
  finalOutput: Decimal;
  totalPriceImpact: string;
  totalLpFee: Decimal;
  totalGasCost: string;
  idealOutput: Decimal;
}

export interface Path {
  pools: string[]; // Array of pool addresses
  tokens: string[]; // Array of token addresses in the path
}

export function getPossibleOutputsForToken(
  startToken: string,
  pools: typeof fullPoolsData,
  maxHops: number = 5
): string[] {
  const tokenPoolMap = buildTokenPoolMap(pools);
  const reachableTokens = findAllReachableTokens(tokenPoolMap, startToken, maxHops);
  return Array.from(reachableTokens);
}

export function buildTokenPoolMap(pools: typeof fullPoolsData): TokenPoolMap {
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
}

function findAllReachableTokens(
  tokenPoolMap: TokenPoolMap,
  startToken: string,
  maxHops: number = 5
): Set<string> {
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
}

export function findPaths(
  tokenPoolMap: TokenPoolMap,
  startToken: string,
  endToken: string,
  maxHops: number = 3
): Path[] {
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
}

export async function estimateBestPath(
  secretjs: SecretNetworkClient,
  paths: Path[],
  initialAmountIn: Decimal
): Promise<PathEstimation | null> {
  let bestEstimation: PathEstimation | null = null;

  for (const path of paths) {
    let amountIn = initialAmountIn;
    let totalLpFee = new Decimal(0);
    let totalPriceImpact = new Decimal(0);
    let cumulativeIdealOutput = new Decimal(0); // Track cumulative ideal output
    const hopGasCost = path.pools.length > 1 ? new Decimal(0.2) : new Decimal(0.12); // 0.12 for single-hop, 0.20 for multi-hop

    try {
      for (let i = 0; i < path.pools.length; i++) {
        const poolAddress = path.pools[i];
        const inputToken = path.tokens[i];
        const outputToken = path.tokens[i + 1];

        console.log(`\n--- Hop ${i + 1} ---`);
        console.log(`Input Token: ${inputToken}`);
        console.log(`Output Token: ${outputToken}`);

        if (
          typeof inputToken !== 'string' ||
          typeof outputToken !== 'string' ||
          typeof poolAddress !== 'string'
        ) {
          throw new Error('Invalid token addresses');
        }

        const { output, idealOutput, priceImpact, lpFee } = await estimateSingleHopOutput(
          secretjs,
          poolAddress,
          amountIn,
          inputToken,
          outputToken
        );

        console.log(`Output from hop ${i + 1}: ${output.toString()}`);
        console.log(`Ideal Output from hop ${i + 1}: ${idealOutput.toString()}`);

        if (output.isNegative()) {
          console.error(`Negative output detected after hop ${i + 1}`);
          return null; // Abort if a negative output is detected
        }

        amountIn = output; // The output of one hop becomes the input for the next
        totalLpFee = totalLpFee.add(lpFee);
        totalPriceImpact = totalPriceImpact.add(new Decimal(priceImpact));
        cumulativeIdealOutput = idealOutput; // Update cumulative ideal output to reflect the most recent hop
      }

      const totalGasCost = hopGasCost.mul(path.pools.length).toFixed(2) + ' SCRT';

      // Directly use the last output amount without subtracting the lpFee again
      const adjustedFinalOutput = amountIn;

      console.log(`Final Output after all hops: ${adjustedFinalOutput.toString()}`);

      if (!bestEstimation || adjustedFinalOutput.greaterThan(bestEstimation.finalOutput)) {
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
      console.error('Error estimating path output:', error);
    }
  }

  return bestEstimation;
}

function isValidReserve(reserve: unknown): reserve is { amount: Decimal; decimals: number } {
  return (
    reserve !== null &&
    typeof reserve === 'object' &&
    'amount' in reserve &&
    reserve.amount instanceof Decimal &&
    'decimals' in reserve &&
    typeof reserve.decimals === 'number'
  );
}

function calculateSingleHopOutput(
  amountIn: Decimal,
  poolData: PoolData,
  inputToken: string,
  outputToken: string
): {
  output: Decimal;
  idealOutput: Decimal;
  priceImpact: string;
  lpFee: Decimal;
} {
  const rawInputReserve = poolData.reserves[inputToken];
  const rawOutputReserve = poolData.reserves[outputToken];

  if (!isValidReserve(rawInputReserve) || !isValidReserve(rawOutputReserve)) {
    throw new Error('Invalid token addresses or malformed reserve data');
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
  const amountInAdjusted = amountIn.mul(Decimal.pow(10, rawInputReserve.decimals));
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
  console.log(`Ideal Output Before Decimal Adjustment: ${idealOutput.toString()}`);

  // Adjust ideal output by output token decimals
  let idealOutputAdjusted = idealOutput.div(Decimal.pow(10, rawOutputReserve.decimals));
  console.log(`Ideal Output After Decimal Adjustment: ${idealOutputAdjusted.toString()}`);

  // Ensure ideal output isn't negative
  if (idealOutputAdjusted.isNegative()) {
    console.warn('Calculated ideal output is negative after decimal adjustment.');
    idealOutputAdjusted = new Decimal(0);
  }

  // Calculate price impact
  const priceImpact = idealOutputAdjusted.sub(output).div(idealOutputAdjusted).mul(100).toFixed(2);
  console.log(`Price Impact: ${priceImpact}%`);

  // Correct calculation of Liquidity Provider Fee
  const lpFee = amountIn.sub(amountInWithFee.div(Decimal.pow(10, rawInputReserve.decimals)));
  console.log(`Liquidity Provider Fee: ${lpFee.toString()}`);
  console.log(`--- Calculation End ---\n`);

  // Return the results
  return {
    output,
    idealOutput: idealOutputAdjusted,
    priceImpact, // Now priceImpact is properly initialized and returned
    lpFee,
  };
}

async function estimateSingleHopOutput(
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
}> {
  const poolData = await getPoolData(secretjs, poolAddress);
  const { output, idealOutput, priceImpact, lpFee } = calculateSingleHopOutput(
    amountIn,
    poolData,
    inputToken,
    outputToken
  );

  // TODO: is this still true?
  // Gas cost for a single hop
  const gasCost = '0.12 SCRT';

  return {
    output,
    idealOutput,
    priceImpact,
    lpFee,
    gasCost,
  };
}

async function getPoolData(secretjs: SecretNetworkClient, poolAddress: string): Promise<PoolData> {
  // TODO: try to lookup code_hash from address
  const response: PoolQueryResponse = await secretjs.query.compute.queryContract({
    contract_address: poolAddress,
    query: { pool: {} },
  });

  if (typeof response !== 'object' || response === null) {
    throw new Error('Invalid response from pool contract');
  }

  // response type seems very weird
  const reserves = response.assets.reduce(
    (acc: { [key: string]: { amount: Decimal; decimals: number } }, asset) => {
      const decimals =
        asset.info.token?.contract_addr === 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek'
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
}
