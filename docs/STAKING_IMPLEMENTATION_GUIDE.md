# AdamantFi Staking Rewards Implementation Guide

**Version**: 1.0  
**Date**: June 4, 2025  
**Status**: Ready for Implementation

## 🎯 Executive Summary

This document provides a complete specification and implementation guide for integrating bADMT staking rewards into the AdamantFi platform. The system involves LP token staking with bADMT token emissions, contract investigation tools, and comprehensive testing infrastructure.

## 📋 Current Situation Analysis

### What We Have ✅

- **Functional staking contracts** deployed on Secret Network
- **Basic staking UI** in `components/app/Pages/Pool/StakingForm/`
- **Core staking functions** for stake/unstake operations
- **LP tokens and staking infrastructure** fully operational
- **Centralized configuration** system in `@config/staking`

### What We Need 🔄

- **Reward distribution configuration** (admin must configure emission sources)
- **Real-time reward display** in the UI
- **Reward claiming functionality**
- **APR calculations** with live data
- **Historical rewards tracking**

### The Gap 🎯

The main issue is that **reward emission sources are not yet configured** by the contract admin. The contracts exist and work, but no rewards are being distributed until the admin configures the bulk distributor as a reward source.

## 🏗️ System Architecture

### Contract Structure

```
🔗 Staking Contract (secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev)
├── 📊 LP Token Staking/Unstaking ✅
├── 🎁 Reward Distribution (⏳ Needs Configuration)
├── 👑 Admin (secret1kh0x34l6z66zty6j0cafn0j3fgs20aytulew52)
└── 📡 Reward Sources (❌ Not Configured Yet)

🏭 Bulk Distributor (secret1s563hkkrzjzx9q8qcx3r47h7s0hn5kfgy9t62r)
├── 💰 bADMT Emissions: 20 units/block
├── ⏰ Block Time: ~6 seconds
└── 📈 Daily Emissions: ~288 bADMT (0.000288 with 6 decimals)
```

### Emission Configuration

```typescript
// Current emission parameters in @config/staking
REWARD_PER_BLOCK: 20,           // Raw bADMT units per block
DECIMALS: 6,                    // bADMT token decimals
BLOCKS_PER_DAY: 14400,         // Based on ~6 second block time
BLOCK_TIME_SECONDS: 6,         // Secret Network block time

// Calculated daily emissions
Daily bADMT = (14400 blocks × 20 units) / 10^6 = 0.288 bADMT
Annual bADMT = 0.288 × 365 = 105.12 bADMT
```

## 🔧 Technical Implementation Plan

### Phase 1: Contract Configuration (CRITICAL - Blocks Everything)

**Immediate Action Required**: The contract admin must configure emission sources.

**Admin Tasks:**

1. **Add Bulk Distributor** as reward source to staking contract
2. **Configure emission rates** in the bulk distributor
3. **Verify emission flow** from bulk distributor to staking contract

**Verification Commands:**

```bash
# Check current reward sources (should show bulk distributor)
secretcli query compute query secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev '{"reward_sources":{}}'

# Check total locked LP tokens
secretcli query compute query secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev '{"total_locked":{}}'

# Check admin address
secretcli query compute query secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev '{"admin":{}}'
```

### Phase 2: Backend Integration

#### 2.1 Enhanced Reward Info Function

**File**: `lib/keplr/incentives/getRewardInfo.ts`

**Status**: ✅ Updated with centralized config

**Key Features:**

- Uses `@config/staking` for emission parameters
- Calculates estimated APR based on total locked LP tokens
- Real-time emission rate calculations

#### 2.2 User Reward Functions

**Files**:

- `lib/keplr/incentives/getRewards.ts` ✅
- `lib/keplr/incentives/claimRewards.ts` ✅
- `lib/keplr/incentives/getStakedBalance.ts` ✅

**Enhancement Needed**: Add error handling for unconfigured rewards.

#### 2.3 New Investigation Functions

**Files** (✅ Created):

- `utils/testing/contractInvestigation.ts` - Contract state analysis
- `utils/testing/adminInvestigation.ts` - Admin contract investigation
- `utils/testing/stakingTestSuite.ts` - Comprehensive testing
- `utils/testing/testRunner.ts` - Executable test runner

### Phase 3: Frontend Integration

