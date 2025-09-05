# Viewing Keys Force Creation Utility

## 🔍 Issue

Secret Network tokens require viewing keys to query private data like balances. Common problems include:

- **Invalid keys**: Stored viewing keys become corrupted or incorrect
- **Missing keys**: Tokens without viewing keys set up
- **Sync issues**: LP tokens and staking contracts with mismatched keys
- **Manual process**: Creating keys manually is tedious and error-prone

When viewing keys are invalid, users cannot query token contracts to see their balance.

## ✅ Solution

The `forceCreateViewingKey` utility solves this by:

1. **Generating cryptographically secure random viewing keys**
2. **Executing blockchain transactions** to set keys on contracts
3. **Automatically storing keys in Keplr wallet**
4. **Validating keys work** by querying balances
5. **Providing real-time progress feedback**

This creates a **fresh, valid viewing key** that both the contract and Keplr recognize, eliminating sync issues.

## 📖 Usage Manual

### Basic Usage

```typescript
import { forceCreateViewingKey } from '@/utils/viewingKeys';

const result = await forceCreateViewingKey({
  secretjs, // Your SecretJS client
  contractAddress: 'secret1...', // Token contract address
  codeHash: 'abc123...', // Contract code hash
});

if (result.success) {
  console.log('✅ New key:', result.viewingKey);
  console.log('💰 Balance:', result.balance);
  console.log('🔗 TX:', result.txHash);
} else {
  console.error('❌ Failed:', result.error);
}
```

### Advanced Usage with Progress Tracking

```typescript
import { forceCreateViewingKey } from '@/utils/viewingKeys';

const result = await forceCreateViewingKey({
  secretjs,
  contractAddress: lpTokenAddress,
  codeHash: lpTokenCodeHash,

  // Optional: Custom viewing key
  customKey: 'your-custom-key-here',

  // Optional: Progress callback
  onProgress: (message) => {
    setStatusMessage(message); // Update UI
  },

  // Optional: Configuration
  gasLimit: 200_000, // Custom gas limit
  storeInKeplr: true, // Store in Keplr (default: true)
  chainId: 'secret-4', // Chain ID (default: 'secret-4')
});
```

### Quick Helper Function

```typescript
import { quickForceCreateKey } from '@/utils/viewingKeys';

// Simplified version for basic use cases
const viewingKey = await quickForceCreateKey(secretjs, tokenAddress, tokenCodeHash);

if (viewingKey) {
  console.log('Key created:', viewingKey);
}
```

### Real-World Examples

**Fix corrupted LP token viewing key:**

```typescript
await forceCreateViewingKey({
  secretjs,
  contractAddress: 'secret18xd8j88jrwzagnv09cegv0fm3aca6d3qlfem6v', // sSCRT/USDC LP
  codeHash: '744c588ed4181b13a49a7c75a49f10b84b22b24a69b1e5f3cdff34b2c343e888',
  onProgress: (msg) => toast.info(msg),
});
```

**Create viewing key for any SNIP-20 token:**

```typescript
await forceCreateViewingKey({
  secretjs,
  contractAddress: 'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek', // sSCRT
  codeHash: 'af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e',
});
```

### Return Value Structure

```typescript
interface ForceCreateViewingKeyResult {
  success: boolean; // Operation success status
  viewingKey: string | null; // Generated viewing key
  txHash?: string; // Transaction hash
  error?: string; // Error message if failed
  balance?: string; // Queried balance (if available)
}
```

### Integration Tips

- **Use in error recovery**: When balance queries fail
- **Batch operations**: Create keys for multiple tokens
- **User feedback**: Always use `onProgress` for better UX
- **Error handling**: Check `result.success` before proceeding
- **Testing**: Use in debug pages to validate functionality
