# Multihop Integration Guide

This guide explains how to safely re-integrate the multihop functionality back into the main codebase.

## 🔄 Step-by-Step Re-integration

### 1. Deploy Router Contract

First, deploy the SecretSwap router contract to the Secret Network mainnet.

### 2. Update Configuration

Replace the placeholder values in `config/tokens.ts`:

```typescript
// Update these values after router deployment
export const ROUTER = {
  contract_address: 'secret1YOUR_ACTUAL_ROUTER_ADDRESS', // Replace placeholder
  code_hash: 'YOUR_ACTUAL_ROUTER_CODE_HASH', // Replace placeholder
};

// Enable multihop functionality
export const MULTIHOP_ENABLED = true; // Change from false to true
```

### 3. Copy Core Files

Copy these files from the backup directory to their respective locations:

```bash
# Core multihop logic
cp multihop-backup/routing.ts utils/swap/routing.ts
cp multihop-backup/multihopExecution.ts utils/swap/multihopExecution.ts

# UI component
cp multihop-backup/MultihopStatusIndicator.tsx components/app/Pages/Swap/MultihopStatusIndicator.tsx
```

### 4. Update Main Files

Replace the main integration files with their enhanced versions:

```bash
# Enhanced versions with multihop support
cp multihop-backup/useSwapFormLean-multihop.ts hooks/useSwapFormLean.ts
cp multihop-backup/tokens-multihop.ts config/tokens.ts
cp multihop-backup/swapStore-multihop.ts store/swapStore.ts
```

### 5. Update SwapForm Component

Add the MultihopStatusIndicator to the swap form:

```typescript
// In components/app/Pages/Swap/SwapForm/SwapForm.tsx
import MultihopStatusIndicator from '../MultihopStatusIndicator';

// Add this component where you want the status indicator
<MultihopStatusIndicator
  swapPath={swapPath}
  payTokenSymbol={payToken?.symbol}
  receiveTokenSymbol={receiveToken?.symbol}
/>;
```

## 🧪 Testing Checklist

Before going live, test these scenarios:

### Direct Swaps (should work as before)

- [ ] sSCRT → sATOM
- [ ] sSCRT → USDC.nbl
- [ ] sSCRT → SILK
- [ ] All other direct pairs

### Multihop Swaps (new functionality)

- [ ] sATOM → USDC.nbl (via sSCRT)
- [ ] SILK → sATOM (via sSCRT)
- [ ] JKL → USDC.nbl (via sSCRT)

### Error Handling

- [ ] Empty pools show "No liquidity" message
- [ ] Invalid token pairs show appropriate errors
- [ ] Network errors are handled gracefully

### UI/UX

- [ ] Route display shows correct path information
- [ ] Loading states work properly
- [ ] Token selection includes multihop-reachable tokens

## 🚨 Safety Considerations

### Feature Flag

The `MULTIHOP_ENABLED` flag provides an emergency disable:

- Set to `false` to immediately disable multihop without code changes
- Direct swaps will continue to work normally
- Users will see "Disabled (Safety)" status

### Router Contract Validation

The system validates router configuration before execution:

- Checks for placeholder addresses
- Prevents execution with invalid configuration
- Shows clear error messages to users

### Fallback Behavior

If multihop fails, the system gracefully falls back:

- Shows all available tokens (not just multihop-reachable)
- Displays appropriate error messages
- Maintains existing direct swap functionality

## 🔍 Monitoring

After deployment, monitor these metrics:

### Success Rates

- Direct swap success rate (should remain unchanged)
- Multihop swap success rate (new metric)
- Router contract interaction success rate

### Error Patterns

- "Operation fell short of expected_return" errors
- Router contract execution failures
- Network timeout issues

### User Experience

- Time to complete multihop swaps vs direct swaps
- Gas usage comparison
- User adoption of multihop routes

## 🛠️ Troubleshooting

### Common Issues

**"Router contract not properly configured"**

- Check ROUTER.contract_address and ROUTER.code_hash
- Ensure they don't contain "PLACEHOLDER"

**"Multihop functionality is disabled"**

- Set MULTIHOP_ENABLED = true in config/tokens.ts

**"No routing path found"**

- Verify LIQUIDITY_PAIRS contains necessary pairs
- Check if sSCRT is available as intermediate token

**Swap fails with "Operation fell short of expected_return"**

- Increase slippage tolerance
- Check for high price impact warnings
- Verify pool liquidity is sufficient

## 📊 Performance Optimization

### Future Improvements

1. **Dynamic Routing**: Expand beyond sSCRT-only intermediate routing
2. **Path Optimization**: Find lowest-cost routing paths
3. **Batch Operations**: Combine multiple swaps in single transaction
4. **MEV Protection**: Add protection against front-running

### Monitoring Dashboard

Consider implementing monitoring for:

- Routing path efficiency
- Gas cost comparisons
- Slippage analysis
- User behavior patterns

## 🔄 Rollback Plan

If issues arise, rollback procedure:

1. **Emergency Disable**: Set `MULTIHOP_ENABLED = false`
2. **Full Rollback**: Restore original files from git
3. **Selective Disable**: Comment out MultihopStatusIndicator component

The system is designed to fail safely - direct swaps will always continue working even if multihop functionality encounters issues.
