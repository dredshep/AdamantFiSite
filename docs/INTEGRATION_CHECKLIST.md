# Dual Viewing Key Integration Checklist

## 📋 **Pre-Integration Setup**

### **Environment Preparation**

- [ ] Verify `forceCreateViewingKey` utility is working
- [ ] Test Enhanced Mini Creator on test page (`/viewing-key-test`)
- [ ] Confirm Keplr wallet connection works
- [ ] Check console for any existing viewing key errors

### **Component Verification**

- [ ] `ViewingKeyMiniCreator` - Enhanced version with dual setup
- [ ] `QuickKeyActions` - Compact version for inline use
- [ ] `DualViewingKeyCreator` - Full featured modal version
- [ ] Test components work with sSCRT token

---

## 🎯 **Integration Tasks by Priority**

### **Priority 1: Critical Error Handling**

#### **Task 1.1: Balance Fetcher Store**

**File**: `store/balanceFetcherStore.ts`

- [ ] **Line 547**: Update LP token error message
  - [ ] Replace manual instructions with "Create a new key automatically or use your own custom key"
  - [ ] Change actionLabel to 'Fix Viewing Key'
  - [ ] Update onAction to open ViewingKeyMiniCreator
- [ ] **Line 572**: Update regular token error message
  - [ ] Same pattern as LP token error
- [ ] **Lines 627-643**: Update general error messages
  - [ ] Replace "manually set the viewing key in Keplr" references
- [ ] **Test**: Trigger viewing key errors → Verify dual setup appears

#### **Task 1.2: Toast Manager**

**File**: `utils/toast/toastManager.ts`

- [ ] **Lines 181-186**: Update aggregated error messages
- [ ] **Lines 442-478**: Update specific error functions
  - [ ] `viewingKeyMismatch`
  - [ ] `lpTokenViewingKeyMismatch`
- [ ] **Test**: Trigger various viewing key errors → Check toast messages

#### **Task 1.3: Token Service**

**File**: `services/secret/TokenService.ts`

- [ ] **Lines 393-406**: Update error messages
- [ ] **Lines 528-532**: Update `resetViewingKey` method
- [ ] Add force creation as fallback option
- [ ] **Test**: Service-level errors show dual setup options

### **Priority 2: UI Component Enhancement**

#### **Task 2.1: LP Viewing Key Button**

**File**: `components/app/Shared/ViewingKeys/AddLpViewingKeyButton.tsx`

- [ ] Replace `onSuggestToken` with dual setup modal
- [ ] Add state for ViewingKeyMiniCreator
- [ ] Implement success/error handlers
- [ ] **Test**: LP token errors show enhanced button

#### **Task 2.2: Fix Viewing Key Modal**

**File**: `components/app/Shared/ViewingKeys/FixViewingKeyModal.tsx`

- [ ] **Lines 99-126**: Update manual instructions
- [ ] Make "Create New Viewing Key" primary action
- [ ] Keep manual steps as secondary option
- [ ] **Test**: Modal shows dual setup as main option

#### **Task 2.3: Viewing Key Debugger**

**File**: `components/ViewingKeyDebugger.tsx`

- [ ] **Lines 825-829**: Update help text
- [ ] **Line 654**: Add dual setup option
- [ ] **Line 758**: Enhance existing buttons
- [ ] **Test**: Debug interface includes force creation

### **Priority 3: Hook and Utility Integration**

#### **Task 3.1: Staking Hook**

**File**: `hooks/useStaking.ts`

- [ ] **Line 442**: Add dual setup fallback to suggestToken
- [ ] Implement error recovery with force creation
- [ ] **Test**: Staking token errors trigger dual setup

#### **Task 3.2: Incentives Page**

**File**: `pages/incentives-test.tsx`

- [ ] **Lines 777-797**: Replace 8-step manual process
- [ ] **Lines 220, 283**: Update button functionality
- [ ] Add dual setup button as primary option
- [ ] **Test**: Incentives page uses force creation

### **Priority 4: Complete suggestToken Integration**

#### **Task 4.1: Global Fetcher Store**

**File**: `store/globalFetcherStore.ts`

- [ ] **Lines 607-608**: Add dual setup fallback
- [ ] **Test**: Global errors trigger dual setup

#### **Task 4.2: Network Switcher**

**File**: `components/NetworkSwitcher.tsx`

- [ ] **Line 246**: Add dual setup integration
- [ ] **Test**: Network switching errors show dual setup

---

## 🧪 **Testing Protocol**

### **Functional Testing**

#### **Auto-Generation Testing**

- [ ] Click "Generate Key" button
- [ ] Verify 3-second creation time
- [ ] Check console logs for progress
- [ ] Confirm key stored in Keplr
- [ ] Verify balance loads correctly

