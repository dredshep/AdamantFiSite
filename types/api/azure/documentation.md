```ts
// tokens.ts

// api paths:
// - https://api-bridge-mainnet.azurewebsites.net/tokens
// - https://api-bridge-mainnet.azurewebsites.net/tokens/:token

// - https://bridge-bsc-mainnet.azurewebsites.net/tokens/?page=0&size=1000
// - https://bridge-bsc-mainnet.azurewebsites.net/tokens/:token
export interface AzureTokensToken {
  src_network: string;
  src_coin: string;
  src_address: string;
  dst_network: string;
  dst_address: string;
  dst_coin?: string;
  decimals: number;
  name: string;
  display_props: AzureTokensDisplayProps;
  totalLocked: string;
  totalLockedNormal: string;
  totalLockedUSD: string;
  price: string;
  _id: string;
}

export interface AzureTokensDisplayProps {
  symbol: string;
  image: string;
  min_to_scrt: string;
  min_from_scrt: string;
  label: string;
  hidden?: boolean;
  proxy?: boolean;
  usage?: "BRIDGE" | "SWAP" | "LPSTAKING";
}

export interface AzureTokensResponse {
  tokens: AzureTokensToken[];
}
```

```ts
// secret_tokens.ts

export interface AzureSecretTokensResponse {
  tokens: SecretToken[];
}

export interface SecretToken {
  name: string;
  address: string;
  decimals: number;
  hidden: boolean;
  usage: string[];
  price: string;
  id: string;
  display_props: DisplayProps;
  _id: string;
  dst_address?: string;
}

export interface DisplayProps {
  image: string;
  symbol: string;
  label: string;
}
```

```ts
// secretswap_pools.ts

import { NativeToken } from "./secretswap_pairs";

export interface SecretSwapPoolsResponse {
  pools: SecretSwapPool[];
}

export interface SecretSwapPool {
  assets: SecretSwapPoolsAsset[];
  total_share: string;
  _id: string;
}

export interface SecretSwapPoolsAsset {
  info: Info;
  amount: string;
}

export interface Info {
  token?: SecretSwapPoolsToken;
  native_token?: NativeToken;
}

export interface SecretSwapPoolsToken {
  contract_addr: string;
  token_code_hash: string;
  viewing_key: string;
}
```

```ts
// index.ts

export * from "./secretswap_pairs";
export * from "./rewards";
export * from "./secretswap_pools";
export * from "./secret_tokens_legacy";
export * from "./tokens";

// Note: Types below are untested and may be incorrect

// API path: /proof/eth/:addr and /proof/scrt/:addr
export interface ClaimProofResponse {
  proof: {
    user: string;
    index: number;
    amount: string;
    proof: string[];
  };
}

// API path: /cashback/network_avg_rate/
export interface CashbackRateResponse {
  rate: number;
  count: number;
}

// API path: /cashback/network_avg_rate/:rate
export interface NewCashbackRateResponse {
  result: string;
  newRate?: number;
}
```

```ts
// rewards.ts

// api paths:
// - https://api-bridge-mainnet.azurewebsites.net/rewards
// - https://api-bridge-mainnet.azurewebsites.net/rewards/:pool
export interface RewardsResponse {
  pool: {
    pool_address: string;
    inc_token: IncToken;
    rewards_token: RewardsToken;
    total_locked: string;
    pending_rewards: string;
    deadline: string;
    _id: string;
    hidden?: boolean;
    deprecated?: boolean;
    deprecated_by?: string;
  };
}

export interface IncToken {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  price: any;
}

export interface RewardsToken {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  price: any;
}
```

```ts
// secretswap_pairs.ts

// api path: https://api-bridge-mainnet.azurewebsites.net/secretswap_pairs
export interface SecretSwapPairsResponse {
  pairs: SecretSwapPair[];
}

export interface SecretSwapPair {
  asset_infos: SecretSwapPairsAssetInfo[];
  contract_addr: string;
  liquidity_token: string;
  token_code_hash: string;
  asset0_volume: string;
  asset1_volume: string;
  factory: SecretSwapPairsFactory;
  _id: string;
}

export interface SecretSwapPairsAssetInfo {
  token?: SecretSwapPairsToken;
  native_token?: NativeToken;
}

export interface SecretSwapPairsToken {
  contract_addr: string;
  token_code_hash: string;
  viewing_key: string;
}

export interface NativeToken {
  denom: string;
}

export interface SecretSwapPairsFactory {
  address: string;
  code_hash: string;
}
```

