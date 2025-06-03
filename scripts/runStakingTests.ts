#!/usr/bin/env bun

/**
 * Executable script to run AdamantFi staking system tests
 *
 * Usage:
 * bun scripts/runStakingTests.ts --quick
 * bun scripts/runStakingTests.ts --full
 * bun scripts/runStakingTests.ts --full --user="your_address" --viewing-key="your_key"
 */

import {
  displayConfiguration,
  displayInstructions,
  runCompleteTest,
  runQuickTest,
} from '../utils/testing/testRunner';

async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const flags = {
    quick: args.includes('--quick'),
    full: args.includes('--full'),
    help: args.includes('--help') || args.includes('-h'),
    config: args.includes('--config'),
    user: args.find((arg) => arg.startsWith('--user='))?.split('=')[1],
    viewingKey: args.find((arg) => arg.startsWith('--viewing-key='))?.split('=')[1],
  };

  console.log('🧪 AdamantFi Staking Test Suite');
  console.log('================================');

  if (flags.help) {
    displayInstructions();
    return;
  }

  if (flags.config) {
    displayConfiguration();
    return;
  }

  if (flags.quick) {
    console.log('🔍 Running Quick Diagnostic...');
    try {
      await runQuickTest();
      console.log('\n✅ Quick diagnostic completed successfully!');
    } catch (error) {
      console.error('\n❌ Quick diagnostic failed:', error);
      process.exit(1);
    }
    return;
  }

  if (flags.full) {
    console.log('🧪 Running Full Test Suite...');
    try {
      await runCompleteTest(flags.user, flags.viewingKey);
      console.log('\n✅ Full test suite completed!');
    } catch (error) {
      console.error('\n❌ Full test suite failed:', error);
      process.exit(1);
    }
    return;
  }

  // Default: show help
  console.log('No test type specified. Use --quick or --full');
  console.log('Use --help for detailed instructions');
  displayInstructions();
}

// Run the script
main().catch((error) => {
  console.error('💥 Script execution failed:', error);
  process.exit(1);
});