#### **Custom Key Testing**

- [ ] Toggle "Show Advanced Options"
- [ ] Enable "Use custom viewing key"
- [ ] Test valid key: `"my-test-key-12345"`
- [ ] Test invalid keys:
  - [ ] Empty string → Should show error
  - [ ] "abc" → Too short error
  - [ ] Special characters → Should work
- [ ] Verify custom key is used correctly

#### **Error Scenarios**

- [ ] Disconnect wallet → Should show connection error
- [ ] Invalid token address → Should handle gracefully
- [ ] Network timeout → Should show timeout error
- [ ] Keplr locked → Should prompt unlock

### **Integration Testing**

#### **LP Token Errors**

- [ ] Trigger LP viewing key failure
- [ ] Verify dual setup appears in toast
- [ ] Test both auto and custom key creation
- [ ] Confirm LP functionality resumes

#### **Regular Token Errors**

- [ ] Trigger standard viewing key failure
- [ ] Verify dual setup appears
- [ ] Test key creation process
- [ ] Confirm balance loading

#### **Staking Errors**

- [ ] Trigger staking token viewing key issue
- [ ] Verify dual setup integration
- [ ] Test staking functionality recovery

### **UI/UX Testing**

#### **Mobile Testing**

- [ ] Test on mobile devices (iOS/Android)
- [ ] Verify compact mode in toasts
- [ ] Check touch interactions
- [ ] Confirm responsive design

#### **Accessibility Testing**

- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast verification
- [ ] Focus management

#### **Performance Testing**

- [ ] Key creation speed (<5 seconds)
- [ ] UI responsiveness during creation
- [ ] Memory usage impact
- [ ] No blocking operations

---

## ✅ **Quality Assurance**

### **Code Quality**

- [ ] TypeScript compilation without errors
- [ ] ESLint passes without warnings
- [ ] All imports resolve correctly
- [ ] Consistent code style

### **Backward Compatibility**

- [ ] Existing flows still work
- [ ] No breaking changes to public APIs
- [ ] Legacy viewing key functionality preserved
- [ ] Manual instructions still available as fallback

### **Error Handling**

- [ ] Graceful degradation when components fail
- [ ] Clear error messages for users
- [ ] Proper error logging for debugging
- [ ] Fallback to manual instructions if needed

### **Integration Completeness**

- [ ] All identified locations updated
- [ ] Consistent UX across all integrations
- [ ] No manual instruction locations missed
- [ ] Feature flag support implemented

---

## 📊 **Validation Criteria**

### **User Experience Success**

- [ ] **Time Reduction**: Manual 8-steps → 3-second auto-generation
- [ ] **Error Recovery**: One-click fix for viewing key issues
- [ ] **BYOK Support**: Power users can use custom keys
- [ ] **Mobile Friendly**: Works well on all devices

### **Developer Experience Success**

- [ ] **Easy Integration**: Drop-in replacement for manual instructions
- [ ] **Consistent API**: Same interface across all components
- [ ] **Good Documentation**: Clear integration guide
- [ ] **Maintainable Code**: Centralized dual setup logic

### **Business Impact Success**

- [ ] **Support Reduction**: Fewer viewing key tickets
- [ ] **User Retention**: Fewer abandons due to key issues
- [ ] **Onboarding**: Faster new user activation
- [ ] **Power User Satisfaction**: Advanced options available

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**

- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Feature flags configured

### **Deployment**

- [ ] Deploy to staging environment
- [ ] Smoke test critical flows
- [ ] Monitor error rates
- [ ] Gradual rollout to production

### **Post-Deployment**

- [ ] Monitor viewing key creation success rates
- [ ] Track user adoption of dual setup
- [ ] Watch for any new error patterns
- [ ] Collect user feedback

### **Success Metrics**

- [ ] **Creation Success Rate**: >95%
- [ ] **Error Resolution Time**: <30 seconds
- [ ] **User Satisfaction**: Positive feedback
- [ ] **Support Tickets**: 50% reduction

---

## 🆘 **Rollback Plan**

### **If Issues Arise**

- [ ] **Feature Flag**: Disable dual setup via environment variable
- [ ] **Quick Rollback**: Revert to manual instructions temporarily
- [ ] **Hotfix**: Address specific issues and redeploy
- [ ] **Communication**: Notify users of any service impact

### **Monitoring**

- [ ] Error rate monitoring
- [ ] Success rate tracking
- [ ] User abandonment metrics
- [ ] Performance impact measurement

This checklist ensures a systematic and thorough integration of the dual viewing key setup system across the entire application.
