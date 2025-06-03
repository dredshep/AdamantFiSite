import { REWARD_CONTRACTS, STAKING_EMISSION_CONFIG } from '@/config/staking';
import { getRewardInfo } from '@/lib/keplr/incentives/getRewardInfo';
import { getRewards } from '@/lib/keplr/incentives/getRewards';
import { getStakedBalance } from '@/lib/keplr/incentives/getStakedBalance';
import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';
import { SecretNetworkClient } from 'secretjs';
import {
  discoverEmissionRates,
  investigateStakingContract,
  type ContractInvestigation,
} from './contractInvestigation';

export interface TestResult {
  testName: string;
  success: boolean;
  result?: unknown;
  error?: string;
  timestamp: string;
  duration: number;
}

export interface StakingTestSuiteResult {
  overallSuccess: boolean;
  contractInvestigation?: ContractInvestigation | undefined;
  emissionAnalysis?: unknown;
  adminValidation?: unknown;
  functionTests: TestResult[];
  configurationValidation: TestResult[];
  recommendations: string[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    criticalIssues: string[];
    actionItems: string[];
  };
}

/**
 * Comprehensive staking system test suite
 */
export async function runStakingTestSuite(
  secretjs: SecretNetworkClient,
  lpTokenAddress: string,
  userAddress?: string,
  viewingKey?: string
): Promise<StakingTestSuiteResult> {
  console.log('🧪 Starting comprehensive staking test suite...');

  const functionTests: TestResult[] = [];
  const configurationValidation: TestResult[] = [];
  const recommendations: string[] = [];
  const criticalIssues: string[] = [];
  const actionItems: string[] = [];

  let contractInvestigation: ContractInvestigation | undefined;
  let emissionAnalysis: unknown;
  let adminValidation: unknown;

  // Test 1: Configuration Validation
  await runTest(
    'Configuration Validation',
    () => {
      const stakingContract = getStakingContractInfo(lpTokenAddress);
      if (!stakingContract) {
        throw new Error('No staking contract configured for this LP token');
      }

      // Validate configuration matches expected values
      const expectedStakingAddress = REWARD_CONTRACTS.SSCRT_USDC_LP_STAKING;
      if (stakingContract.stakingAddress !== expectedStakingAddress) {
        criticalIssues.push(
          `Staking address mismatch: expected ${expectedStakingAddress}, got ${stakingContract.stakingAddress}`
        );
      }

      return {
        stakingContract,
        expectedStakingAddress,
        match: stakingContract.stakingAddress === expectedStakingAddress,
      };
    },
    configurationValidation
  );

  // Test 2: Contract Investigation
  await runTest(
    'Contract Investigation',
    async () => {
      const investigation = await investigateStakingContract(secretjs, lpTokenAddress);
      contractInvestigation = investigation;

      if (investigation.rewardSources.length === 0) {
        criticalIssues.push('No reward sources configured - rewards will not work');
        actionItems.push('Configure bulk distributor as reward source');
      }

      if (investigation.admin === 'Unknown') {
        criticalIssues.push('Cannot identify admin address');
      }

      return investigation;
    },
    functionTests
  );

  // Test 3: Emission Rate Discovery
  if (contractInvestigation) {
    await runTest(
      'Emission Rate Discovery',
      async () => {
        if (!contractInvestigation) {
          throw new Error('Contract investigation data is missing');
        }
        const analysis = await discoverEmissionRates(secretjs, contractInvestigation);
        emissionAnalysis = analysis;

        recommendations.push(...analysis.recommendations);

        return analysis;
      },
      functionTests
    );
  }

  // Test 4: Admin Wallet Validation
  if (contractInvestigation?.admin && contractInvestigation.admin !== 'Unknown') {
    await runTest(
      'Admin Wallet Validation',
      () => {
        const adminAddress = contractInvestigation!.admin;

        // Validate it's a proper Secret Network address format
        if (!adminAddress.startsWith('secret1') || adminAddress.length !== 45) {
          throw new Error(`Invalid admin address format: ${adminAddress}`);
        }

        // Note: Admin is a wallet address, not a contract
        recommendations.push(`✅ Admin wallet identified: ${adminAddress} (wallet, not contract)`);

        return {
          adminAddress,
          isWallet: true,
          format: 'valid',
        };
      },
      functionTests
    );
  }

  // Test 5: Basic Query Functions
  await runTest(
    'getRewardInfo Function',
    async () => {
      return await getRewardInfo({ secretjs, lpToken: lpTokenAddress });
    },
    functionTests
  );

  // Test 6: User-specific functions (if credentials provided)
  if (userAddress && viewingKey) {
    await runTest(
      'getRewards Function',
      async () => {
        return await getRewards({
          secretjs,
          lpToken: lpTokenAddress,
          address: userAddress,
          viewingKey,
        });
      },
      functionTests
    );

    await runTest(
      'getStakedBalance Function',
      async () => {
        return await getStakedBalance({
          secretjs,
          lpToken: lpTokenAddress,
          address: userAddress,
          viewingKey,
        });
      },
      functionTests
    );
  } else {
    recommendations.push('Provide userAddress and viewingKey to test user-specific functions');
  }

  // Test 7: Configuration Constants Validation
  await runTest(
    'Emission Configuration Validation',
    () => {
      const config = STAKING_EMISSION_CONFIG;

      if (config.REWARD_PER_BLOCK !== 20) {
        criticalIssues.push(
          `Expected REWARD_PER_BLOCK to be 20, got ${String(config.REWARD_PER_BLOCK)}`
        );
      }

      if (config.DECIMALS !== 6) {
        criticalIssues.push(`Expected DECIMALS to be 6, got ${String(config.DECIMALS)}`);
      }

      const expectedDailyRewards =
        (config.BLOCKS_PER_DAY * config.REWARD_PER_BLOCK) / Math.pow(10, config.DECIMALS);

      return {
        config,
        expectedDailyRewards,
        validation: {
          rewardPerBlock: config.REWARD_PER_BLOCK === 20,
          decimals: config.DECIMALS === 6,
          dailyRewards: expectedDailyRewards,
        },
      };
    },
    configurationValidation
  );

  // Test 8: Network Parameter Validation
  await runTest(
    'Network Parameter Validation',
    async () => {
      const latestBlock = await secretjs.query.tendermint.getLatestBlock({});
      const currentHeight = latestBlock.block?.header?.height;

      // Check if we can get block info
      if (!currentHeight) {
        throw new Error('Cannot get current block height');
      }

      return {
        currentHeight,
        blockTime: STAKING_EMISSION_CONFIG.BLOCK_TIME_SECONDS,
        estimatedBlocksPerDay: STAKING_EMISSION_CONFIG.BLOCKS_PER_DAY,
      };
    },
    configurationValidation
  );

  // Generate final recommendations
  if (criticalIssues.length === 0) {
    recommendations.push('✅ No critical configuration issues found');
  }

  if (functionTests.filter((t) => t.success).length === functionTests.length) {
    recommendations.push('✅ All function tests passed');
  }

  recommendations.push('💡 Test staking with actual LP tokens to verify end-to-end functionality');
  recommendations.push('🔍 Monitor contract state after staking to verify reward accumulation');

  // Calculate summary
  const allTests = [...functionTests, ...configurationValidation];
  const passedTests = allTests.filter((t) => t.success).length;
  const failedTests = allTests.length - passedTests;

  const result: StakingTestSuiteResult = {
    overallSuccess: criticalIssues.length === 0 && failedTests === 0,
    contractInvestigation,
    emissionAnalysis,
    adminValidation,
    functionTests,
    configurationValidation,
    recommendations,
    summary: {
      totalTests: allTests.length,
      passedTests,
      failedTests,
      criticalIssues,
      actionItems,
    },
  };

  console.log('🧪 Test suite completed:', result.summary);

  return result;

  // Helper function to run individual tests
  async function runTest(
    testName: string,
    testFunction: () => unknown,
    resultsArray: TestResult[]
  ): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`🧪 Running test: ${testName}`);
      const result = await Promise.resolve(testFunction());

      const testResult: TestResult = {
        testName,
        success: true,
        result,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };

      resultsArray.push(testResult);
      console.log(`✅ Test passed: ${testName}`);
    } catch (error) {
      const testResult: TestResult = {
        testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };

      resultsArray.push(testResult);
      console.log(`❌ Test failed: ${testName}`, error);
    }
  }
}

