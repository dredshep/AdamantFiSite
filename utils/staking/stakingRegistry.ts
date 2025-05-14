// kent: I don't think it's worth using this type
// seb: It helps me when i input the wrong string xD
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
 */
function buildStakingContractsFromEnv(): Record<string, StakingContractInfo> {
  const contracts: Record<string, StakingContractInfo> = {};

  // Get the list of LP token addresses from environment
  const lpAddressesStr = process.env['NEXT_PUBLIC_LP_TOKEN_ADDRESSES']!;
  const lpAddresses = lpAddressesStr.split(',').filter((addr) => addr.trim() !== '');

  // For each LP address, get the staking info
  for (const lpAddress of lpAddresses) {
    try {
      const lpTokenAddress = process.env[
        `NEXT_PUBLIC_LP_STAKING_${lpAddress}_TOKEN_ADDRESS`
      ]! as SecretString;
      const lpTokenCodeHash = process.env[`NEXT_PUBLIC_LP_STAKING_${lpAddress}_TOKEN_CODE_HASH`]!;
      const stakingAddress = process.env[
        `NEXT_PUBLIC_LP_STAKING_${lpAddress}_STAKING_ADDRESS`
      ]! as SecretString;
      const stakingCodeHash = process.env[`NEXT_PUBLIC_LP_STAKING_${lpAddress}_STAKING_CODE_HASH`]!;
      const rewardTokenSymbol =
        process.env[`NEXT_PUBLIC_LP_STAKING_${lpAddress}_REWARD_TOKEN_SYMBOL`]!;

      // Add contract info to the record
      contracts[lpAddress] = {
        lpTokenAddress,
        lpTokenCodeHash,
        stakingAddress,
        stakingCodeHash,
        rewardTokenSymbol,
      };
    } catch (error) {
      console.error(`Error parsing environment variables for LP contract: ${lpAddress}`, error);
      // In case of error, we'll just skip this LP address
      // This can happen if any required env var is not defined (will throw TypeError due to ! assertion)
    }
  }

  return contracts;
}

// Build default staking contracts from the centralized config
function buildDefaultStakingContracts(): Record<string, StakingContractInfo> {
  const contracts: Record<string, StakingContractInfo> = {};

  // Map staking contracts from config to our format
  for (const stakingContract of CONFIG_STAKING_CONTRACTS) {
    // Find the matching LP pair to get the LP token address and code hash
    const matchingPair = LIQUIDITY_PAIRS.find((pair) => pair.symbol === stakingContract.pairSymbol);

    if (matchingPair) {
      // Use the LP token address as the key in our contracts record
      contracts[matchingPair.lpToken as string] = {
        lpTokenAddress: matchingPair.lpToken,
        lpTokenCodeHash: matchingPair.lpTokenCodeHash,
        stakingAddress: stakingContract.stakingContract,
        stakingCodeHash: stakingContract.codeHash,
        rewardTokenSymbol: stakingContract.rewardTokenSymbol,
      };
    }
  }

  return contracts;
}

// Default fallback configuration built from the centralized config
const DEFAULT_STAKING_CONTRACTS: Record<string, StakingContractInfo> =
  buildDefaultStakingContracts();

// Build the contracts record from environment variables or use defaults
const STAKING_CONTRACTS: Record<string, StakingContractInfo> =
  process.env['NEXT_PUBLIC_USE_ENV_STAKING_CONFIG'] === 'true'
    ? buildStakingContractsFromEnv()
    : DEFAULT_STAKING_CONTRACTS;

/**
 * Checks if an LP token has an associated staking contract
 */
export function hasStakingContract(lpTokenAddress: string): boolean {
  return lpTokenAddress in STAKING_CONTRACTS;
}

/**
 * Gets staking contract information for an LP token
 * @returns Staking contract info or null if no staking contract exists
 */
export function getStakingContractInfo(lpTokenAddress: string): StakingContractInfo | null {
  return STAKING_CONTRACTS[lpTokenAddress] || null;
}
