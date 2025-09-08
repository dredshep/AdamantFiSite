# Dual Viewing Key Integration Guide

## 🎯 **Overview**

This guide provides step-by-step instructions for integrating the Enhanced Mini Creator (dual viewing key setup) throughout the AdamantFi application. The goal is to replace manual Keplr instructions with one-click solutions while supporting custom keys (BYOK).

---

## 🧩 **Available Components**

### **Primary Component: ViewingKeyMiniCreator (Enhanced)**

**Path**: `components/app/Shared/ViewingKeys/ViewingKeyMiniCreator.tsx`

**Features**:

- ✅ Auto-generation (secure 64-char keys)
- ✅ Custom key input (BYOK support)
- ✅ Collapsible advanced options
- ✅ Validation and error handling
- ✅ Keplr integration
- ✅ Force creation using `forceCreateViewingKey`

**Usage**:

```tsx
import ViewingKeyMiniCreator from '@/components/app/Shared/ViewingKeys/ViewingKeyMiniCreator';

<ViewingKeyMiniCreator
  token={token}
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    // Handle success - refresh balances, show toast, etc.
  }}
  onError={(error) => {
    // Handle error - show error toast, log, etc.
  }}
/>;
```

### **Supporting Components**

#### **QuickKeyActions (For Inline Use)**

**Path**: `components/app/Shared/ViewingKeys/QuickKeyActions.tsx`

**Use Cases**: Toast actions, inline error states, table rows

```tsx
import QuickKeyActions from '@/components/app/Shared/ViewingKeys/QuickKeyActions';

<QuickKeyActions
  token={token}
  compact={true} // For toast/inline use
  onSuccess={(viewingKey) => console.log('Created:', viewingKey)}
  onError={(error) => console.error('Failed:', error)}
/>;
```

#### **DualViewingKeyCreator (Full Featured)**

**Path**: `components/app/Shared/ViewingKeys/DualViewingKeyCreator.tsx`

**Use Cases**: First-time setup, settings pages, detailed guidance

```tsx
import DualViewingKeyCreator from '@/components/app/Shared/ViewingKeys/DualViewingKeyCreator';

<DualViewingKeyCreator
  token={token}
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={(viewingKey) => console.log('Created:', viewingKey)}
  onError={(error) => console.error('Failed:', error)}
  title="Setup Viewing Key"
  description="Choose between auto-generation or custom key input."
/>;
```

---

## 🔧 **Integration Patterns**

### **Pattern 1: Replace Toast Action Buttons**

**Before**:

```typescript
showToastOnce('error-id', 'Viewing Key Failed', 'error', {
  message: 'Please go to Keplr wallet and set a new viewing key.',
  actionLabel: 'Copy Address',
  onAction: () => navigator.clipboard.writeText(tokenAddress),
});
```

**After**:

```typescript
showToastOnce('error-id', 'Viewing Key Failed', 'error', {
  message: 'Create a new viewing key automatically or use your own custom key.',
  actionLabel: 'Fix Viewing Key',
  onAction: () => {
    // Open ViewingKeyMiniCreator modal
    setShowViewingKeyModal(true);
  },
});
```

### **Pattern 2: Enhance Existing Buttons**

**Before**:

```tsx
<button onClick={() => void suggestToken(tokenAddress)}>Add Key</button>
```

**After**:

```tsx
<button onClick={() => setShowDualSetup(true)}>
  Add Key
</button>

<ViewingKeyMiniCreator
  token={token}
  isOpen={showDualSetup}
  onClose={() => setShowDualSetup(false)}
  onSuccess={() => {
    setShowDualSetup(false);
    // Refresh balances, show success, etc.
  }}
  onError={(error) => console.error('Failed:', error)}
/>
```

### **Pattern 3: Error Recovery Integration**

**Before**:

```typescript
catch (error) {
  if (error.message.includes('viewing key')) {
    alert('Please set viewing key in Keplr manually');
  }
}
```

**After**:

```typescript
catch (error) {
  if (error.message.includes('viewing key')) {
    setShowViewingKeyModal(true);
    setErrorContext({ token, error });
  }
}
```

### **Pattern 4: Inline Error States**

**Before**:

