import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// User-modifiable action behaviors (what each action can do)
export enum PoolBehavior {
  FILL1 = 'fill1', // Fill only first field
  FILL2 = 'fill2', // Fill both fields
  GO = 'go', // Fill and execute
}

export enum ActionBehavior {
  FILL = 'fill', // Fill form only
  GO = 'go', // Fill and execute
}

// Backend-controlled visibility toggles
export enum ToggleState {
  FORCE_OFF = 'forceOff', // Always disabled
  ON = 'on', // User can enable/disable (default on)
  OFF = 'off', // User can enable/disable (default off)
}

export interface SmartSearchSettingsStore {
  // User-modifiable settings (what user prefers each action to do)
  poolValues: PoolBehavior; // defaults to fill1
  swapValues: ActionBehavior; // defaults to fill
  stakeValues: ActionBehavior; // defaults to fill
  unstakeValues: ActionBehavior; // defaults to fill
  withdrawValues: ActionBehavior; // defaults to fill

  // Backend-controlled toggles (what actions are available)
  poolActions: ToggleState; // Controls: Deposit/Withdraw
  swapActions: ToggleState; // Controls: Swap
  stakeActions: ToggleState; // Controls: Stake/Unstake
  withdrawActions: ToggleState; // Controls: Withdraw
  claimActions: ToggleState; // Controls: Claim
  sendActions: ToggleState; // Controls: Send
  receiveActions: ToggleState; // Controls: Receive/Copy Address

  // Actions
  setPoolBehavior: (behavior: PoolBehavior) => void;
  setActionBehavior: (
    action: 'swapValues' | 'stakeValues' | 'unstakeValues' | 'withdrawValues',
    behavior: ActionBehavior
  ) => void;
  setToggle: (
    toggle:
      | 'poolActions'
      | 'swapActions'
      | 'stakeActions'
      | 'withdrawActions'
      | 'claimActions'
      | 'sendActions'
      | 'receiveActions',
    state: ToggleState
  ) => void;
}

/*
Schema Documentation:

USER-MODIFIABLE (what each action does when triggered):
- poolValues: fill1 | fill2 | go (default: fill1)
- swapValues: fill | go (default: fill)  
- stakeValues: fill | go (default: fill)
- unstakeValues: fill | go (default: fill)
- withdrawValues: fill | go (default: fill)

BACKEND-CONTROLLED (what actions are visible/available):
- poolActions: forceOff | on | off → Controls Deposit/Withdraw
- swapActions: forceOff | on | off → Controls Swap
- stakeActions: forceOff | on | off → Controls Stake/Unstake  
- withdrawActions: forceOff | on | off → Controls Withdraw
- claimActions: forceOff | on | off → Controls Claim
- sendActions: forceOff | on | off → Controls Send
- receiveActions: forceOff | on | off → Controls Receive/Copy Address
*/

export const useSmartSearchSettingsStore = create<SmartSearchSettingsStore>()(
  persist(
    (set) => ({
      // User preferences (defaults per schema)
      poolValues: PoolBehavior.FILL1,
      swapValues: ActionBehavior.FILL,
      stakeValues: ActionBehavior.FILL,
      unstakeValues: ActionBehavior.FILL,
      withdrawValues: ActionBehavior.FILL,

      // Backend toggles (default all on)
      poolActions: ToggleState.ON,
      swapActions: ToggleState.ON,
      stakeActions: ToggleState.ON,
      withdrawActions: ToggleState.ON,
      claimActions: ToggleState.ON,
      sendActions: ToggleState.ON,
      receiveActions: ToggleState.ON,

      // Actions
      setPoolBehavior: (behavior) => set({ poolValues: behavior }),
      setActionBehavior: (action, behavior) => set({ [action]: behavior }),
      setToggle: (toggle, state) => set({ [toggle]: state }),
    }),
    {
      name: 'smart-search-settings-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// example usage:

// const { poolValues, swapValues, stakeValues, unstakeValues, withdrawValues, poolActions, swapActions, stakeActions, withdrawActions, claimActions, sendActions, receiveActions } = useSmartSearchSettingsStore();
// poolValues = PoolBehavior.FILL1;
// <button onClick={() => setPoolBehavior(PoolBehavior.FILL2)}>Fill 2</button>
