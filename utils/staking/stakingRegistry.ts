// I don't think it's worth using this type
// import { SecretString } from '@/types';

export interface StakingContractInfo {
  lpTokenAddress: string;
  lpTokenCodeHash: string;
  stakingAddress: string;
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
      const lpTokenAddress = process.env[`NEXT_PUBLIC_LP_STAKING_${lpAddress}_TOKEN_ADDRESS`]!;
      const lpTokenCodeHash = process.env[`NEXT_PUBLIC_LP_STAKING_${lpAddress}_TOKEN_CODE_HASH`]!;
      const stakingAddress = process.env[`NEXT_PUBLIC_LP_STAKING_${lpAddress}_STAKING_ADDRESS`]!;
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

// Default fallback configuration if environment variables are not set
const DEFAULT_STAKING_CONTRACTS: Record<string, StakingContractInfo> = {
  // LP token address -> staking info
  secret13y8e73vfl40auct785zdmyygwesvxmutm7fjx: {
    lpTokenAddress: 'secret13y8e73vfl40auct785zdmyygwesvxmutm7fjx',
    lpTokenCodeHash: 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e',
    stakingAddress: 'secret1yauz94h0ck2lh02u96yum67cswjdapes7y62k8',
    stakingCodeHash: 'c644edd309de7fd865b4fbe22054bcbe85a6c0b8abf5f110053fe1b2d0e8a72a',
    rewardTokenSymbol: 'sSCRT',
  },
  // Add more LP contracts as needed
};

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