#### 3.1 Staking Overview Enhancement

**File**: `components/app/Pages/Pool/StakingForm/StakingOverview.tsx`

**Required Changes**:

```typescript
import { getRewardInfo } from '@/lib/keplr/incentives/getRewardInfo';
import { getRewards } from '@/lib/keplr/incentives/getRewards';

// Add real-time reward display
const [rewardInfo, setRewardInfo] = useState(null);
const [userRewards, setUserRewards] = useState('0');

// Fetch reward data on component mount and interval
useEffect(() => {
  const fetchRewards = async () => {
    try {
      const info = await getRewardInfo({ secretjs, lpToken });
      setRewardInfo(info);

      if (address && viewingKey) {
        const rewards = await getRewards({ secretjs, lpToken, address, viewingKey });
        setUserRewards(rewards.rewards.amount);
      }
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
    }
  };

  fetchRewards();
  const interval = setInterval(fetchRewards, 30000); // Update every 30s
  return () => clearInterval(interval);
}, [secretjs, lpToken, address, viewingKey]);
```

#### 3.2 Reward Claiming UI

**New Component**: `components/app/Pages/Pool/StakingForm/RewardsClaiming.tsx`

**Features**:

- Display claimable rewards
- Claim button with transaction handling
- Reward history (if available)
- APR display with real-time updates

#### 3.3 Staking Pool Selector Enhancement

**File**: `components/app/Pages/Pool/StakingForm/StakingPoolSelector.tsx`

**Enhancement**: Display APR for each pool in the selector.

### Phase 4: Testing Infrastructure

#### 4.1 Comprehensive Test Suite (✅ Created)

**Primary Test File**: `utils/testing/testRunner.ts`

**Test Commands**:

```typescript
// Quick diagnostic (no user credentials needed)
import { runQuickTest } from '@/utils/testing/testRunner';
await runQuickTest();

// Full test suite
import { runCompleteTest } from '@/utils/testing/testRunner';
await runCompleteTest();

// With user credentials for reward testing
await runCompleteTest('your_secret_address', 'your_viewing_key');
```

#### 4.2 Test Categories

1. **Configuration Validation** ✅

   - Verify contract addresses and code hashes
   - Validate emission parameters
   - Check network connectivity

2. **Contract Investigation** ✅

   - Query all contract states
   - Discover reward sources
   - Analyze emission configuration

3. **Function Testing** ✅

   - Test all reward-related functions
   - Verify staking operations
   - Check error handling

4. **Admin Investigation** ✅
   - Analyze admin contract capabilities
   - Check emission control functions
   - Generate setup recommendations

## 📊 Contract State Analysis

### Current Contract Status

**Verified Information** ✅:

- **Contract Address**: `secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev`
- **Code Hash**: `c644edd309de7fd865b4fbe22054bcbe85a6c0b8abf5f110053fe1b2d0e8a72a`
- **Code ID**: `2276`
- **Admin**: `secret1kh0x34l6z66zty6j0cafn0j3fgs20aytulew52`
- **Label**: "AdamantFi sscrt-usdc.nbl staking"

**Expected Bulk Distributor**: `secret1s563hkkrzjzx9q8qcx3r47h7s0hn5kfgy9t62r`

### Critical Issue ⚠️

**Problem**: Contract queries return "Invalid type" errors, suggesting:

1. Reward sources are not configured yet
2. Contract is not fully initialized for reward distribution
3. Bulk distributor needs to be connected

## 🚀 Implementation Timeline

### Immediate (Today)

1. **✅ Configuration centralized** in `@config/staking`
2. **✅ Testing infrastructure created**
3. **📋 Run test suite** to verify current state

### Short Term (1-2 days)

1. **🔧 Admin configures emission sources** (CRITICAL)
2. **🔄 Verify reward distribution** is working
3. **🎨 Implement UI enhancements** for reward display

### Medium Term (3-5 days)

1. **✨ Complete reward claiming functionality**
2. **📈 Add historical reward tracking**
3. **🎯 Implement APR calculations with real pricing**

### Long Term (1-2 weeks)

1. **📊 Add analytics and metrics**
2. **🔍 Monitor emission rates and adjust if needed**
3. **⚡ Optimize performance and user experience**

## 🧪 Testing Instructions

### Quick Start Testing