/**
 * Run a quick diagnostic check for immediate issues
 */
export async function runQuickDiagnostic(
  secretjs: SecretNetworkClient,
  lpTokenAddress: string
): Promise<{
  status: 'healthy' | 'issues' | 'critical';
  issues: string[];
  quickChecks: TestResult[];
}> {
  console.log('🔍 Running quick diagnostic...');

  const issues: string[] = [];
  const quickChecks: TestResult[] = [];

  // Quick check 1: Configuration exists
  const stakingContract = getStakingContractInfo(lpTokenAddress);
  if (!stakingContract) {
    issues.push('No staking configuration found');
    return { status: 'critical', issues, quickChecks };
  }

  // Quick check 2: Contract exists - use the correct method
  try {
    await secretjs.query.compute.contractInfo({
      contract_address: stakingContract.stakingAddress,
    });
    quickChecks.push({
      testName: 'Contract Exists',
      success: true,
      timestamp: new Date().toISOString(),
      duration: 0,
    });
  } catch (error) {
    issues.push('Staking contract not found on network');
    quickChecks.push({
      testName: 'Contract Exists',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration: 0,
    });
    return { status: 'critical', issues, quickChecks };
  }

  // Quick check 3: Basic query works
  try {
    await getRewardInfo({ secretjs, lpToken: lpTokenAddress });
    quickChecks.push({
      testName: 'Basic Query',
      success: true,
      timestamp: new Date().toISOString(),
      duration: 0,
    });
  } catch (error) {
    issues.push('Contract queries failing - contract may not be properly configured');
    quickChecks.push({
      testName: 'Basic Query',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration: 0,
    });
  }

  const status = issues.length === 0 ? 'healthy' : 'issues';

  return { status, issues, quickChecks };
}
