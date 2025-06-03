# 🧪 AdamantFi Staking Test Suite

Complete testing infrastructure for the AdamantFi staking rewards system.

## 🚀 Quick Start

### 1. Run Quick Diagnostic (Recommended First)

```bash
bun scripts/runStakingTests.ts --quick
```

This checks basic connectivity and configuration without requiring user credentials.

### 2. Run Full Test Suite

```bash
# Basic full test (no user-specific functions)
bun scripts/runStakingTests.ts --full

# With user credentials (tests reward claiming, etc.)
bun scripts/runStakingTests.ts --full --user="your_secret_address" --viewing-key="your_viewing_key"
```

### 3. Display Configuration

```bash
bun scripts/runStakingTests.ts --config
```

### 4. Show Help

```bash
bun scripts/runStakingTests.ts --help
```

## 📋 What Gets Tested

### Quick Diagnostic

- ✅ Configuration validation
- ✅ Contract exists on network
- ✅ Basic contract queries work
- ✅ Network connectivity

### Full Test Suite

- ✅ All quick diagnostic tests
- ✅ Contract investigation (reward sources, admin, etc.)
- ✅ Emission rate discovery
- ✅ Admin contract analysis
- ✅ All reward functions (`getRewardInfo`, `getRewards`, `getStakedBalance`)
- ✅ Configuration parameter validation
- ✅ Network parameter validation

## 🎯 Expected Results

### Before Contract Configuration

```
❌ Reward sources empty
❌ No emission data available
✅ Basic contract structure working
✅ Configuration valid
```

### After Contract Configuration

```
✅ Reward sources configured
✅ Emission rates discoverable
✅ Reward accumulation working
✅ All functions operational
```

## 🔧 Manual Testing (Alternative)

If you prefer to run tests manually from the console:

```typescript
// Import the test functions
import { runQuickTest, runCompleteTest } from '@/utils/testing/testRunner';

// Run quick diagnostic
await runQuickTest();

// Run full test suite
await runCompleteTest();

// With user credentials
await runCompleteTest('your_address', 'your_viewing_key');
```

## 📁 Test Files

- **`utils/testing/testRunner.ts`** - Main test runner
- **`utils/testing/stakingTestSuite.ts`** - Comprehensive test suite
- **`utils/testing/contractInvestigation.ts`** - Contract analysis tools
- **`utils/testing/adminInvestigation.ts`** - Admin contract investigation
- **`scripts/runStakingTests.ts`** - Executable script

## 🚨 Critical Issues to Watch For

1. **"Invalid type" errors** - Contract not configured for rewards yet
2. **Empty reward sources** - Admin needs to configure emission sources
3. **Network connectivity issues** - Check RPC endpoint
4. **Missing configuration** - Verify all contract addresses are correct

## 💡 Tips

- **Start with `--quick`** to verify basic setup
- **Contact admin** if reward sources are empty
- **Use real credentials** for complete testing of user functions
- **Check the full implementation guide** in `docs/STAKING_IMPLEMENTATION_GUIDE.md`

---

This test suite will help you quickly identify the current state of the staking system and guide the implementation process.
