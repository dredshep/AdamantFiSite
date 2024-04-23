Below are TypeScript interfaces that represent the expected responses from the API endpoints described in the provided documentation. Each interface is designed to encapsulate the data structure returned from its respective API call, making it suitable for use in a web application that consumes this API.

```typescript
// API path: /tokens/
export interface TokenPairingsResponse {
  tokens: Array<{
    name: string;
    decimals: number;
    symbol: string;
    dst_address: string;
    dst_coin: string;
    dst_network: string;
    src_address: string;
    src_coin: string;
    src_network: string;
    price: string;
    totalLocked: string;
    totalLockedNormal: string;
    totalLockedUSD: string;
  }>;
}

// API path: /tokens/:token
export interface TokenDetailsResponse {
  token: {
    name: string;
    decimals: number;
    symbol: string;
    dst_address: string;
    dst_coin: string;
    dst_network: string;
    src_address: string;
    src_coin: string;
    src_network: string;
    price: string;
    totalLocked: string;
    totalLockedNormal: string;
    totalLockedUSD: string;
  };
}

// API path: /secret_tokens/
export interface SecretTokensResponse {
  tokens: Array<{
    name: string;
    address: string;
    decimals: number;
    price: string;
    usage: string[];
    id: string;
    hidden: boolean;
    display_props: object;
  }>;
}

// API path: /rewards/
export interface RewardPoolsResponse {
  pools: Array<{
    pool_address: string;
    total_locked: string;
    pending_rewards: string;
    deadline: string;
  }>;
}

// API path: /rewards/:pool
export interface RewardPoolDetailsResponse {
  pool: {
    pool_address: string;
    total_locked: string;
    pending_rewards: string;
    deadline: string;
  };
}

// API path: /secretswap_pairs/
export interface SecretSwapPairsResponse {
  pairs: Array<{
    asset_infos: Array<{
      token?: {
        contract_addr: string;
        token_code_hash: string;
        viewing_key: string;
      };
      native_token?: {
        denom: string;
      };
    }>;
    contract_addr: string;
    liquidity_token: string;
    token_code_hash: string;
    asset0_volume: string;
    asset1_volume: string;
    factory: {
      address: string;
      code_hash: string;
    };
  }>;
}

// API path: /secretswap_pools/
export interface SecretSwapPoolsResponse {
  pools: Array<{
    assets: Array<{
      token?: {
        contract_addr: string;
        token_code_hash: string;
        viewing_key: string;
      };
      native_token?: {
        denom: string;
      };
      amount: string;
    }>;
    total_share: string;
  }>;
}

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

These interfaces should be imported into your web application's TypeScript files where you are handling API responses. They ensure type safety and clarify the data structure your application will process, helping prevent runtime errors and facilitating easier debugging and maintenance.
