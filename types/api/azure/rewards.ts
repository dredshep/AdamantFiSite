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
  price: number;
}

export interface RewardsToken {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  price: number;
}