```tsx
{
  error === 'VIEWING_KEY_INVALID' && (
    <div className="error">
      <p>Viewing key invalid. Please fix in Keplr wallet.</p>
      <button onClick={() => copyAddress()}>Copy Address</button>
    </div>
  );
}
```

**After**:

```tsx
{
  error === 'VIEWING_KEY_INVALID' && (
    <div className="error">
      <p>Viewing key invalid. Quick fix available:</p>
      <QuickKeyActions
        token={token}
        compact={true}
        onSuccess={() => refreshBalance()}
        onError={(err) => console.error(err)}
      />
    </div>
  );
}
```

---

## 📋 **Step-by-Step Integration**

### **Step 1: Identify Integration Point**

1. **Look for these patterns**:

   - Manual Keplr instructions
   - "Please go to Keplr wallet"
   - "Set viewing key manually"
   - Copy address buttons for viewing key errors
   - `suggestToken` calls without force creation fallback

2. **Common locations**:
   - Error toast messages
   - Button click handlers
   - Error recovery flows
   - Debug interfaces

### **Step 2: Choose Integration Approach**

#### **For Toast Messages**:

```typescript
// Replace actionLabel and onAction
actionLabel: 'Fix Viewing Key',
onAction: () => {
  // Open modal or trigger dual setup
}
```

#### **For UI Components**:

```tsx
// Add state for modal
const [showViewingKeyModal, setShowViewingKeyModal] = useState(false);

// Replace existing button action
<button onClick={() => setShowViewingKeyModal(true)}>
  Fix Viewing Key
</button>

// Add modal
<ViewingKeyMiniCreator
  token={token}
  isOpen={showViewingKeyModal}
  onClose={() => setShowViewingKeyModal(false)}
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

#### **For Inline Errors**:

```tsx
// Replace error text with QuickKeyActions
<QuickKeyActions token={token} compact={true} onSuccess={handleSuccess} onError={handleError} />
```

### **Step 3: Handle Token Information**

```typescript
// Ensure you have token info
const token = TOKENS.find((t) => t.address === tokenAddress);
if (!token) {
  // Fallback for unknown tokens
  console.warn('Token not found in config:', tokenAddress);
  return;
}
```

### **Step 4: Implement Success/Error Handlers**

```typescript
const handleSuccess = (viewingKey: string) => {
  // Close modal
  setShowViewingKeyModal(false);

  // Refresh relevant data
  refreshBalance();

  // Show success feedback
  showToastOnce('key-created', 'Viewing Key Created', 'success', {
    message: `Successfully created viewing key for ${token.symbol}`,
    autoClose: 3000,
  });
};

