import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';
import { SecretNetworkClient } from 'secretjs';

/**
 * Advanced contract investigation to discover emission rates and contract mechanics
 */
export interface ContractInvestigation {
  stakingContract: {
    address: string;
    codeHash: string;
  };
  rewardToken: {
    address: string;
    codeHash: string;
    tokenInfo?: any;
  };
  totalLocked: string;
  contractStatus: any;
  admin: string;
  rewardSources: any[];
  subscribers: any[];
  blockHeight: string;
  timestamp: string;
  // Calculated metrics
  estimatedEmissions?: {
    dailyRewards: string;
    annualRewards: string;
    aprEstimate?: string;
  };
}

/**
 * Investigate a staking contract to discover all available information
 */
export async function investigateStakingContract(
  secretjs: SecretNetworkClient,
  lpTokenAddress: string
): Promise<ContractInvestigation> {
  const stakingContract = getStakingContractInfo(lpTokenAddress);

  if (!stakingContract) {
    throw new Error('No staking contract found for this LP token');
  }

  console.log('🕵️ Starting contract investigation for:', stakingContract.stakingAddress);

  // Get current block height for context
  const latestBlock = await secretjs.query.tendermint.getLatestBlock({});
  const blockHeight = latestBlock.block?.header?.height || '0';

  // Query all available contract information
  const [
    totalLockedResult,
    rewardTokenResult,
    contractStatusResult,
    adminResult,
    rewardSourcesResult,
    subscribersResult,
  ] = await Promise.allSettled([
    secretjs.query.compute.queryContract({
      contract_address: stakingContract.stakingAddress,
      code_hash: stakingContract.stakingCodeHash,
      query: { total_locked: {} },
    }),
    secretjs.query.compute.queryContract({
      contract_address: stakingContract.stakingAddress,
      code_hash: stakingContract.stakingCodeHash,
      query: { reward_token: {} },
    }),
    secretjs.query.compute.queryContract({
      contract_address: stakingContract.stakingAddress,
      code_hash: stakingContract.stakingCodeHash,
      query: { contract_status: {} },
    }),
    secretjs.query.compute.queryContract({
      contract_address: stakingContract.stakingAddress,
      code_hash: stakingContract.stakingCodeHash,
      query: { admin: {} },
    }),
    secretjs.query.compute.queryContract({
      contract_address: stakingContract.stakingAddress,
      code_hash: stakingContract.stakingCodeHash,
      query: { reward_sources: {} },
    }),
    secretjs.query.compute.queryContract({
      contract_address: stakingContract.stakingAddress,
      code_hash: stakingContract.stakingCodeHash,
      query: { subscribers: {} },
    }),
  ]);

  // Extract results safely
  const totalLocked =
    totalLockedResult.status === 'fulfilled'
      ? (totalLockedResult.value as any)?.total_locked?.amount || '0'
      : '0';

  const rewardTokenData =
    rewardTokenResult.status === 'fulfilled'
      ? (rewardTokenResult.value as any)?.reward_token?.token
      : null;

  const contractStatus =
    contractStatusResult.status === 'fulfilled' ? contractStatusResult.value : null;

  const admin =
    adminResult.status === 'fulfilled'
      ? (adminResult.value as any)?.admin?.address || 'Unknown'
      : 'Unknown';

  const rewardSources =
    rewardSourcesResult.status === 'fulfilled'
      ? (rewardSourcesResult.value as any)?.reward_sources?.contracts || []
      : [];

  const subscribers =
    subscribersResult.status === 'fulfilled'
      ? (subscribersResult.value as any)?.subscribers?.contracts || []
      : [];

  console.log('📊 Contract investigation results:', {
    totalLocked,
    rewardTokenData,
    contractStatus,
    admin,
    rewardSources,
    subscribers,
  });

  // If we have reward token info, query it for more details
  let rewardTokenInfo = null;
  if (rewardTokenData?.address && rewardTokenData?.contract_hash) {
    try {
      rewardTokenInfo = await secretjs.query.compute.queryContract({
        contract_address: rewardTokenData.address,
        code_hash: rewardTokenData.contract_hash,
        query: { token_info: {} },
      });
      console.log('🪙 Reward token info:', rewardTokenInfo);
    } catch (err) {
      console.log('❌ Failed to query reward token:', err);
    }
  }

  const investigation: ContractInvestigation = {
    stakingContract: {
      address: stakingContract.stakingAddress,
      codeHash: stakingContract.stakingCodeHash,
    },
    rewardToken: {
      address: rewardTokenData?.address || '',
      codeHash: rewardTokenData?.contract_hash || '',
      tokenInfo: rewardTokenInfo,
    },
    totalLocked,
    contractStatus,
    admin,
    rewardSources,
    subscribers,
    blockHeight,
    timestamp: new Date().toISOString(),
  };

  return investigation;
}

