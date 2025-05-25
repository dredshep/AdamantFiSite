import { SecretNetworkClient } from 'secretjs';

/**
 * Investigate the admin contract to discover emission control functions
 */
export async function investigateAdminContract(
  secretjs: SecretNetworkClient,
  adminAddress: string
): Promise<{
  adminInfo: any;
  possibleQueries: any[];
  emissionControls: any[];
  recommendations: string[];
}> {
  console.log('🔍 Investigating admin contract:', adminAddress);

  const possibleQueries: any[] = [];
  const emissionControls: any[] = [];
  const recommendations: string[] = [];

  // Try common admin queries
  const adminQueries = [
    { name: 'admin_info', query: { admin_info: {} } },
    { name: 'config', query: { config: {} } },
    { name: 'state', query: { state: {} } },
    { name: 'emission_config', query: { emission_config: {} } },
    { name: 'emission_rate', query: { emission_rate: {} } },
    { name: 'emission_schedule', query: { emission_schedule: {} } },
    { name: 'reward_config', query: { reward_config: {} } },
    { name: 'staking_pools', query: { staking_pools: {} } },
    { name: 'pool_config', query: { pool_config: {} } },
    { name: 'token_info', query: { token_info: {} } },
    { name: 'contract_info', query: { contract_info: {} } },
  ];

  // Try to query the admin contract with different possible code hashes
  const commonCodeHashes = [
    'c644edd309de7fd865b4fbe22054bcbe85a6c0b8abf5f110053fe1b2d0e8a72a', // Same as staking
    '638a3e1d50175fbcb8373cf801565283e3eb23d88a9b7b7f99fcc5eb1e6b561e', // Same as bADMT
    '744c588ed4181b13a49a7c75a49f10b84b22b24a69b1e5f3cdff34b2c343e888', // Same as LP token
  ];

  let adminInfo = null;
  let workingCodeHash = null;

  // Try to find the correct code hash for the admin contract
  for (const codeHash of commonCodeHashes) {
    try {
      console.log(`🔍 Trying admin contract with code hash: ${codeHash}`);
      const result = await secretjs.query.compute.queryContract({
        contract_address: adminAddress,
        code_hash: codeHash,
        query: { token_info: {} },
      });

      adminInfo = result;
      workingCodeHash = codeHash;
      console.log('✅ Found working code hash for admin:', codeHash);
      break;
    } catch (err) {
      console.log(`❌ Code hash ${codeHash} failed:`, err);
    }
  }

  if (!workingCodeHash) {
    recommendations.push('Admin contract code hash unknown - need to discover it');
    recommendations.push('Try querying the admin address with different code hashes');
    return {
      adminInfo: null,
      possibleQueries,
      emissionControls,
      recommendations,
    };
  }

  // Now try all possible queries with the working code hash
  for (const { name, query } of adminQueries) {
    try {
      console.log(`🔍 Querying admin ${name}...`);
      const result = await secretjs.query.compute.queryContract({
        contract_address: adminAddress,
        code_hash: workingCodeHash,
        query,
      });

      possibleQueries.push({
        name,
        result,
        success: true,
      });

      console.log(`✅ Admin ${name}:`, result);

      // Check if this looks like emission control
      if (name.includes('emission') || name.includes('reward') || name.includes('config')) {
        emissionControls.push({
          name,
          result,
          type: 'emission_control',
        });
      }
    } catch (err) {
      console.log(`❌ Admin ${name} failed:`, err);
      possibleQueries.push({
        name,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false,
      });
    }
  }

  // Generate recommendations based on findings
  if (emissionControls.length > 0) {
    recommendations.push('Found potential emission control functions in admin contract');
    recommendations.push('Check emission_config and reward_config for setup status');
  } else {
    recommendations.push('No emission controls found in admin contract');
    recommendations.push('Admin might be a simple multisig - check if it has setup functions');
  }

  recommendations.push('Contact admin address owner to configure emission sources');
  recommendations.push('Emission sources need to be added to the staking contract');

  return {
    adminInfo,
    possibleQueries,
    emissionControls,
    recommendations,
  };
}