const handleError = (error: Error) => {
  console.error('Viewing key creation failed:', error);

  // Show error feedback
  showToastOnce('key-failed', 'Key Creation Failed', 'error', {
    message: `Failed to create viewing key: ${error.message}`,
    autoClose: 5000,
  });
};
```

### **Step 5: Test Integration**

1. **Trigger the error condition** that leads to manual instructions
2. **Verify dual setup appears** instead of manual instructions
3. **Test auto-generation** - should work in ~3 seconds
4. **Test custom key input** - should accept user input
5. **Test error handling** - should show appropriate errors
6. **Test success flow** - should refresh data and show feedback

---

## 🎨 **UI Integration Examples**

### **Toast Integration Example**

```typescript
// In balanceFetcherStore.ts or similar
if (isLpToken) {
  showToastOnce(
    `lp-key-validation-failed-${tokenAddress}`,
    'LP Token Viewing Key Failed',
    'error',
    {
      message: `${tokenSymbol} viewing key failed. Create a new key automatically or use your own custom key.`,
      actionLabel: 'Fix Viewing Key',
      onAction: () => {
        // Trigger modal or direct integration
        modalStore.openViewingKeyModal({ tokenAddress, isLpToken: true });
      },
      autoClose: false,
    }
  );
}
```

### **Component Integration Example**

```tsx
// In AddViewingKeyButton.tsx or similar
const AddViewingKeyButton: React.FC<Props> = ({ tokenAddress, error, onSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const token = TOKENS.find((t) => t.address === tokenAddress);

  if (!token) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
      >
        Fix Viewing Key
      </button>

      <ViewingKeyMiniCreator
        token={token}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          onSuccess();
        }}
        onError={(err) => console.error('Key creation failed:', err)}
      />
    </>
  );
};
```

### **Inline Integration Example**

```tsx
// In error display components
{
  hasViewingKeyError && (
    <div className="bg-red-50 border border-red-200 rounded p-3">
      <p className="text-red-800 mb-2">Viewing key issue detected. Quick fix available:</p>
      <QuickKeyActions
        token={token}
        compact={true}
        onSuccess={() => {
          clearError();
          refreshData();
        }}
        onError={(err) => console.error('Fix failed:', err)}
      />
    </div>
  );
}
```

---

## 🔄 **Migration Checklist**

### **Before Integration**

- [ ] Identify all manual Keplr instruction locations
- [ ] Document current user flow and pain points
- [ ] Test current error scenarios to understand triggers
- [ ] Plan rollout strategy (gradual vs full replacement)

### **During Integration**

- [ ] Import required components
- [ ] Add necessary state management
- [ ] Implement success/error handlers
- [ ] Update error messages and instructions
- [ ] Test both auto-generation and custom key flows

### **After Integration**

- [ ] Verify backward compatibility
- [ ] Test all error scenarios
- [ ] Confirm mobile responsiveness
- [ ] Monitor for any new issues
- [ ] Update documentation

### **Testing Scenarios**

1. **Auto-Generation Flow**:

   - Click "Generate Key" → Should create key in ~3 seconds
   - Check console logs for progress
   - Verify key appears in Keplr
   - Confirm balance loads correctly

2. **Custom Key Flow**:

   - Click "Show Advanced Options"
   - Toggle "Use custom viewing key"
   - Enter test key: `"my-test-key-123"`
   - Click "Use Custom Key"
   - Verify custom key is used

3. **Error Handling**:

   - Test with invalid custom keys (too short, empty)
   - Test with wallet disconnected
   - Test with network issues
   - Verify graceful error messages

4. **Mobile Experience**:
   - Test on mobile devices
   - Verify compact mode works in toasts
   - Check responsive design
   - Test touch interactions

---

## 🛠 **Advanced Integration**

### **Modal Store Integration**

```typescript
// Create a global modal store for viewing key modals
interface ViewingKeyModalState {
  isOpen: boolean;
  tokenAddress: string | null;
  context: 'error' | 'setup' | 'debug';
}

const useViewingKeyModal = create<ViewingKeyModalState>((set) => ({
  isOpen: false,
  tokenAddress: null,
  context: 'setup',
  open: (tokenAddress: string, context = 'setup') => set({ isOpen: true, tokenAddress, context }),
  close: () => set({ isOpen: false, tokenAddress: null }),
}));
```

### **Feature Flag Integration**

```typescript
// Add feature flags for gradual rollout
const useDualViewingKeySetup = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const enabledInProd = process.env.NEXT_PUBLIC_DUAL_VIEWING_KEY === 'true';

  return isDevelopment || enabledInProd;
};

// Use in components
const shouldUseDualSetup = useDualViewingKeySetup();
```

### **Analytics Integration**

```typescript
// Track usage for optimization
const handleViewingKeySuccess = (method: 'auto' | 'custom', viewingKey: string) => {
  // Analytics tracking
  analytics.track('viewing_key_created', {
    method,
    keyLength: viewingKey.length,
    tokenSymbol: token.symbol,
    source: 'dual_setup',
  });

  // Success handling
  onSuccess(viewingKey);
};
```

---

## 📊 **Success Metrics**

### **User Experience Metrics**

- **Time to Resolution**: From error to working viewing key
- **Success Rate**: Percentage of successful key creations
- **Method Preference**: Auto-generation vs custom key usage
- **Error Recovery**: How often users successfully recover from errors

### **Developer Experience Metrics**

- **Integration Time**: How quickly new integrations can be added
- **Bug Reports**: Reduction in viewing key related issues
- **Support Tickets**: Decrease in manual instruction requests
- **Code Consistency**: Standardized viewing key creation across app

### **Business Impact Metrics**

- **User Retention**: Fewer users abandoning due to viewing key issues
- **Onboarding Success**: Faster new user activation
- **Support Burden**: Reduced customer support load
- **Power User Satisfaction**: BYOK adoption rate

This integration guide provides everything needed to successfully implement the dual viewing key setup throughout the application, transforming the user experience from complex manual processes to simple one-click solutions.
