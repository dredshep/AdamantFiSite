## Integration Points for Staking/Unstaking LP Tokens

1. **New Utility Functions Needed:**

   - `stakeLP.ts` - Similar to `provideLiquidity.ts` and `withdrawLiquidity.ts`
   - `unstakeLP.ts` - To allow users to withdraw their staked LP tokens
   - `getStakedBalance.ts` - To query a user's staked LP tokens
   - `getRewards.ts` - To query accrued ADFI rewards
   - `claimRewards.ts` - To claim ADFI rewards

2. **Updates to `usePoolForm.ts`:**

   - Add `stakingContractAddress` and `stakingCodeHash` parameters
   - Add new actions to `handleClick`: 'stake' and 'unstake'
   - Implement `handleStakeClick` and `handleUnstakeClick` functions
   - Add state for tracking staked LP token balances and earned rewards
   - Modify interface to expose staking-related data

3. **Updates to `DepositForm` and `WithdrawForm`:**

   - Add UI elements to show staking APR
   - Add checkboxes or toggles to auto-stake LP tokens after deposit
   - Create UI elements to display staked LP tokens and earned rewards
   - Add buttons for claiming rewards

4. **New Component Needed:**
   - `StakingForm` component to handle the direct staking of existing LP tokens
   - `StakingPositions` component to display user's current staking positions

## Implementation Questions

1. **Incentives Contract Details:**

   - What is the contract address and code hash for the staking/incentives contract?
   - What's the exact message structure for staking and unstaking LP tokens?
   - How are rewards calculated and distributed? Is it per-block rewards?

2. **UI/UX Considerations:**

   - Should staking be a separate tab or integrated into the existing deposit/withdraw forms?
   - Should we auto-stake LP tokens by default when providing liquidity?
   - Do we need a dedicated page to view staking positions and rewards?

3. **Technical Questions:**

   - How will we track APR for different pools? Is this data available from an API?
   - Will the incentives contract require viewing keys for viewing staked balances?
   - Is there a minimum staking period or any locking mechanism?
   - Are there penalties for early unstaking?

4. **Security Considerations:**
   - Will the staking contract have been audited?
   - How will we handle transaction failures during staking/unstaking?

## Proposed Implementation Strategy

1. **Phase 1: Backend Integration**

   - Create utility functions to interact with the incentives contract
   - Update types to include staking-related data

2. **Phase 2: Hook Integration**

   - Extend `usePoolForm` to handle staking/unstaking operations
   - Add state management for staking positions and rewards

3. **Phase 3: UI Integration**

   - Add UI elements to display staking options, APR, and rewards
   - Implement forms for manual LP staking/unstaking
   - Create a dashboard for viewing staking positions

4. **Phase 4: Testing and Optimization**
   - Test all flows thoroughly
   - Optimize gas usage and transaction handling

Do you need any specific implementation details for any of these components, or would you like me to elaborate on any particular aspect of the integration?
