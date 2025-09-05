// kent: I don't think it's worth using this type
// seb: It helps me when i input the wrong string xD
import { getActiveStakingPools } from '@/config/staking';
import { STAKING_CONTRACTS as CONFIG_STAKING_CONTRACTS, LIQUIDITY_PAIRS } from '@/config/tokens';
import { SecretString } from '@/types';

export interface StakingContractInfo {
  lpTokenAddress: SecretString;
  lpTokenCodeHash: string;
  stakingAddress: SecretString;
  stakingCodeHash: string;
  rewardTokenSymbol: string;
}

/**
 * Builds the staking contracts record from environment variables
 * Environment variables should be structured as:
 * NEXT_PUBLIC_LP_TOKEN_ADDRESSES=address1,address2,address3
 * NEXT_PUBLIC_LP_STAKING_address1_TOKEN_ADDRESS=value
 * NEXT_PUBLIC_LP_STAKING_address1_TOKEN_CODE_HASH=value
 * NEXT_PUBLIC_LP_STAKING_address1_STAKING_ADDRESS=value
 * NEXT_PUBLIC_LP_STAKING_address1_STAKING_CODE_HASH=value
 * NEXT_PUBLIC_LP_STAKING_address1_REWARD_TOKEN_SYMBOL=value
 *
 * (and similarly for address2, address3, etc.)
//  */
// function _buildStakingContractsFromEnv(): Record<string, StakingContractInfo> {
//   const contracts: Record<string, StakingContractInfo> = {};

//   // Get the list of LP token addresses from environment
//   const lpAddressesStr = process.env['NEXT_PUBLIC_LP_TOKEN_ADDRESSES']!;
//   const lpAddresses = lpAddressesStr.split(',').filter((addr) => addr.trim() !== '');

//   // For each LP address, get the staking info
//   for (const lpAddress of lpAddresses) {
//     try {
//       const lpTokenAddress = process.env[
//         `NEXT_PUBLIC_LP_STAKING_${lpAddress}_TOKEN_ADDRESS`
//       ]! as SecretString;
//       const lpTokenCodeHash = process.env[`NEXT_PUBLIC_LP_STAKING_${lpAddress}_TOKEN_CODE_HASH`]!;
//       const stakingAddress = process.env[
//         `NEXT_PUBLIC_LP_STAKING_${lpAddress}_STAKING_ADDRESS`
//       ]! as SecretString;
//       const stakingCodeHash = process.env[`NEXT_PUBLIC_LP_STAKING_${lpAddress}_STAKING_CODE_HASH`]!;
//       const rewardTokenSymbol =
//         process.env[`NEXT_PUBLIC_LP_STAKING_${lpAddress}_REWARD_TOKEN_SYMBOL`]!;

//       // Add contract info to the record
//       contracts[lpAddress] = {
//         lpTokenAddress,
//         lpTokenCodeHash,
//         stakingAddress,
//         stakingCodeHash,
//         rewardTokenSymbol,
//       };
//     } catch (error) {
//       console.error(`Error parsing environment variables for LP contract: ${lpAddress}`, error);
//       // In case of error, we'll just skip this LP address
//       // This can happen if any required env var is not defined (will throw TypeError due to ! assertion)
//     }
//   }

//   return contracts;
// }

// Build default staking contracts from the centralized config
function buildDefaultStakingContracts(): Record<string, StakingContractInfo> {
  const contracts: Record<string, StakingContractInfo> = {};

  // First, use the new STAKING_POOLS config if available
  for (const stakingPool of getActiveStakingPools()) {
    contracts[stakingPool.lpTokenAddress as string] = {
      lpTokenAddress: stakingPool.lpTokenAddress,
      lpTokenCodeHash: stakingPool.lpTokenCodeHash,
      stakingAddress: stakingPool.stakingAddress,
      stakingCodeHash: stakingPool.stakingCodeHash,
      rewardTokenSymbol: stakingPool.rewardTokenSymbol,
    };
  }

  // Then, fall back to the old CONFIG_STAKING_CONTRACTS for any not in new config
  for (const stakingContract of CONFIG_STAKING_CONTRACTS) {
    // Find the matching LP pair to get the LP token address and code hash
    const matchingPair = LIQUIDITY_PAIRS.find((pair) => pair.symbol === stakingContract.pairSymbol);

    if (matchingPair) {
      // Only add if not already in contracts (new config takes precedence)
      if (!((matchingPair.lpToken as string) in contracts)) {
        contracts[matchingPair.lpToken as string] = {
          lpTokenAddress: matchingPair.lpToken,
          lpTokenCodeHash: matchingPair.lpTokenCodeHash,
          stakingAddress: stakingContract.stakingContract,
          stakingCodeHash: stakingContract.codeHash,
          rewardTokenSymbol: stakingContract.rewardTokenSymbol,
        };
      }
    }
  }

  return contracts;
}

// Build the contracts record from environment variables or use defaults
const STAKING_CONTRACTS: Record<string, StakingContractInfo> = buildDefaultStakingContracts();

// Cache for pool-to-LP-token mappings to avoid repeated lookups
const poolToLpTokenCache = new Map<string, string | null>();

// Cache for staking contract existence checks
const stakingContractCache = new Map<string, boolean>();