/**
 * Check if the staking contract has setup functions that the admin can call
 */
export async function checkStakingSetupFunctions(
  secretjs: SecretNetworkClient,
  stakingAddress: string,
  stakingCodeHash: string
): Promise<{
  setupFunctions: any[];
  recommendations: string[];
}> {
  console.log('🔍 Checking staking contract setup functions...');

  const setupFunctions: any[] = [];
  const recommendations: string[] = [];

  // Try queries that might reveal setup status
  const setupQueries = [
    { name: 'is_configured', query: { is_configured: {} } },
    { name: 'setup_status', query: { setup_status: {} } },
    { name: 'initialization_status', query: { initialization_status: {} } },
    { name: 'emission_sources_count', query: { emission_sources_count: {} } },
  ];

  for (const { name, query } of setupQueries) {
    try {
      console.log(`🔍 Checking ${name}...`);
      const result = await secretjs.query.compute.queryContract({
        contract_address: stakingAddress,
        code_hash: stakingCodeHash,
        query,
      });

      setupFunctions.push({
        name,
        result,
        success: true,
      });

      console.log(`✅ ${name}:`, result);
    } catch (err) {
      console.log(`❌ ${name} failed:`, err);
      setupFunctions.push({
        name,
        error: err instanceof Error ? err.message : 'Unknown error',
        success: false,
      });
    }
  }

  recommendations.push('Staking contract needs emission sources to be configured');
  recommendations.push('Admin must call setup functions to add reward sources');
  recommendations.push('Without reward sources, no rewards will be distributed');

  return {
    setupFunctions,
    recommendations,
  };
}

/**
 * Generate a comprehensive report on the emission system status
 */
export function generateEmissionReport(data: {
  totalLocked: string;
  rewardSources: any[];
  subscribers: any[];
  admin: string;
  contractStatus: any;
  adminInvestigation?: any;
  setupCheck?: any;
}): {
  status: 'not_configured' | 'partially_configured' | 'fully_configured';
  issues: string[];
  actionItems: string[];
  technicalDetails: any;
} {
  const {
    totalLocked,
    rewardSources,
    subscribers,
    admin,
    contractStatus,
    adminInvestigation,
    setupCheck,
  } = data;

  const issues: string[] = [];
  const actionItems: string[] = [];
  let status: 'not_configured' | 'partially_configured' | 'fully_configured' = 'not_configured';

  // Check contract status
  if (contractStatus?.contract_status?.is_stopped) {
    issues.push('Staking contract is stopped/paused');
    actionItems.push('Admin needs to resume the staking contract');
  }

  // Check emission sources
  if (!rewardSources || rewardSources.length === 0) {
    issues.push('No reward sources configured - no rewards will be distributed');
    actionItems.push('Admin must configure emission sources in the staking contract');
    actionItems.push('Set up reward token distribution mechanism');
  } else {
    status = 'partially_configured';
  }

  // Check subscribers
  if (!subscribers || subscribers.length === 0) {
    issues.push('No subscriber contracts - emission distribution may not work');
  }

  // Check if anyone has staked
  if (totalLocked === '0') {
    issues.push('No LP tokens staked yet - cannot verify emission rates');
    actionItems.push('Stake some LP tokens to test the emission system');
  }

  // Admin-specific issues
  if (admin) {
    actionItems.push(`Contact admin (${admin}) to configure emission sources`);
    actionItems.push('Request emission rate configuration and schedule');
  }

  // Determine final status
  if (rewardSources.length > 0 && !contractStatus?.contract_status?.is_stopped) {
    status = 'fully_configured';
  } else if (rewardSources.length > 0 || !contractStatus?.contract_status?.is_stopped) {
    status = 'partially_configured';
  }

  return {
    status,
    issues,
    actionItems,
    technicalDetails: {
      totalLocked,
      rewardSourcesCount: rewardSources.length,
      subscribersCount: subscribers.length,
      contractStopped: contractStatus?.contract_status?.is_stopped || false,
      admin,
      adminInvestigation,
      setupCheck,
    },
  };
}
