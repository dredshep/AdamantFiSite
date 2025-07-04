# Postmortem: The Swap Form Infinite Loop

**Date:** July 4, 2024 (Inferred)
**Status:** Resolved
**Precedes:** The `/pools` page infinite loop.

## 1. Summary

A "Maximum update depth exceeded" error was crashing the Swap page. The issue was isolated to the "receive" `TokenInput` component. The root cause was a combination of unstable dependencies being passed into the `useTokenBalance` hook and, more critically, the hook itself creating unstable values from its Zustand store subscription. This created a re-render loop when the "receive" input's props were updated frequently by the swap estimation logic.

## 2. The Problem

The application would crash with a stack overflow error when the `/swap` page was active. Through methodical commenting out of components, the issue was pinpointed to the second `<TokenInput />` instance—the one responsible for the "receive" amount.

## 3. Investigation & The "Smoking Gun"

The debugging process correctly identified that the "receive" input was different because its `value` and `isLoading` props changed frequently. However, simply using static props did not stop the loop, indicating the problem was deeper inside the data flow.

- **Test 1 & 2 Worked:** Replacing the data flow within `TokenInput/index.tsx` for the "receive" input stopped the loop. Specifically, bypassing the subscription to `useSwapStore` and `useTokenStore` for that component instance resolved the issue. This proved the problem was a chain reaction starting from the store subscription.
- **Test 3 Failed:** Tests inside `useTokenBalance` to disable the `useEffect` that fetched balances **did not work**. This was a critical clue, proving the loop was not caused by the data _fetching_ logic itself.
- **The Breakthrough (Test 1 & 2 in the hook):** The loop was finally stopped by either A) returning a completely static object from `useTokenBalance` or B) replacing the Zustand store subscription line `useBalanceFetcherStore(...)` with a static object. This was the smoking gun: **the subscription to the store was the direct cause of the re-render loop.**

## 4. Root Cause Analysis: Unstable Selectors and Actions

Two primary issues were found in `hooks/useTokenBalance.tsx` that were triggered by the "receive" input's frequent re-renders:

1.  **Unstable Default Object:** The store selector created a new default object `{ balance: '-', ... }` every time it ran and couldn't find a cached balance. Zustand's strict equality check (`{...} !== {...}`) saw this new object, assumed the state had changed, and triggered a re-render, creating the loop.
2.  **Unstable Action Functions:** The hook was calling `useBalanceFetcherStore.getState()` inside its render body. This returns a new instance of the `addToQueue` function (and others) on every single render. While not the primary cause of this specific loop, it's a critical anti-pattern that leads to unstable `useEffect` dependency arrays.

## 5. The Solution: Stabilizing All Store Interactions

The definitive fix involved making all interactions with the Zustand store stable within the `useTokenBalance` hook.

**File:** `hooks/useTokenBalance.tsx`

1.  **Stable Default State:** A `const DEFAULT_BALANCE_STATE = { ... }` was defined once, _outside_ the hook. The selector was changed to always return this stable reference if a balance was missing.

    ```typescript
    // The Fix: Always return the same object reference
    return state.balances[tokenAddress] ?? DEFAULT_BALANCE_STATE;
    ```

2.  **Stable Action Selectors:** The calls to `.getState()` were replaced with selectors that provide stable function references across re-renders.

    ```typescript
    // The Fix: Use selectors for stable function references
    const addToQueue = useBalanceFetcherStore((state) => state.addToQueue);
    ```

These changes ensured that neither the data subscription nor the functions returned by the hook would cause an unnecessary re-render, permanently fixing the infinite loop.
