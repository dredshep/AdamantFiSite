# Dual Viewing Key Integration Tasks

## 🎯 **Objective**

Replace manual Keplr viewing key instructions with the Enhanced Mini Creator (dual setup) across all identified locations. This provides users with both auto-generation and custom key (BYOK) options while maintaining backward compatibility.

## 📋 **Task Overview**

- **Primary Component**: `ViewingKeyMiniCreator` (Enhanced version with dual setup)
- **Integration Points**: 23 locations across error handling, UI components, and utilities
- **Success Criteria**: Users can create viewing keys with one click OR use custom keys

---

## 🔥 **Priority 1: Critical Error Handling (High Impact)**

### **Task 1.1: Balance Fetcher Store Error Messages**

**File**: `store/balanceFetcherStore.ts`
**Lines**: 547-571, 572-590, 627-643

**Current Issues**:

- Manual instructions: "Please go to Keplr wallet, find the LP token, and set a new viewing key"
- Copy address buttons that require manual work
- Generic error messages without actionable solutions

**Integration Actions**:

1. **Update LP token error toast** (line 547):

   ```typescript
   // REPLACE THIS:
   message: `${tokenSymbol} viewing key failed: ${cleanErrorDetails}. Token: ${truncatedAddress} (click to copy). Please go to Keplr wallet, find the LP token, and set a new viewing key.`,
   actionLabel: 'Copy Address',

   // WITH THIS:
   message: `${tokenSymbol} viewing key failed: ${cleanErrorDetails}. Create a new key automatically or use your own custom key.`,
   actionLabel: 'Fix Viewing Key',
   onAction: () => {
     // Open ViewingKeyMiniCreator for this token
   }
   ```

2. **Update regular token error toast** (line 572):

   ```typescript
   // REPLACE manual instructions with dual setup action
   ```

3. **Update general error messages** (lines 627-643):
   ```typescript
   // Replace "manually set the viewing key in Keplr" with force creation
   ```

**Files to Create**:

- `components/app/Shared/ViewingKeys/ToastViewingKeyActions.tsx` - Compact version for toast integration

### **Task 1.2: Toast Manager Error Messages**

**File**: `utils/toast/toastManager.ts`
**Lines**: 181-186, 442-478

**Current Issues**:

- "Reset viewing keys in Keplr wallet (remove and re-add tokens)"
- "Add tokens to Keplr and set viewing keys"

**Integration Actions**:

1. Update `viewingKeyMismatch` function to include dual setup actions
2. Update `lpTokenViewingKeyMismatch` function with LP-specific dual setup
3. Add action buttons to error aggregation toasts

### **Task 1.3: Token Service Error Handling**

**File**: `services/secret/TokenService.ts`
**Lines**: 393-406, 528-532

**Current Issues**:

- "Reset the LP token viewing key in Keplr"
- "Failed to reset viewing key for token... manually remove and re-add this token"

**Integration Actions**:

1. Add force creation as primary option in `resetViewingKey` method
2. Update error messages to suggest dual setup instead of manual steps

---

## 🎨 **Priority 2: UI Component Enhancement (Medium Impact)**

### **Task 2.1: AddLpViewingKeyButton Enhancement**

**File**: `components/app/Shared/ViewingKeys/AddLpViewingKeyButton.tsx`

**Current Issues**:

- Only uses `suggestToken` without fallback
- No custom key option

**Integration Actions**:

1. Replace `onSuggestToken` with dual setup modal
2. Add fallback to force creation when `suggestToken` fails
3. Maintain existing interface for backward compatibility

### **Task 2.2: Fix Viewing Key Modal Update**

**File**: `components/app/Shared/ViewingKeys/FixViewingKeyModal.tsx`
**Lines**: 99-126

**Current Issues**:

- 5-step manual process: "Open Keplr → Find Token → Remove → Re-add → Set Key"
- Alternative button only opens ViewingKeyMiniCreator

**Integration Actions**:

1. Make "Create New Viewing Key" button the primary action
2. Keep manual instructions as secondary option
3. Update description to emphasize dual setup

### **Task 2.3: ViewingKeyDebugger Enhancement**

**File**: `components/ViewingKeyDebugger.tsx`
**Lines**: 825-829, 654, 758, 784

**Current Issues**:

- "If no viewing key exists, use 'Suggest Token to Keplr'"
- "If viewing key exists but balance fails, try 'Reset Viewing Key'"

**Integration Actions**:

1. Add "Force Create Key" option alongside existing tools
2. Integrate dual setup into debug workflow
3. Update help text to mention auto-generation and custom key options

---

## 🔧 **Priority 3: Hook and Utility Integration (Medium Impact)**

### **Task 3.1: useStaking Hook Enhancement**

**File**: `hooks/useStaking.ts`
**Line**: 442

**Current Issues**:

- Only uses `suggestToken` without force creation fallback

**Integration Actions**:

1. Add dual setup integration for staking tokens
2. Provide force creation when `suggestToken` fails
3. Maintain existing interface

### **Task 3.2: Incentives Page Integration**