// Initialize caches
function initializeCaches() {
  // Pre-populate the pool-to-LP-token cache
  for (const pair of LIQUIDITY_PAIRS) {
    poolToLpTokenCache.set(pair.pairContract, pair.lpToken);
  }

  // Pre-populate the staking contract existence cache
  for (const lpToken of Object.keys(STAKING_CONTRACTS)) {
    stakingContractCache.set(lpToken, true);
  }
}

// Initialize caches on module load
initializeCaches();

/**
 * Checks if an LP token has an associated staking contract
 */
export function hasStakingContract(lpTokenAddress: string): boolean {
  // Check cache first
  const cached = stakingContractCache.get(lpTokenAddress);
  if (cached !== undefined) {
    return cached;
  }

  // Compute and cache result
  const hasStaking = lpTokenAddress in STAKING_CONTRACTS;
  stakingContractCache.set(lpTokenAddress, hasStaking);
  return hasStaking;
}

/**
 * Checks if a pool contract has an associated staking contract
 * Maps pool contract address to LP token address first
 */
export function hasStakingContractForPool(poolAddress: string): boolean {
  // Check cache first
  const lpTokenAddress = poolToLpTokenCache.get(poolAddress);

  if (lpTokenAddress === undefined) {
    // Not in cache, compute it
    const matchingPair = LIQUIDITY_PAIRS.find((pair) => pair.pairContract === poolAddress);
    const lpToken = matchingPair?.lpToken || null;
    poolToLpTokenCache.set(poolAddress, lpToken);

    if (!lpToken) return false;
    return hasStakingContract(lpToken);
  }

  if (lpTokenAddress === null) {
    return false;
  }

  return hasStakingContract(lpTokenAddress);
}

/**
 * Gets staking contract information for an LP token
 * @returns Staking contract info or null if no staking contract exists
 */
export function getStakingContractInfo(lpTokenAddress: string): StakingContractInfo | null {
  return STAKING_CONTRACTS[lpTokenAddress] || null;
}

/**
 * Gets staking contract information by staking contract address (reverse lookup)
 * @param stakingContractAddress The staking contract address to look up
 * @returns Staking contract info with pool name or null if not found
 */
export function getStakingContractInfoByAddress(
  stakingContractAddress: string
): (StakingContractInfo & { poolName: string }) | null {
  // Search through all staking contracts to find the one with matching staking address
  for (const [lpTokenAddress, contractInfo] of Object.entries(STAKING_CONTRACTS)) {
    if (contractInfo.stakingAddress === stakingContractAddress) {
      // Find the corresponding liquidity pair to get the pool name
      const matchingPair = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === lpTokenAddress);
      const poolName = matchingPair?.symbol || 'Unknown Pool';

      return {
        ...contractInfo,
        poolName,
      };
    }
  }

  return null;
}

/**
 * Gets staking contract information for a pool contract
 * Maps pool contract address to LP token address first
 */
export function getStakingContractInfoForPool(poolAddress: string): StakingContractInfo | null {
  const matchingPair = LIQUIDITY_PAIRS.find((pair) => pair.pairContract === poolAddress);
  if (!matchingPair) return null;

  return getStakingContractInfo(matchingPair.lpToken);
}

/**
 * Gets all available staking contracts with their pool information
 */
export function getAllStakingPools(): Array<{
  poolAddress: string;
  lpTokenAddress: string;
  pairSymbol: string;
  stakingInfo: StakingContractInfo;
}> {
  const stakingPools: Array<{
    poolAddress: string;
    lpTokenAddress: string;
    pairSymbol: string;
    stakingInfo: StakingContractInfo;
  }> = [];

  // First, use the new STAKING_POOLS configuration
  for (const stakingPool of getActiveStakingPools()) {
    // Find the matching LP pair to get the pool address
    const matchingPair = LIQUIDITY_PAIRS.find(
      (pair) => pair.lpToken === stakingPool.lpTokenAddress
    );

    if (matchingPair) {
      stakingPools.push({
        poolAddress: matchingPair.pairContract,
        lpTokenAddress: stakingPool.lpTokenAddress,
        pairSymbol: stakingPool.poolId, // Use poolId as it matches the pair symbol
        stakingInfo: {
          lpTokenAddress: stakingPool.lpTokenAddress,
          lpTokenCodeHash: stakingPool.lpTokenCodeHash,
          stakingAddress: stakingPool.stakingAddress,
          stakingCodeHash: stakingPool.stakingCodeHash,
          rewardTokenSymbol: stakingPool.rewardTokenSymbol,
        },
      });
    }
  }

  // Then, add any from the old configuration that aren't already included
  const existingLpTokens = new Set(stakingPools.map((pool) => pool.lpTokenAddress));

  for (const stakingContract of CONFIG_STAKING_CONTRACTS) {
    const matchingPair = LIQUIDITY_PAIRS.find((pair) => pair.symbol === stakingContract.pairSymbol);
    if (matchingPair && !existingLpTokens.has(matchingPair.lpToken)) {
      const stakingInfo = STAKING_CONTRACTS[matchingPair.lpToken];
      if (stakingInfo) {
        stakingPools.push({
          poolAddress: matchingPair.pairContract,
          lpTokenAddress: matchingPair.lpToken,
          pairSymbol: matchingPair.symbol,
          stakingInfo,
        });
      }
    }
  }

  return stakingPools;
}