/**
 * Try to discover emission rates by analyzing contract state and reward sources
 */
export async function discoverEmissionRates(
  secretjs: SecretNetworkClient,
  investigation: ContractInvestigation
): Promise<{
  possibleEmissionSources: any[];
  estimatedRates: any[];
  recommendations: string[];
}> {
  const possibleEmissionSources: any[] = [];
  const estimatedRates: any[] = [];
  const recommendations: string[] = [];

  console.log('🔍 Analyzing emission sources...');

  // Analyze reward sources for emission clues
  for (const source of investigation.rewardSources) {
    try {
      console.log('📡 Investigating reward source:', source.address);

      // Try to query the reward source contract
      const sourceInfo = await secretjs.query.compute.queryContract({
        contract_address: source.address,
        code_hash: source.contract_hash,
        query: { token_info: {} },
      });

      possibleEmissionSources.push({
        address: source.address,
        info: sourceInfo,
        type: 'reward_source',
      });

      console.log('✅ Reward source info:', sourceInfo);
    } catch (err) {
      console.log('❌ Failed to query reward source:', source.address, err);
      possibleEmissionSources.push({
        address: source.address,
        error: err instanceof Error ? err.message : 'Unknown error',
        type: 'reward_source',
      });
    }
  }

  // Analyze subscribers (might be emission distributors)
  for (const subscriber of investigation.subscribers) {
    try {
      console.log('📡 Investigating subscriber:', subscriber.address);

      const subscriberInfo = await secretjs.query.compute.queryContract({
        contract_address: subscriber.address,
        code_hash: subscriber.contract_hash,
        query: { token_info: {} },
      });

      possibleEmissionSources.push({
        address: subscriber.address,
        info: subscriberInfo,
        type: 'subscriber',
      });

      console.log('✅ Subscriber info:', subscriberInfo);
    } catch (err) {
      console.log('❌ Failed to query subscriber:', subscriber.address, err);
      possibleEmissionSources.push({
        address: subscriber.address,
        error: err instanceof Error ? err.message : 'Unknown error',
        type: 'subscriber',
      });
    }
  }

  // Generate recommendations based on findings
  recommendations.push('Check the admin address for emission control functions');
  recommendations.push('Analyze reward sources for emission rate configuration');

  if (investigation.rewardSources.length > 0) {
    recommendations.push('Query reward source contracts for emission schedules');
  }

  if (investigation.subscribers.length > 0) {
    recommendations.push('Investigate subscriber contracts - they might control emissions');
  }

  recommendations.push(
    'Monitor contract state changes over time to calculate actual emission rates'
  );
  recommendations.push('Check if the admin contract has public emission rate queries');

  return {
    possibleEmissionSources,
    estimatedRates,
    recommendations,
  };
}

/**
 * Calculate APR based on total locked and estimated emissions
 */
export function calculateAPR(
  totalLocked: string,
  dailyEmissions: string,
  rewardTokenPrice: number = 1, // Default to $1 if price unknown
  lpTokenPrice: number = 1 // Default to $1 if price unknown
): {
  dailyAPR: string;
  annualAPR: string;
  assumptions: string[];
} {
  const totalLockedNum = parseFloat(totalLocked) || 0;
  const dailyEmissionsNum = parseFloat(dailyEmissions) || 0;

  if (totalLockedNum === 0) {
    return {
      dailyAPR: '0',
      annualAPR: '0',
      assumptions: ['Cannot calculate APR: no LP tokens staked'],
    };
  }

  // Calculate daily reward value in USD
  const dailyRewardValue = dailyEmissionsNum * rewardTokenPrice;

  // Calculate total staked value in USD
  const totalStakedValue = totalLockedNum * lpTokenPrice;

  // Calculate APR
  const dailyAPR = (dailyRewardValue / totalStakedValue) * 100;
  const annualAPR = dailyAPR * 365;

  const assumptions = [
    `Assuming reward token price: $${rewardTokenPrice}`,
    `Assuming LP token price: $${lpTokenPrice}`,
    `Based on ${dailyEmissionsNum} daily emissions`,
    `Based on ${totalLockedNum} total LP tokens staked`,
    'Prices should be updated with real market data for accuracy',
  ];

  return {
    dailyAPR: dailyAPR.toFixed(4),
    annualAPR: annualAPR.toFixed(2),
    assumptions,
  };
}
