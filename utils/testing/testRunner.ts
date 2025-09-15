import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { getSecretNetworkEnvVars } from '@/utils/env';
import { SecretNetworkClient } from 'secretjs';
import { runQuickDiagnostic, runStakingTestSuite } from './stakingTestSuite';

/**
 * Main test runner script that can be executed to test the staking system
 */

// Get environment variables
const envVars = getSecretNetworkEnvVars();

// Configuration for testing
export const TEST_CONFIG = {
  // The sSCRT/USDC.nbl LP token address
  LP_TOKEN_ADDRESS: 'secret18xd8j88jrwzagnv09cegv0fm3aca6d3qlfem6v',

  // Secret Network RPC endpoint - using environment variables
  RPC_ENDPOINT: envVars.RPC_URL,

  // Chain ID - using environment variables
  CHAIN_ID: envVars.CHAIN_ID,

  // Optional user credentials for testing user-specific functions
  // These would need to be provided when running the test
  USER_ADDRESS: '', // Will be set when running
  VIEWING_KEY: '', // Will be set when running
};

/**
 * Initialize SecretNetworkClient for testing
 */
export async function initializeClient(): Promise<SecretNetworkClient> {
  try {
    const client = new SecretNetworkClient({
      url: TEST_CONFIG.RPC_ENDPOINT,
      chainId: TEST_CONFIG.CHAIN_ID,
    });

    // Test connection
    const latestBlock = await client.query.tendermint.getLatestBlock({});
    console.log('✅ Connected to Secret Network:', {
      chainId: TEST_CONFIG.CHAIN_ID,
      latestBlock: latestBlock.block?.header?.height,
    });

    return client;
  } catch (error) {
    console.error('❌ Failed to connect to Secret Network:', error);
    throw error;
  }
}

/**
 * Run the complete test suite
 */
export async function runCompleteTest(userAddress?: string, viewingKey?: string): Promise<void> {
  console.log('🚀 Starting AdamantFi Staking System Test Suite');
  console.log('================================================');

  try {
    // Initialize client
    const secretjs = await initializeClient();

    // Run quick diagnostic first
    console.log('\n🔍 Phase 1: Quick Diagnostic');
    console.log('-----------------------------');

    const diagnostic = await runQuickDiagnostic(secretjs, TEST_CONFIG.LP_TOKEN_ADDRESS);

    console.log('Diagnostic Status:', diagnostic.status);
    if (diagnostic.issues.length > 0) {
      console.log('Issues found:');
      diagnostic.issues.forEach((issue) => console.log(`  ❌ ${issue}`));
    }

    if (diagnostic.status === 'critical') {
      console.log('\n🛑 Critical issues detected. Aborting full test suite.');
      return;
    }

    // Run comprehensive test suite
    console.log('\n🧪 Phase 2: Comprehensive Test Suite');
    console.log('------------------------------------');

    const testResults = await runStakingTestSuite(
      secretjs,
      TEST_CONFIG.LP_TOKEN_ADDRESS,
      userAddress,
      viewingKey
    );

    // Display results
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`Overall Success: ${testResults.overallSuccess ? '✅' : '❌'}`);
    console.log(`Total Tests: ${testResults.summary.totalTests}`);
    console.log(`Passed: ${testResults.summary.passedTests}`);
    console.log(`Failed: ${testResults.summary.failedTests}`);

    if (testResults.summary.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      testResults.summary.criticalIssues.forEach((issue) => console.log(`  ❌ ${issue}`));
    }

    if (testResults.summary.actionItems.length > 0) {
      console.log('\n📝 Action Items:');
      testResults.summary.actionItems.forEach((item) => console.log(`  📋 ${item}`));
    }

    console.log('\n💡 Recommendations:');
    testResults.recommendations.forEach((rec) => console.log(`  💡 ${rec}`));

    // Display individual test results
    console.log('\n📋 Individual Test Results:');
    console.log('============================');

    console.log('\n🔧 Function Tests:');
    testResults.functionTests.forEach((test) => {
      console.log(`  ${test.success ? '✅' : '❌'} ${test.testName} (${test.duration}ms)`);
      if (!test.success && test.error) {
        console.log(`    Error: ${test.error}`);
      }
    });

    console.log('\n⚙️ Configuration Tests:');
    testResults.configurationValidation.forEach((test) => {
      console.log(`  ${test.success ? '✅' : '❌'} ${test.testName} (${test.duration}ms)`);
      if (!test.success && test.error) {
        console.log(`    Error: ${test.error}`);
      }
    });

    // Save results to file for review
    // const resultsJson = JSON.stringify(testResults, null, 2);
    console.log('\n💾 Test results not saved. Copy this output for review.');
  } catch (error) {
    console.error('💥 Test suite failed with error:', error);
    throw error;
  }
}