1. **Import the test runner**:

```typescript
import { runQuickTest, runCompleteTest } from '@/utils/testing/testRunner';
```

2. **Run quick diagnostic**:

```typescript
await runQuickTest(); // No credentials needed
```

3. **Run full test suite**:

```typescript
await runCompleteTest(); // Basic tests
await runCompleteTest('user_address', 'viewing_key'); // With user functions
```

### Expected Test Results

**Before Admin Configuration**:

- ❌ Reward sources empty
- ❌ No emission data available
- ✅ Basic contract structure working
- ✅ Configuration valid

**After Admin Configuration**:

- ✅ Reward sources configured
- ✅ Emission rates discoverable
- ✅ Reward accumulation working
- ✅ All functions operational

## 📝 Key Files and Locations

### Configuration Files

- **`config/staking.ts`** ✅ - Central emission configuration
- **`config/tokens.ts`** ✅ - LP token and contract mappings

### Core Functions

- **`lib/keplr/incentives/getRewardInfo.ts`** ✅ - Reward rate calculations
- **`lib/keplr/incentives/getRewards.ts`** ✅ - User reward queries
- **`lib/keplr/incentives/claimRewards.ts`** ✅ - Reward claiming
- **`lib/keplr/incentives/getStakedBalance.ts`** ✅ - Staked balance queries

### UI Components

- **`components/app/Pages/Pool/StakingForm/StakingOverview.tsx`** 🔄 - Needs reward display
- **`components/app/Pages/Pool/StakingForm/StakingPoolSelector.tsx`** 🔄 - Needs APR display
- **`components/app/Pages/Pool/StakingForm/StakingActions.tsx`** 🔄 - Needs claim button

### Testing Infrastructure ✅

- **`utils/testing/contractInvestigation.ts`** - Contract analysis
- **`utils/testing/adminInvestigation.ts`** - Admin investigation
- **`utils/testing/stakingTestSuite.ts`** - Comprehensive tests
- **`utils/testing/testRunner.ts`** - Main test runner

### Registry and Utils

- **`utils/staking/stakingRegistry.ts`** ✅ - Updated for new config
- **`types/secretswap/lp-staking.ts`** ✅ - Type definitions

## 🎯 Success Criteria

### Phase 1 Success (Contract Configuration)

- [ ] Reward sources show bulk distributor in queries
- [ ] Contract stops returning "Invalid type" errors
- [ ] Emission rates discoverable through contract queries

### Phase 2 Success (Backend Integration)

- [ ] `getRewardInfo()` returns real emission data
- [ ] `getRewards()` returns actual user rewards
- [ ] APR calculations work with real data

### Phase 3 Success (Frontend Integration)

- [ ] UI displays real-time reward information
- [ ] Users can claim rewards successfully
- [ ] APR shown in staking interface

### Phase 4 Success (Complete System)

- [ ] All tests pass in test suite
- [ ] End-to-end staking and reward claiming works
- [ ] System is production-ready

## 🚨 Critical Dependencies

1. **Admin Contract Configuration** (BLOCKS EVERYTHING)

   - Admin must add bulk distributor as reward source
   - Without this, no rewards will be distributed

2. **Network Connectivity**

   - Secret Network RPC access required
   - Test with: `https://lcd.secret.express`

3. **User Credentials for Full Testing**
   - Secret address with LP tokens
   - Viewing key for staking contract
   - Some staked LP tokens for reward testing

## 💡 Recommendations for Blockchain Developer

### Immediate Actions

1. **Run the test suite first** to understand current state
2. **Contact admin** (`secret1kh0x34l6z66zty6j0cafn0j3fgs20aytulew52`) for emission configuration
3. **Verify bulk distributor** contract is actually emitting rewards

### Implementation Priority

1. **Fix contract configuration** (highest priority)
2. **Implement UI reward display** (user-visible impact)
3. **Add reward claiming** (core functionality)
4. **Optimize and polish** (performance and UX)

### Long-term Considerations

- **Pricing API integration** for accurate APR calculations
- **Historical data storage** for reward tracking
- **Multiple pool support** if expanding beyond sSCRT/USDC.nbl
- **Emergency admin functions** for pausing/resuming rewards

---

This implementation guide provides everything needed to complete the staking rewards integration. The test suite will reveal the exact current state and guide the implementation process.
