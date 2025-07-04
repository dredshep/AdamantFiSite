# SOP: Zustand Stability and Subscriptions

**Date:** July 5, 2024
**Status:** Active
**Author:** Gemini

## 1. Purpose

This document provides a Standard Operating Procedure (SOP) for interacting with Zustand stores within this codebase. Two separate critical incidents involving "Maximum update depth exceeded" errors have been traced to the same root cause: **unstable values being created during a component's render cycle and then used in a way that breaks React's or Zustand's memoization.**

Following these rules is mandatory to prevent these infinite loops from recurring.

## 2. The Core Problem: Instability

An infinite re-render loop occurs when a component is told to re-render, and that re-render process itself triggers another re-render. This happens when a hook dependency (like in `useEffect`) or a store subscription's return value changes on every render. Zustand, by default, uses strict reference equality (`===`) to detect changes. If a selector returns a new object or array on every call, Zustand will always trigger a re-render.

## 3. The Rules of Engagement

### Rule 1: NEVER use `.getState()` in a Component

Using `useStore.getState()` inside a React component's render body is the most common source of instability. It returns new function references on every call.

- **🔴 ANTI-PATTERN:**

  ```typescript
  // Creates a new `addToQueue` function reference on every render
  const { addToQueue } = useBalanceFetcherStore.getState();

  useEffect(() => {
      addToQueue(...);
  }, [addToQueue]); // This dependency is always changing!
  ```

- **✅ CORRECT PATTERN:** Use a selector to get a stable reference to the action.

  ```typescript
  // Zustand guarantees this reference is stable
  const addToQueue = useBalanceFetcherStore((state) => state.addToQueue);

  useEffect(() => {
      addToQueue(...);
  }, [addToQueue]); // This dependency is stable
  ```

### Rule 2: NEVER create new objects/arrays in a selector

If a selector needs to return a default value, it must be a stable reference. Creating a new object or array (`{...}` or `[...]`) inside the selector will cause a loop.

- **🔴 ANTI-PATTERN:**

  ```typescript
  // Creates a new object reference if the balance is not found
  const balanceState = useBalanceFetcherStore((state) =>
      state.balances[address] ?? { balance: '-', loading: false, ... }
  );
  ```

- **✅ CORRECT PATTERN:** Define the default object as a `const` outside the component and return that stable reference.

  ```typescript
  // Defined once, outside the component
  const DEFAULT_BALANCE_STATE = { balance: '-', loading: false, ... };

  // ... inside the component
  const balanceState = useBalanceFetcherStore((state) =>
      state.balances[address] ?? DEFAULT_BALANCE_STATE // Returns a stable reference
  );
  ```

### Rule 3: ALWAYS subscribe to the smallest, most stable state possible

Do not subscribe to more state than you need. However, subscribing to a dynamically-built "slice" of the state is dangerous and was the root cause of the `/pools` page bug.

- **🔴 ANTI-PATTERN:** Creating a new object in the selector to grab multiple values.

  ```typescript
  // This returns a new object { tokenA, tokenB } on every render
  const { tokenA, tokenB } = useStore((state) => ({
    tokenA: state.tokens[idA],
    tokenB: state.tokens[idB],
  }));
  ```

- **✅ CORRECT PATTERN (The Safe Harbor):** If you need a computed slice of data, subscribe to the larger, stable piece of state and compute the slice inside a `useMemo`. This was the final, successful fix for the `/pools` page bug.

  ```typescript
  // 1. Subscribe to the whole, stable `balances` object
  const allBalances = useBalanceFetcherStore((state) => state.balances);

  // 2. Compute the derived data in a useMemo.
  // This only re-runs if `allBalances` or `validAddresses` changes.
  const balanceStates = useMemo(() => {
    const states = {};
    validAddresses.forEach((addr) => (states[addr] = allBalances[addr] ?? DEFAULT));
    return states;
  }, [allBalances, validAddresses]);
  ```

### Rule 4 (Advanced): Use `shallow` for small, computed objects

If the "Safe Harbor" pattern (Rule 3) is too inefficient because the parent state changes too often, you may use a `shallow` comparator. This tells Zustand to check the first level of properties in the returned object instead of just the object's reference. This was not an option in our case due to linter/environment issues, which makes Rule 3 the preferred method for this project.

- **⚠️ ADVANCED PATTERN (Use with caution):**

  ```typescript
  import { shallow } from 'zustand/shallow';

  // This is safe ONLY when used with the shallow comparator
  const { tokenA, tokenB } = useStore(
    (state) => ({
      tokenA: state.tokens[idA],
      tokenB: state.tokens[idB],
    }),
    shallow
  ); // The shallow comparator is required
  ```

## 4. Conclusion

The common theme across both major incidents was **unstable return values from Zustand selectors**. By adhering to the rules above—especially by preferring stable selectors and using `useMemo` for derived state—we can prevent this entire class of bugs from happening again.