**File**: `pages/incentives-test.tsx`
**Lines**: 777-797, 220, 283

**Current Issues**:

- 8-step manual instructions
- "Register token with Keplr and set a viewing key using the 'Create Viewing Key' button"

**Integration Actions**:

1. Replace 8-step manual process with dual setup button
2. Keep manual instructions as expandable "Advanced" section
3. Update button text and functionality

---

## 🔄 **Priority 4: Complete suggestToken Integration (Low Impact)**

### **Task 4.1: ViewingKeyMiniCreator Enhancement**

**File**: `components/app/Shared/ViewingKeys/ViewingKeyMiniCreator.tsx`

**Status**: ✅ **COMPLETED** - Already enhanced with dual setup

### **Task 4.2: Global Fetcher Store Integration**

**File**: `store/globalFetcherStore.ts`
**Line**: 607-608

**Current Issues**:

- Falls back to `suggestToken` without force creation

**Integration Actions**:

1. Add dual setup as fallback when balance fetching fails
2. Integrate with error recovery workflow

### **Task 4.3: Network Switcher Integration**

**File**: `components/NetworkSwitcher.tsx`
**Line**: 246

**Current Issues**:

- Uses `suggestToken` without force creation option

**Integration Actions**:

1. Add dual setup integration for network switching scenarios
2. Handle viewing key creation during network changes

---

## 📁 **Files to Create**

### **Core Integration Components**

1. `components/app/Shared/ViewingKeys/ToastViewingKeyActions.tsx`

   - Ultra-compact version for toast integration
   - Embedded dual actions without modal

2. `components/app/Shared/ViewingKeys/InlineViewingKeyFix.tsx`

   - Inline version for error states
   - Replaces "Copy Address" buttons

3. `utils/viewingKeys/integrationHelpers.ts`
   - Helper functions for seamless integration
   - Backward compatibility utilities

### **Configuration Files**

4. `config/dualSetupConfig.ts`
   - Feature flags for gradual rollout
   - Default settings for different contexts

---

## 🧪 **Testing Requirements**

### **Test Scenarios**

1. **LP Token Errors**: Trigger LP viewing key failures → Verify dual setup appears
2. **Regular Token Errors**: Trigger standard viewing key failures → Verify force creation
3. **Staking Workflows**: Test staking token viewing key creation
4. **Debug Interface**: Verify dual setup integrates with existing debug tools
5. **Mobile Experience**: Test compact interfaces on mobile devices

### **Integration Testing**

1. **Backward Compatibility**: Ensure existing flows still work
2. **Error Recovery**: Test all error scenarios show dual setup
3. **Success Flows**: Verify both auto-generation and custom keys work
4. **Performance**: Check for any performance regressions

---

## 📊 **Success Metrics**

### **User Experience**

- **Time to Resolution**: Manual 8-step process → 3-second auto-generation
- **Error Recovery**: Copy-paste flows → One-click solutions
- **BYOK Support**: Advanced users can use custom keys

### **Developer Experience**

- **Support Reduction**: Fewer "how to set viewing key" tickets
- **Integration Ease**: Drop-in replacement for manual instructions
- **Maintenance**: Centralized dual setup logic

### **Business Impact**

- **User Retention**: Fewer users abandoning due to viewing key issues
- **Onboarding**: Faster new user experience
- **Power User Satisfaction**: BYOK options for advanced users

---

## 🚀 **Implementation Strategy**

### **Phase 1: Foundation (Week 1)**

- Complete Priority 1 tasks (Critical Error Handling)
- Create core integration components
- Test with major error scenarios

### **Phase 2: Enhancement (Week 2)**

- Complete Priority 2 tasks (UI Components)
- Integrate with debug tools and modals
- Comprehensive testing

### **Phase 3: Polish (Week 3)**

- Complete Priority 3 & 4 tasks
- Performance optimization
- Documentation updates

### **Rollout Strategy**

1. **Feature Flag**: Enable for development first
2. **Gradual Release**: Start with non-critical locations
3. **Monitor**: Watch for any integration issues
4. **Full Deployment**: Once all tests pass

---

## 💡 **Integration Notes**

### **Key Principles**

1. **Backward Compatibility**: Existing flows must continue working
2. **Progressive Enhancement**: Add dual setup without breaking changes
3. **Consistent UX**: Same dual setup experience across all locations
4. **Mobile First**: Ensure compact interfaces work on all devices

### **Common Patterns**

1. **Toast Integration**: Replace action buttons with dual setup
2. **Modal Enhancement**: Add dual setup as primary option
3. **Error Recovery**: Force creation instead of manual instructions
4. **Debug Tools**: Integrate alongside existing functionality

### **Risk Mitigation**

1. **Feature Flags**: Ability to quickly disable if issues arise
2. **Fallback Logic**: Manual instructions remain available
3. **Error Handling**: Graceful degradation if dual setup fails
4. **Testing**: Comprehensive test coverage before deployment

This integration guide provides a complete roadmap for implementing the dual viewing key setup across the entire application, transforming the user experience from manual 8-step processes to one-click solutions while maintaining flexibility for power users.
