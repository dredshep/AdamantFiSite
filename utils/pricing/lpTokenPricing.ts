import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { SecretNetworkClient } from 'secretjs';

// Cache for LP token prices with timestamps
interface PriceCache {
  price: number;
  timestamp: number;
}

const priceCache = new Map<string, PriceCache>();
const CACHE_DURATION_MS = 30000; // 30 seconds cache duration
const pendingRequests = new Map<string, Promise<number>>(); // Track ongoing requests

/**
 * Interface for pair contract pool information query response
 */
// interface PoolInfo {
//   pool: {
//     assets: Array<{
//       info: {
//         token?: {
//           contract_addr: string;
//           token_code_hash: string;
//         };
//         native_token?: {
//           denom: string;
//         };
//       };
//       amount: string;
//     }>;
//     total_share: string;
//   };
// }

/**
 * Interface for the actual contract response (without nested pool property)
 */
interface PoolDataResponse {
  assets: Array<{
    info: {
      token?: {
        contract_addr: string;
        token_code_hash: string;
      };
      native_token?: {
        denom: string;
      };
    };
    amount: string;
  }>;
  total_share: string;
}

/**
 * Get the USD price of an LP token by calculating its underlying asset value
 */
export async function getLpTokenPriceUsd(
  secretjs: SecretNetworkClient,
  lpTokenAddress: string
): Promise<number> {
  // Check cache first
  const cached = priceCache.get(lpTokenAddress);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
    return cached.price;
  }

  // Check if there's already a pending request for this token
  const existingRequest = pendingRequests.get(lpTokenAddress);
  if (existingRequest) {
    return existingRequest;
  }

  // Create new request
  const requestPromise = fetchLpTokenPrice(secretjs, lpTokenAddress);
  pendingRequests.set(lpTokenAddress, requestPromise);

  try {
    const price = await requestPromise;

    // Cache the result
    priceCache.set(lpTokenAddress, {
      price,
      timestamp: now,
    });

    return price;
  } finally {
    // Clean up pending request
    pendingRequests.delete(lpTokenAddress);
  }
}

/**
 * Internal function to fetch LP token price (separated for caching)
 */
async function fetchLpTokenPrice(
  secretjs: SecretNetworkClient,
  lpTokenAddress: string
): Promise<number> {
  try {
    // Find the liquidity pair info
    const pairInfo = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === lpTokenAddress);
    if (!pairInfo) {
      console.warn(`LP token ${lpTokenAddress} not found in LIQUIDITY_PAIRS`);
      return 1.0; // Default fallback
    }

    // Query the pair contract for pool information
    const poolQuery = { pool: {} };

    const poolResult = await secretjs.query.compute.queryContract({
      contract_address: pairInfo.pairContract,
      code_hash: pairInfo.pairContractCodeHash,
      query: poolQuery,
    });

    const poolData = poolResult as PoolDataResponse;

    if (!poolData.assets || poolData.assets.length !== 2) {
      console.warn(`Invalid pool data for LP token ${lpTokenAddress}`);
      return 1.0;
    }

    const { assets, total_share } = poolData;
    const totalSupply = parseFloat(total_share);

    if (totalSupply === 0) {
      return 1.0; // No liquidity in pool
    }

    // For sSCRT/USDC.nbl pair, we can calculate based on USDC value
    // Since USDC is approximately $1, we can use the USDC reserve * 2 as total pool value
    if (pairInfo.symbol === 'sSCRT/USDC.nbl') {
      // Find the USDC asset (token1 should be USDC.nbl)
      const usdcAsset = assets.find(
        (asset) =>
          asset.info.token &&
          (pairInfo.token1 === 'USDC.nbl' || asset.info.token.contract_addr.includes('usdc'))
      );

      if (usdcAsset) {
        // USDC has 6 decimals, convert to human readable
        const usdcReserve = parseFloat(usdcAsset.amount) / 1_000_000;

        // Total pool value = USDC reserve * 2 (assuming roughly equal value in both sides)
        const totalPoolValueUsd = usdcReserve * 2;

        // LP token supply is in raw format with 6 decimals
        const lpSupply = totalSupply / 1_000_000;

        // Price per LP token
        const pricePerLpToken = totalPoolValueUsd / lpSupply;

        // Only log once per cache period to reduce noise
        // console.log(
        //   `💰 LP Token ${pairInfo.symbol} price: $${pricePerLpToken.toFixed(
        //     6
        //   )} (${usdcReserve.toFixed(2)} USDC × 2 ÷ ${lpSupply.toFixed(2)} LP)`
        // );

        return pricePerLpToken;
      }
    }

    // For other pairs, we'll need to implement more sophisticated pricing
    // For now, return a reasonable default based on typical LP values
    console.warn(`Pricing not implemented for pair ${pairInfo.symbol}, using default`);
    return 2.0; // Reasonable default for LP tokens
  } catch (error) {
    console.error(`Error calculating LP token price for ${lpTokenAddress}:`, error);
    return 1.0; // Safe fallback
  }
}

/**
 * Get the USD value of a staked amount
 */
export async function getStakedValueUsd(
  secretjs: SecretNetworkClient,
  lpTokenAddress: string,
  stakedAmount: string
): Promise<number> {
  try {
    const lpPrice = await getLpTokenPriceUsd(secretjs, lpTokenAddress);
    const stakedAmountNum = parseFloat(stakedAmount) / 1_000_000; // Convert from raw amount (6 decimals)
    return stakedAmountNum * lpPrice;
  } catch (error) {
    console.error('Error calculating staked value USD:', error);
    return 0;
  }
}

/**
 * Get the total value locked (TVL) in USD for a staking pool
 */
export async function getTvlUsd(
  secretjs: SecretNetworkClient,
  lpTokenAddress: string,
  totalLocked: string
): Promise<number> {
  try {
    const lpPrice = await getLpTokenPriceUsd(secretjs, lpTokenAddress);
    const totalLockedNum = parseFloat(totalLocked) / 1_000_000; // Convert from raw amount (6 decimals)
    return totalLockedNum * lpPrice;
  } catch (error) {
    console.error('Error calculating TVL USD:', error);
    return 0;
  }
}
