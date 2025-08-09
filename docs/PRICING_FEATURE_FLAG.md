# Pricing Feature Flag Documentation

## Overview

The pricing feature can be completely disabled to avoid CoinGecko API costs and dependencies. When disabled, no pricing information is displayed and no API calls are made to CoinGecko.

## Configuration

### Default State

**Pricing is DISABLED by default** - This allows users to deploy without any CoinGecko setup.

### Enabling Pricing

To enable pricing features, set the following environment variables:

```env
# Enable the pricing feature
NEXT_PUBLIC_ENABLE_PRICING=true

# Required CoinGecko API configuration (only when pricing is enabled)
COINGECKO_API_KEY=your_coingecko_api_key_here
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_AUTH_HEADER=x-cg-pro-api-key
```

### Disabling Pricing

To disable pricing features:

```env
# Disable pricing (default)
NEXT_PUBLIC_ENABLE_PRICING=false
# OR simply omit the variable entirely
```

When pricing is disabled, the CoinGecko environment variables are not required.

## What Changes When Pricing is Disabled

### UI Components

- **WalletSidebar**: Total wallet value display is completely hidden
- **TokenListItem**: Price displays are removed from token list
- **TokenPriceDisplay**: Component returns `null` (renders nothing)

### API Behavior

- **`/api/prices`**: Returns 503 "Pricing disabled" immediately
- **Pricing Hooks**: Return empty/disabled state without making requests
- **useWalletTotalValue**: Returns zero values without calculations

### Performance Impact

- **No API calls**: Zero requests to CoinGecko when disabled
- **No calculations**: No price calculations or wallet value computations
- **Faster load times**: Components load faster without pricing data

## Technical Implementation

### Feature Flag Function

All components use a centralized feature flag:

```typescript
import { isPricingEnabled } from '@/utils/features';

if (!isPricingEnabled()) {
  // Pricing disabled logic
  return null; // or disabled state
}
```

### Environment Validation

The `utils/env.ts` validates configuration:

- If `NEXT_PUBLIC_ENABLE_PRICING=true`, CoinGecko vars are required
- If `NEXT_PUBLIC_ENABLE_PRICING=false` or missing, CoinGecko vars are optional

### Hook Behavior When Disabled

```typescript
// useCoinGeckoPricing
if (!isPricingEnabled()) {
  setLoading(false);
  setError(null);
  setPricing({});
  return;
}

// useWalletTotalValue
if (!isPricingEnabled()) {
  return {
    totalUSD: 0,
    change24hUSD: 0,
    change24hPercent: 0,
    loading: false,
    error: null,
  };
}
```

## Deployment Scenarios

### Scenario 1: No Pricing (Default)

```env
# .env.local
NEXT_PUBLIC_RPC_URL=...
NEXT_PUBLIC_CHAIN_ID=...
# ... other required vars
# NEXT_PUBLIC_ENABLE_PRICING is omitted (defaults to false)
```

**Result**: Clean wallet interface with balances only, no prices.

### Scenario 2: Free Tier CoinGecko

```env
# .env.local
NEXT_PUBLIC_ENABLE_PRICING=true
COINGECKO_API_KEY=your_free_api_key
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_AUTH_HEADER=x-cg-demo-api-key
```

**Result**: Full pricing features with rate-limited API access.

### Scenario 3: Premium CoinGecko

```env
# .env.local
NEXT_PUBLIC_ENABLE_PRICING=true
COINGECKO_API_KEY=your_premium_api_key
COINGECKO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_AUTH_HEADER=x-cg-pro-api-key
```

**Result**: Full pricing features with higher rate limits.

## Migration Guide

### From Always-On to Feature Flag

Existing deployments will continue to work but pricing will be **disabled by default**. To maintain current behavior:

1. Add `NEXT_PUBLIC_ENABLE_PRICING=true` to your environment
2. Ensure CoinGecko API keys are properly configured
3. Test pricing displays are working

### Cutting Costs

To disable pricing and reduce API costs:

1. Set `NEXT_PUBLIC_ENABLE_PRICING=false` (or remove the variable)
2. Remove CoinGecko environment variables (optional)
3. Pricing will be completely disabled

## Error Handling

### Missing Configuration

```typescript
// If pricing enabled but missing API key
throw new EnvVarError(
  'Pricing is enabled but missing required CoinGecko environment variables:\n' +
    'COINGECKO_API_KEY: Required for CoinGecko API access\n' +
    'Set NEXT_PUBLIC_ENABLE_PRICING=false to disable pricing, or add the missing variables.'
);
```

### API Failures

When pricing is enabled but API fails:

- Components show "Error" or "N/A" states
- Wallet continues to function normally
- Only pricing features are affected

## Testing

### Test Disabled State

```bash
# Remove or set to false
export NEXT_PUBLIC_ENABLE_PRICING=false
npm run dev
```

**Expected**: No price displays, no API calls, wallet works normally.

### Test Enabled State

```bash
export NEXT_PUBLIC_ENABLE_PRICING=true
export COINGECKO_API_KEY=your_key
npm run dev
```

**Expected**: Full pricing features, API calls to CoinGecko.

## Benefits

1. **Cost Control**: Completely eliminate CoinGecko costs when not needed
2. **Deployment Flexibility**: Deploy without pricing dependencies
3. **Performance**: Faster load times when pricing disabled
4. **Graceful Degradation**: Wallet functions fully without pricing
5. **Zero Configuration**: Works out-of-the-box without setup
