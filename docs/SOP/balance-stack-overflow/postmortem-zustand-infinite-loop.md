# Postmortem: The "Maximum Update Depth Exceeded" Infinite Loop

**Date:** July 5, 2024
**Status:** Resolved
**Author:** Gemini

## 1. Summary

A critical "Maximum update depth exceeded" React error was crashing the `/pools` page, caused by an infinite re-render loop. The root cause was traced to an unstable selector function being used in a Zustand store subscription within the `useMultipleTokenBalances` hook. The issue was resolved by refactoring the subscription pattern to select a larger, stable part of the state and then creating the desired data slice inside a `useMemo`.

## 2. The Problem

The `/pools` page, which relies on the `useMultiplePoolBalances` hook, would not render. React would halt the application with a "Maximum update depth exceeded" error, indicating a component was caught in a state-update -> re-render -> state-update cycle.

## 3. Investigation & The "Smoking Gun"

The investigation followed a methodical process of elimination, as the initial, obvious fixes (stabilizing default objects and retry functions) did not solve the problem.

- **Initial Tests (Failed):** Isolating LP balance data, staked balance data, and returned functions within `useMultiplePoolBalances` did not stop the loop. This indicated the problem was deeper.
- **Isolating the Parent (Failed):** We confirmed the page (`pages/pools/index.tsx`) was passing stable props to the hook by memoizing the `stakingPools` array. The loop persisted.
- **The Breakthrough (Test I):** A test that completely disabled the `useMultipleTokenBalances` hook and replaced its output with a static empty object (`const lpBalances = {}`) **successfully stopped the loop.** This was the smoking gun, proving the infinite re-render was being triggered from within `useMultipleTokenBalances`.
- **Pinpointing the Cause:** Further tests within `useMultipleTokenBalances` confirmed the loop was not caused by its `useEffect` or its return value, but by the **act of subscribing to the Zustand store itself.**

## 4. Root Cause Analysis: The Unstable Selector

The core of the problem was this pattern inside `useMultipleTokenBalances`:

```typescript
// The failing pattern in hooks/useTokenBalance.tsx

// 1. This selector function is re-created on every single render.
const balanceStates = useBalanceFetcherStore((state) => {
  // 2. It creates and returns a NEW object reference on every execution.
  const states: Record<string, BalanceState> = {};
  validAddresses.forEach((address) => {
    states[address] = state.balances[address] ?? DEFAULT_BALANCE_STATE;
  });
  return states;
});
```

This created a "perfect storm" for an infinite loop:

1.  On every render, a **new selector function** was created.
2.  This new function was passed to `useBalanceFetcherStore`.
3.  The function executed and returned a **new `states` object reference**.
4.  Zustand's default strict equality check (`===`) saw this new object reference and concluded that the state had changed, even if the underlying data was identical.
5.  This state change notification triggered a re-render in the component.
6.  The re-render started the cycle over again from step 1.

Attempts to use the standard Zustand fix (`shallow` equality) failed due to environmental constraints (the linter rejected it as an invalid argument).

## 5. The Solution: Inverting the Pattern

The definitive solution was to refactor the subscription pattern to make it inherently stable.

**File:** `hooks/useTokenBalance.tsx`
**Function:** `useMultipleTokenBalances`

### The Fix (Magnified)

Instead of selecting a dynamic slice of state, we changed the strategy:

1.  **Subscribe to a Larger, Stable State:** We changed the subscription to select the _entire_ `balances` object from the store. The selector for this is simple and stable (`state => state.balances`).

    ```typescript
    // hooks/useTokenBalance.tsx

    // SUBSCRIBE to the entire balances object. This is stable.
    const allBalances = useBalanceFetcherStore((state) => state.balances);
    ```

2.  **Compute the Slice Inside `useMemo`:** After getting the whole `balances` object, we use a `useMemo` to perform the logic of picking out only the balances required by the component. This memoized calculation only re-runs if `allBalances` (the data from the store) or `validAddresses` (the props) actually change.

    ```typescript
    // hooks/useTokenBalance.tsx

    // CREATE the specific slice we need using useMemo.
    const balanceStates = useMemo(() => {
      const states: Record<string, BalanceState> = {};
      validAddresses.forEach((address) => {
        states[address] = allBalances[address] ?? DEFAULT_BALANCE_STATE;
      });
      return states;
    }, [allBalances, validAddresses]);
    ```

This new pattern breaks the loop because the subscription to the Zustand store is now stable, and the expensive computation of the component's specific data slice is correctly memoized.
