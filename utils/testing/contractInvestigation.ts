import { STAKING_EMISSION_CONFIG } from '@/config/staking';
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
  queryResults: QueryResult[];
  // Calculated metrics
  estimatedEmissions?: {
    dailyRewards: string;
    annualRewards: string;
    aprEstimate?: string;
  };
}

export interface QueryResult {
  queryName: string;
  success: boolean;
  result?: any;
  error?: string;
  timestamp: string;
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

  const queryResults: QueryResult[] = [];

  // Define all possible queries to try
  const queries = [
    { name: 'total_locked', query: { total_locked: {} } },
    { name: 'reward_token', query: { reward_token: {} } },
    { name: 'contract_status', query: { contract_status: {} } },
    { name: 'admin', query: { admin: {} } },
    { name: 'reward_sources', query: { reward_sources: {} } },
    { name: 'subscribers', query: { subscribers: {} } },
    { name: 'incentivized_token', query: { incentivized_token: {} } },
    { name: 'token_info', query: { token_info: {} } },
    // Try alternative query formats
    { name: 'config', query: { config: {} } },
    { name: 'state', query: { state: {} } },
    { name: 'emission_config', query: { emission_config: {} } },
    { name: 'emission_rate', query: { emission_rate: {} } },
  ];

  // Execute all queries and collect results
  const queryPromises = queries.map(async ({ name, query }) => {
    try {
      console.log(`🔍 Querying ${name}...`);
      const result = await secretjs.query.compute.queryContract({
        contract_address: stakingContract.stakingAddress,
        code_hash: stakingContract.stakingCodeHash,
        query,
      });

      const queryResult: QueryResult = {
        queryName: name,
        success: true,
        result,
        timestamp: new Date().toISOString(),
      };

      console.log(`✅ ${name}:`, result);
      return queryResult;
    } catch (err) {
      const queryResult: QueryResult = {
        queryName: name,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };

      console.log(`❌ ${name} failed:`, err);
      return queryResult;
    }
  });

  const allQueryResults = await Promise.all(queryPromises);
  queryResults.push(...allQueryResults);

  // Extract successful results
  const getQueryResult = (name: string) => {
    const result = queryResults.find((q) => q.queryName === name && q.success);
    return result?.result;
  };

  const totalLocked = getQueryResult('total_locked')?.total_locked?.amount || '0';
  const rewardTokenData = getQueryResult('reward_token')?.reward_token?.token;
  const contractStatus = getQueryResult('contract_status');
  const admin = getQueryResult('admin')?.admin?.address || 'Unknown';
  const rewardSources = getQueryResult('reward_sources')?.reward_sources?.contracts || [];
  const subscribers = getQueryResult('subscribers')?.subscribers?.contracts || [];

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
    queryResults,
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

      // Try multiple query types on the reward source
      const sourceQueries = [
        { name: 'token_info', query: { token_info: {} } },
        { name: 'config', query: { config: {} } },
        { name: 'emission_rate', query: { emission_rate: {} } },
        { name: 'state', query: { state: {} } },
      ];

      for (const { name, query } of sourceQueries) {
        try {
          const sourceInfo = await secretjs.query.compute.queryContract({
            contract_address: source.address,
            code_hash: source.contract_hash,
            query,
          });

          possibleEmissionSources.push({
            address: source.address,
            queryType: name,
            info: sourceInfo,
            type: 'reward_source',
          });

          console.log(`✅ Reward source ${name}:`, sourceInfo);
        } catch (err) {
          console.log(`❌ Reward source ${name} failed:`, err);
        }
      }
    } catch (err) {
      console.log('❌ Failed to query reward source:', source.address, err);
      possibleEmissionSources.push({
        address: source.address,
        error: err instanceof Error ? err.message : 'Unknown error',
        type: 'reward_source',
      });
    }
  }

  // Generate recommendations based on findings
  if (investigation.rewardSources.length === 0) {
    recommendations.push('❌ No reward sources configured - this is the main issue!');
    recommendations.push('💡 Admin needs to add the bulk distributor as a reward source');
    recommendations.push(
      `📝 Expected bulk distributor: secret1s563hkkrzjzx9q8qcx3r47h7s0hn5kfgy9t62r`
    );
  } else {
    recommendations.push('✅ Reward sources found - checking configuration...');
    recommendations.push('🔍 Verify reward sources are actually emitting rewards');
  }

  recommendations.push('📊 Calculate estimated emission rates based on configuration');
  recommendations.push('⏰ Monitor contract state changes to verify actual emissions');

  // Add theoretical emission calculations
  const dailyRewards =
    (STAKING_EMISSION_CONFIG.BLOCKS_PER_DAY * STAKING_EMISSION_CONFIG.REWARD_PER_BLOCK) /
    Math.pow(10, STAKING_EMISSION_CONFIG.DECIMALS);
  const annualRewards = dailyRewards * 365;

  estimatedRates.push({
    source: 'configuration',
    dailyRewards: dailyRewards.toString(),
    annualRewards: annualRewards.toString(),
    assumptions: [
      `${STAKING_EMISSION_CONFIG.REWARD_PER_BLOCK} raw bADMT per block`,
      `${STAKING_EMISSION_CONFIG.BLOCKS_PER_DAY} blocks per day`,
      `${STAKING_EMISSION_CONFIG.DECIMALS} decimals for bADMT`,
    ],
  });

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
