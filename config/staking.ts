import { SecretString } from '@/types';

/**
 * Staking Emission Configuration
 */
export const STAKING_EMISSION_CONFIG = {
  /** Raw bADMT units emitted per block */
  REWARD_PER_BLOCK: 20,
  /** bADMT token decimals */
  DECIMALS: 6,
  /** Estimated blocks per day (based on ~6 second block time) */
  BLOCKS_PER_DAY: 14400,
  /** Estimated seconds per block on Secret Network */
  BLOCK_TIME_SECONDS: 6,
} as const;

/**
 * Reward Distribution Contracts
 */
export const REWARD_CONTRACTS = {
  /** Main bulk distributor contract that emits bADMT rewards */
  BULK_DISTRIBUTOR: 'secret1s563hkkrzjzx9q8qcx3r47h7s0hn5kfgy9t62r' as SecretString,
  /** LP Staking contract for sSCRT/USDC.nbl pool */
  SSCRT_USDC_LP_STAKING: 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev' as SecretString,
} as const;

/**
 * Staking Pool Configuration
 */
export interface StakingPoolConfig {
  /** Pool identifier (matches pair symbol) */
  poolId: string;
  /** Display name for the pool */
  displayName: string;
  /** LP token address for this pool */
  lpTokenAddress: SecretString;
  /** LP token code hash */
  lpTokenCodeHash: string;
  /** Staking contract address */
  stakingAddress: SecretString;
  /** Staking contract code hash */
  stakingCodeHash: string;
  /** Reward token symbol */
  rewardTokenSymbol: string;
  /** Whether this pool is currently active for rewards */
  isActive: boolean;
  /** Emission rate (raw units per block) - can override global config */
  emissionRatePerBlock?: number;
}

/**
 * Active staking pools configuration
 */
export const STAKING_POOLS: StakingPoolConfig[] = [
  {
    poolId: 'sSCRT/USDC.nbl',
    displayName: 'Secret SCRT / Noble USDC',
    lpTokenAddress: 'secret18xd8j88jrwzagnv09cegv0fm3aca6d3qlfem6v' as SecretString,
    lpTokenCodeHash: '744c588ed4181b13a49a7c75a49f10b84b22b24a69b1e5f3cdff34b2c343e888',
    stakingAddress: 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev' as SecretString,
    stakingCodeHash: 'c644edd309de7fd865b4fbe22054bcbe85a6c0b8abf5f110053fe1b2d0e8a72a',
    rewardTokenSymbol: 'bADMT',
    isActive: true,
    // Uses default emission rate from STAKING_EMISSION_CONFIG.REWARD_PER_BLOCK
  },
];

/**
 * Helper functions for staking configuration
 */

/**
 * Get staking pool configuration by pool ID
 */
export function getStakingPoolConfig(poolId: string): StakingPoolConfig | undefined {
  return STAKING_POOLS.find((pool) => pool.poolId === poolId);
}

/**
 * Get staking pool configuration by LP token address
 */
export function getStakingPoolConfigByLpToken(
  lpTokenAddress: SecretString
): StakingPoolConfig | undefined {
  return STAKING_POOLS.find((pool) => pool.lpTokenAddress === lpTokenAddress);
}

/**
 * Get staking pool configuration by staking contract address
 */
export function getStakingPoolConfigByStakingAddress(
  stakingAddress: SecretString
): StakingPoolConfig | undefined {
  return STAKING_POOLS.find((pool) => pool.stakingAddress === stakingAddress);
}

/**
 * Get all active staking pools
 */
export function getActiveStakingPools(): StakingPoolConfig[] {
  return STAKING_POOLS.filter((pool) => pool.isActive);
}

/**
 * Calculate estimated daily rewards for a given emission rate
 */
export function calculateDailyRewards(
  emissionRatePerBlock: number = STAKING_EMISSION_CONFIG.REWARD_PER_BLOCK,
  decimals: number = STAKING_EMISSION_CONFIG.DECIMALS
): number {
  const rawDailyRewards = STAKING_EMISSION_CONFIG.BLOCKS_PER_DAY * emissionRatePerBlock;
  return rawDailyRewards / Math.pow(10, decimals);
}

/**
 * Calculate estimated annual rewards for a given emission rate
 */
export function calculateAnnualRewards(
  emissionRatePerBlock: number = STAKING_EMISSION_CONFIG.REWARD_PER_BLOCK,
  decimals: number = STAKING_EMISSION_CONFIG.DECIMALS
): number {
  return calculateDailyRewards(emissionRatePerBlock, decimals) * 365;
}

/**
 * Get emission assumptions as strings for display
 */
export function getEmissionAssumptions(): string[] {
  const { REWARD_PER_BLOCK, DECIMALS, BLOCKS_PER_DAY, BLOCK_TIME_SECONDS } =
    STAKING_EMISSION_CONFIG;

  return [
    `Assuming ${REWARD_PER_BLOCK} raw bADMT units per block (${
      REWARD_PER_BLOCK / Math.pow(10, DECIMALS)
    } bADMT)`,
    `Assuming ${BLOCKS_PER_DAY} blocks per day (~${BLOCK_TIME_SECONDS} second block time)`,
    'Actual rates may vary based on network conditions and contract configuration',
    'This is an estimation - actual emission rates should be verified with the contract deployer',
  ];
}
