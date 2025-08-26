# Ticket: Remove/Replace Unused Viewing Key Store

## Issue

The viewing key store (`useViewingKeyStore`) appears to be unused and ineffective:

- **Always empty**: All logs show `"All keys in store: Object { }"`
- **App works without it**: The application functions correctly using the local fallback viewing key
- **Code complexity**: Adds unnecessary complexity with no benefit
- **Dead code**: The store mechanism is implemented but not actually storing anything

## Evidence from Logs

```
🔧 Using LP token VK for staking:
  - LP Token Address: secret18xd8j88jrwzagnv09cegv0fm3aca6d3qlfem6v
  - LP Store key: undefined
  - Local key fallback: a0da573a3d33fa44705865f8192c1feaf8cc8eef8120dbca8850ee2380827b1b
  - Final keyToUse: a0da573a3d33fa44705865f8192c1feaf8cc8eef8120dbca8850ee2380827b1b
  - All keys in store: Object {  }  <-- Always empty
```

## Proposed Solution

### Option 1: Remove Entirely (Recommended)

- Remove `useViewingKeyStore` and related code
- Simplify viewing key logic to use direct Keplr calls
- Remove the store-related dependencies from `useStaking` and other hooks

### Option 2: Fix the Store Implementation

- Investigate why the store isn't actually storing viewing keys
- Implement proper persistence and retrieval
- Add proper error handling for store operations

### Option 3: Replace with Simple Caching

- Replace the complex store with a simple in-memory cache
- Use a Map or similar structure for session-based caching
- Avoid the overhead of a full Zustand store for simple key storage

## Files Affected

- `store/viewingKeyStore.ts` (main store implementation)
- `hooks/useStaking.ts` (line 71, 120, 124, 127 - uses the store)
- `hooks/useViewingKeyStore.ts` (if exists)
- Any other components using `useViewingKeyStore`

## Impact Assessment

- **Low risk**: App already works without the store
- **Code simplification**: Remove dead/unused code
- **Performance improvement**: Remove unnecessary store subscriptions
- **Maintainability**: Less complex viewing key logic

## Priority

**Medium** - Not urgent since app works, but good housekeeping to remove dead code

## Acceptance Criteria

- [ ] Viewing key store is removed/replaced
- [ ] App continues to work with viewing keys
- [ ] No console errors related to missing store
- [ ] Code is simpler and more maintainable
- [ ] Performance is same or better

## Notes

- The local fallback mechanism already works perfectly
- Consider if viewing key persistence is actually needed for UX
- May want to keep simple in-memory caching for performance
