# Staking Integration Files

This document provides an overview of all files created or modified for the staking integration feature.

## Types and Utilities

- **types/staking.ts**

  - Type definitions for staking-related interfaces
  - Includes interfaces for operations, component props, and state

- **utils/staking/convertStakingAmount.ts**
  - Utilities for converting between human-readable and contract amounts
  - Handles decimals for LP tokens and validates amounts

## State Management

- **store/staking/stakingStore.ts**
  - Zustand store for staking state management
  - Handles form inputs and auto-stake preference

## Hooks

- **hooks/usePoolStaking.ts**
  - Dedicated hook for pool-specific staking operations
  - Encapsulates staking logic and integrates with `useStaking`
  - Handles viewing key management and balance refreshing

## UI Components

- **components/common/ViewingKeyStatus.tsx**

  - Reusable component for viewing key status and setup instructions
  - Shows different states: none, pending, created, error

- **components/app/Pages/Pool/StakingForm/index.tsx**

  - Main container component for the staking tab
  - Handles conditional rendering based on staking availability
  - Coordinates all staking components and operations

- **components/app/Pages/Pool/StakingForm/StakingOverview.tsx**

  - Displays staked amount, pending rewards, and staking position
  - Shows loading states and empty state for no staking

- **components/app/Pages/Pool/StakingForm/StakingInput.tsx**

  - Input component for stake/unstake amounts
  - Includes balance display and max button
  - Validates input against available balance

- **components/app/Pages/Pool/StakingForm/StakingActions.tsx**

  - Contains buttons for stake, unstake, and claim operations
  - Handles disabled states and loading indicators

- **components/app/Pages/Pool/DepositForm/AutoStakeOption.tsx**
  - Checkbox component for auto-staking preference
  - Integrates with deposit flow for seamless staking

## Integration

This staking integration builds on the existing incentives module in `lib/keplr/incentives/`. It uses the staking registry to determine if pools have associated staking contracts and provides a complete UI flow for users to:

1. Set up viewing keys (if needed)
2. View staked balances and pending rewards
3. Stake LP tokens
4. Unstake LP tokens
5. Claim rewards
6. Auto-stake LP tokens when providing liquidity

The integration follows a modular design pattern with clear separation of concerns between:

- State management (Zustand store)
- Logic (usePoolStaking hook)
- UI components (StakingForm and its children)

This approach makes the code maintainable, testable, and flexible for future enhancements.
