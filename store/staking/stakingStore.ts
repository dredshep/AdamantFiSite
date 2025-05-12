import { StakingInputState } from '@/types/staking';
import { create } from 'zustand';

/**
 * Store for staking functionality, handling the staking form inputs
 * and the auto-stake preference.
 */
interface StakingStore {
  // Form inputs for staking operations
  stakingInputs: {
    stakeAmount: StakingInputState;
    unstakeAmount: StakingInputState;
  };

  // User preference for auto-staking after providing liquidity
  autoStake: boolean;

  // Action to set amount for stake or unstake operations
  setStakingInputAmount: (field: 'stakeAmount' | 'unstakeAmount', amount: string) => void;

  // Action to toggle or set auto-stake preference
  setAutoStake: (value: boolean) => void;

  // Action to reset staking inputs to default state
  resetStakingInputs: () => void;
}

/**
 * Default state for any input field
 */
const defaultInputState: StakingInputState = {
  amount: '',
};

/**
 * Zustand store implementation for staking state
 */
export const useStakingStore = create<StakingStore>((set) => ({
  // Initial state for inputs
  stakingInputs: {
    stakeAmount: defaultInputState,
    unstakeAmount: defaultInputState,
  },

  // Default to not auto-stake
  autoStake: false,

  // Action to update a specific input amount
  setStakingInputAmount: (field, amount) =>
    set((state) => ({
      stakingInputs: {
        ...state.stakingInputs,
        [field]: { amount },
      },
    })),

  // Action to set the auto-stake preference
  setAutoStake: (value) => set({ autoStake: value }),

  // Action to reset inputs to default values
  resetStakingInputs: () =>
    set({
      stakingInputs: {
        stakeAmount: defaultInputState,
        unstakeAmount: defaultInputState,
      },
    }),
}));