/**
 * Run only the quick diagnostic
 */
export async function runQuickTest(): Promise<void> {
  console.log('🔍 Running Quick Diagnostic Only');
  console.log('=================================');

  try {
    const secretjs = await initializeClient();
    const diagnostic = await runQuickDiagnostic(secretjs, TEST_CONFIG.LP_TOKEN_ADDRESS);

    console.log('\n📊 Quick Diagnostic Results:');
    console.log(`Status: ${diagnostic.status}`);

    if (diagnostic.issues.length > 0) {
      console.log('\nIssues:');
      diagnostic.issues.forEach((issue) => console.log(`  ❌ ${issue}`));
    } else {
      console.log('✅ No issues detected in quick diagnostic');
    }

    console.log('\nQuick Checks:');
    diagnostic.quickChecks.forEach((check) => {
      console.log(`  ${check.success ? '✅' : '❌'} ${check.testName}`);
      if (!check.success && check.error) {
        console.log(`    Error: ${check.error}`);
      }
    });
  } catch (error) {
    console.error('❌ Quick diagnostic failed:', error);
    throw error;
  }
}

/**
 * Display configuration information
 */
export function displayConfiguration(): void {
  console.log('⚙️ Test Configuration');
  console.log('=====================');
  console.log(`LP Token Address: ${TEST_CONFIG.LP_TOKEN_ADDRESS}`);
  console.log(`RPC Endpoint: ${TEST_CONFIG.RPC_ENDPOINT}`);
  console.log(`Chain ID: ${TEST_CONFIG.CHAIN_ID}`);

  console.log('\n📋 Available LP Pairs:');
  LIQUIDITY_PAIRS.forEach((pair) => {
    console.log(`  ${pair.symbol}: ${pair.lpToken}`);
    if (pair.lpToken === TEST_CONFIG.LP_TOKEN_ADDRESS) {
      console.log(`    ⭐ This is the pair being tested`);
    }
  });
}

/**
 * Instructions for running the tests
 */
export function displayInstructions(): void {
  console.log('📖 How to Run Tests');
  console.log('===================');
  console.log('');
  console.log('1. Quick Diagnostic (no credentials needed):');
  console.log('   runQuickTest()');
  console.log('');
  console.log('2. Full Test Suite (basic):');
  console.log('   runCompleteTest()');
  console.log('');
  console.log('3. Full Test Suite with user functions:');
  console.log('   runCompleteTest("your_address", "your_viewing_key")');
  console.log('');
  console.log('4. Display configuration:');
  console.log('   displayConfiguration()');
  console.log('');
  console.log('💡 Tip: Start with runQuickTest() to check basic connectivity');
  console.log('💡 Tip: For full testing, you need LP tokens and viewing keys');
}

// For immediate execution when imported
if (typeof window === 'undefined') {
  // Only show instructions in Node.js environment
  console.log('🧪 AdamantFi Staking Test Suite Loaded');
  console.log('=====================================');
  displayInstructions();
}
