import {
  calculateAnnualRewards,
  calculateDailyRewards,
  getEmissionAssumptions,
} from '@/config/staking';
import { debugKeplrQuery } from '@/lib/keplr/utils';
import {
  LPStakingQueryAnswer,
  LPStakingQueryMsg,
  isQueryErrorResponse,
} from '@/types/secretswap/lp-staking';
import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';
import { SecretNetworkClient } from 'secretjs';

/**
 * Parameters for getRewardInfo function
 */
export interface GetRewardInfoParams {
  /** SecretNetworkClient instance */
  secretjs: SecretNetworkClient;
  /** LP token address */
  lpToken: string;
}

/**
 * Reward information from the staking contract
 */
export interface RewardInfo {
  totalLocked: string;
  rewardToken: {
    address: string;
    contract_hash: string;
  };
  incentivizedToken: {
    address: string;
    contract_hash: string;
  };
  rewardSources: Array<{
    address: string;
    contract_hash: string;
  }>;
}

/**
 * Get comprehensive reward information from the staking contract
 * This includes total locked amounts, reward token info, and reward sources
 */
export async function getRewardInfo(params: GetRewardInfoParams): Promise<RewardInfo> {
  const { secretjs, lpToken } = params;

  const lpStakingContract = getStakingContractInfo(lpToken);
  const lpStakingContractAddress = lpStakingContract?.stakingAddress;
  const lpStakingContractHash = lpStakingContract?.stakingCodeHash;

  if (typeof lpStakingContractAddress !== 'string' || lpStakingContractAddress.trim() === '') {
    throw new Error('lpStaking contract address is not configured');
  }

  if (typeof lpStakingContractHash !== 'string' || lpStakingContractHash.trim() === '') {
    throw new Error('lpStaking contract hash is not configured');
  }

  return debugKeplrQuery(async () => {
    // Query total locked amount
    const totalLockedQuery: LPStakingQueryMsg = { total_locked: {} };
    const totalLockedResult = await secretjs.query.compute.queryContract({
      contract_address: lpStakingContractAddress,
      code_hash: lpStakingContractHash,
      query: totalLockedQuery,
    });

    // Query reward token info
    const rewardTokenQuery: LPStakingQueryMsg = { reward_token: {} };
    const rewardTokenResult = await secretjs.query.compute.queryContract({
      contract_address: lpStakingContractAddress,
      code_hash: lpStakingContractHash,
      query: rewardTokenQuery,
    });

    // Query incentivized token info
    const incentivizedTokenQuery: LPStakingQueryMsg = { incentivized_token: {} };
    const incentivizedTokenResult = await secretjs.query.compute.queryContract({
      contract_address: lpStakingContractAddress,
      code_hash: lpStakingContractHash,
      query: incentivizedTokenQuery,
    });

    // Query reward sources
    const rewardSourcesQuery: LPStakingQueryMsg = { reward_sources: {} };
    const rewardSourcesResult = await secretjs.query.compute.queryContract({
      contract_address: lpStakingContractAddress,
      code_hash: lpStakingContractHash,
      query: rewardSourcesQuery,
    });

    // Parse results
    const parsedTotalLocked = totalLockedResult as LPStakingQueryAnswer;
    const parsedRewardToken = rewardTokenResult as LPStakingQueryAnswer;
    const parsedIncentivizedToken = incentivizedTokenResult as LPStakingQueryAnswer;
    const parsedRewardSources = rewardSourcesResult as LPStakingQueryAnswer;

    // Check for errors
    if (isQueryErrorResponse(parsedTotalLocked)) {
      throw new Error(`Total locked query error: ${parsedTotalLocked.query_error.msg}`);
    }
    if (isQueryErrorResponse(parsedRewardToken)) {
      throw new Error(`Reward token query error: ${parsedRewardToken.query_error.msg}`);
    }
    if (isQueryErrorResponse(parsedIncentivizedToken)) {
      throw new Error(`Incentivized token query error: ${parsedIncentivizedToken.query_error.msg}`);
    }
    if (isQueryErrorResponse(parsedRewardSources)) {
      throw new Error(`Reward sources query error: ${parsedRewardSources.query_error.msg}`);
    }

    // Extract data with proper type checking
    const totalLocked =
      'total_locked' in parsedTotalLocked &&
      typeof parsedTotalLocked.total_locked === 'object' &&
      parsedTotalLocked.total_locked !== null &&
      'amount' in parsedTotalLocked.total_locked
        ? String(parsedTotalLocked.total_locked.amount)
        : '0';

    const rewardToken =
      'reward_token' in parsedRewardToken &&
      typeof parsedRewardToken.reward_token === 'object' &&
      parsedRewardToken.reward_token !== null &&
      'token' in parsedRewardToken.reward_token
        ? (parsedRewardToken.reward_token.token as { address: string; contract_hash: string })
        : { address: '', contract_hash: '' };

    const incentivizedToken =
      'incentivized_token' in parsedIncentivizedToken &&
      typeof parsedIncentivizedToken.incentivized_token === 'object' &&
      parsedIncentivizedToken.incentivized_token !== null &&
      'token' in parsedIncentivizedToken.incentivized_token
        ? (parsedIncentivizedToken.incentivized_token.token as {
            address: string;
            contract_hash: string;
          })
        : { address: '', contract_hash: '' };

    const rewardSources =
      'reward_sources' in parsedRewardSources &&
      typeof parsedRewardSources.reward_sources === 'object' &&
      parsedRewardSources.reward_sources !== null &&
      'contracts' in parsedRewardSources.reward_sources &&
      Array.isArray(parsedRewardSources.reward_sources.contracts)
        ? (parsedRewardSources.reward_sources.contracts as Array<{
            address: string;
            contract_hash: string;
          }>)
        : [];

    return {
      totalLocked,
      rewardToken,
      incentivizedToken,
      rewardSources,
    };
  });
}

/**
 * Calculate estimated reward rate based on available information
 * Note: This is an estimation since the contract doesn't expose direct emission rates
 */
export async function estimateRewardRate(params: GetRewardInfoParams): Promise<{
  estimatedDailyRate: string;
  estimatedAnnualRate: string;
  totalLocked: string;
  assumptions: string[];
}> {
  const rewardInfo = await getRewardInfo(params);

  // Use centralized configuration
  const dailyRewards = calculateDailyRewards();
  const annualRewards = calculateAnnualRewards();
  const assumptions = getEmissionAssumptions();

  return {
    estimatedDailyRate: dailyRewards.toString(),
    estimatedAnnualRate: annualRewards.toString(),
    totalLocked: rewardInfo.totalLocked,
    assumptions,
  };
}
