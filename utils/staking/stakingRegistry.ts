import { SecretString } from '@/types';

export interface StakingContractInfo {
  lpTokenAddress: string;
  lpTokenCodeHash: string;
  stakingAddress: string;
  stakingCodeHash: string;
  rewardTokenSymbol: string;
}

// This could come from an API or config in the future
const STAKING_CONTRACTS: Record<string, StakingContractInfo> = {
  // Pool contract address -> staking info
  // TODO: configure with real values
  secret1qyt4l47yq3x43ezle4nwlh5q0sn6f9sesat7ap: {
    lpTokenAddress: 'secret13y8e73vfl40auct785zdmyygwesvxmutm7fjx',
    lpTokenCodeHash: 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e',
    stakingAddress: 'secret1yauz94h0ck2lh02u96yum67cswjdapes7y62k8',
    stakingCodeHash: 'c644edd309de7fd865b4fbe22054bcbe85a6c0b8abf5f110053fe1b2d0e8a72a',
    rewardTokenSymbol: 'sSCRT',
  },
  // Add more pools as needed
};

/**
 * Checks if a pool has an associated staking contract
 */
export function hasStakingContract(poolAddress: SecretString): boolean {
  return poolAddress in STAKING_CONTRACTS;
}

/**
 * Gets staking contract information for a pool
 * @returns Staking contract info or null if no staking contract exists
 */
export function getStakingContractInfo(poolAddress: SecretString): StakingContractInfo | null {
  return STAKING_CONTRACTS[poolAddress] || null;
}
