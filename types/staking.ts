import { ContractInfo } from '@/lib/keplr/common/types';
import { SecretString } from '@/types';
import { SecretNetworkClient } from 'secretjs';

/**
 * Basic information about a staking contract
 */
export interface StakingContractInfo {
  lpTokenAddress: string;
  lpTokenCodeHash: string;
  stakingAddress: string;
  stakingCodeHash: string;
  rewardTokenSymbol: string;
}

/**
 * Input state for staking form
 */
export interface StakingInputState {
  amount: string;
}

/**
 * Parameters for staking operations
 */
export interface StakingOperationParams {
  secretjs: SecretNetworkClient;
  lpToken: string;
  amount: string;
}

/**
 * Parameters for unstaking operations
 */
export interface UnstakingOperationParams {
  secretjs: SecretNetworkClient;
  lpToken: string;
  amount: string;
}

/**
 * Parameters for claiming rewards
 */
export interface ClaimRewardsParams {
  secretjs: SecretNetworkClient;
  lpStakingContract: ContractInfo;
}

/**
 * Parameters for viewing staked balances
 */
export interface StakedBalanceParams {
  secretjs: SecretNetworkClient;
  lpToken: string;
  address: string;
  viewingKey: string;
}

/**
 * Parameters for viewing rewards
 */
export interface RewardsParams {
  secretjs: SecretNetworkClient;
  lpToken: string;
  address: string;
  viewingKey: string;
  height?: number;
}

/**
 * Result from a staking operation
 */
export interface StakingOperationResult {
  success: boolean;
  transactionHash?: string;
  error?: Error;
}

/**
 * Status of the viewing key for the staking contract
 */
export enum ViewingKeyStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  CREATED = 'CREATED',
  ERROR = 'ERROR',
}

/**
 * Parameters for the usePoolStaking hook
 */
export interface UsePoolStakingParams {
  poolAddress: SecretString | null;
}
