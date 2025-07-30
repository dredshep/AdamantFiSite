# Viewing Key Error Messages - LP vs Staking Token Fix

## Problem Description

Currently, when users encounter viewing key errors on liquidity pool pages, the error messages are incorrectly suggesting to create staking token viewing keys instead of LP token viewing keys. This creates confusion and incorrect key setup.

### Current Behavior

- User has LP tokens but viewing key is missing/corrupted
- Error message suggests "create viewing key for staking pool"
- User creates staking token viewing key
- LP functionality still doesn't work because LP token needs its own viewing key

### Expected Behavior

- Error message should distinguish between LP token viewing keys and staking token viewing keys
- If LP token viewing key is missing/corrupted, suggest creating LP token viewing key
- Only suggest staking token viewing key creation when actually dealing with staking functionality

## Root Cause Analysis

The issue stems from the fact that:

1. LP tokens and staking tokens are different contracts with different viewing keys
2. The current error handling doesn't differentiate between these contexts
3. Error messages are generic and don't specify which token type needs the viewing key

## Scenarios to Handle

### 1. LP Token Viewing Key Missing

- **Context**: User is on liquidity pool page, has LP tokens
- **Current**: Shows "Viewing Key Error" + "Create New Key" (creates wrong key)
- **Should be**: "LP Token viewing key missing. Please set viewing key for [LP_TOKEN_SYMBOL]"

### 2. LP Token Viewing Key Corrupted

- **Context**: User has LP tokens, key exists but is corrupted in Keplr
- **Current**: Shows generic corruption message
- **Should be**: "LP Token viewing key is corrupted. Please go to Keplr, find [LP_TOKEN_SYMBOL], and click 'Set your viewing key'"

### 3. Staking Token Viewing Key Missing

- **Context**: User is on staking page, trying to stake/unstake
- **Current**: Might be working correctly (needs verification)
- **Should be**: "Staking pool viewing key missing. Please set viewing key for [STAKING_TOKEN_SYMBOL]"

## Implementation Tasks

### 1. Identify Error Message Components

- [ ] Find all components that display viewing key errors
- [ ] Locate the logic that determines when to show "Create New Key" vs other messages
- [ ] Map out the different contexts where viewing key errors can occur

### 2. Context Detection

- [ ] Add logic to detect whether error is for:
  - LP token viewing key
  - Staking token viewing key
  - Regular token viewing key
- [ ] Pass context information to error components

### 3. Message Customization

- [ ] Create specific error messages for each context
- [ ] Include token symbol/name in error messages for clarity
- [ ] Provide correct instructions for each scenario

### 4. Button Actions

- [ ] Ensure "Create New Key" button creates the correct type of viewing key
- [ ] For corrupted keys, provide instructions to manually fix in Keplr instead of auto-creation
- [ ] Consider adding direct links/instructions for Keplr navigation

### 5. Testing Scenarios

- [ ] Test with missing LP token viewing key
- [ ] Test with corrupted LP token viewing key
- [ ] Test with missing staking token viewing key
- [ ] Test with missing regular token viewing key
- [ ] Verify correct key types are created/suggested in each case

## Files Likely Involved

- Error toast/notification components
- Viewing key status components
- LP token balance fetching logic
- Staking token balance fetching logic
- Key creation utilities

## Success Criteria

1. ✅ Users see context-appropriate error messages
2. ✅ LP token errors suggest LP token viewing key creation
3. ✅ Staking token errors suggest staking token viewing key creation
4. ✅ Corrupted key errors provide Keplr manual fix instructions
5. ✅ "Create New Key" button creates the correct key type for the context
6. ✅ Error messages include specific token symbols for clarity

## Priority

**High** - This is causing user confusion and incorrect key setup, leading to functionality not working as expected.
