# Environment Variables and URL Management

## Overview

This document outlines the rules and guidelines for managing environment variables and URLs in the AdamantFi project.

## Environment Variables

### Structure

All environment variables are defined in `.env.local` and managed through `utils/env.ts`.

### Required Variables

- `NEXT_PUBLIC_RPC_URL`: RPC endpoint URL
- `NEXT_PUBLIC_CHAIN_ID`: Chain identifier (e.g., `secret-4`, `pulsar-3`)
- `NEXT_PUBLIC_LCD_URL`: LCD (Light Client Daemon) endpoint URL

### Rules

1. All environment variables must be prefixed with `NEXT_PUBLIC_` for client-side access
2. Environment variables must be validated in `utils/env.ts`
3. Missing variables will throw an `EnvVarError`
4. Never hardcode URLs in the codebase

## URL Management

### Secret Network Endpoints

#### Testnet (Pulsar-3)

- RPC: `https://pulsar.rpc.secretnodes.com`
- LCD: `https://pulsar.lcd.secretnodes.com`
- GRPC: `https://pulsar.grpc.secretnodes.com`

#### Mainnet

- RPC: `https://rpc.ankr.com/http/scrt_cosmos`
- LCD: `https://lcd.secretnodes.com`
- GRPC: `https://grpc.secretnodes.com`

### Rules

1. Always use environment variables for URLs
2. Never commit `.env.local` to version control
3. Document all URL changes in this file
4. Test endpoints before updating
5. Keep both mainnet and testnet configurations in `.env.local`

## Usage Example

```typescript
import { getSecretNetworkEnvVars } from '@/utils/env';

const env = getSecretNetworkEnvVars();
const { RPC_URL, CHAIN_ID, LCD_URL } = env;
```

## Testing Endpoints

Before updating URLs, verify them using:

```bash
# RPC
curl https://pulsar.rpc.secretnodes.com/status

# LCD
curl https://pulsar.lcd.secretnodes.com/cosmos/base/tendermint/v1beta1/node_info
```
