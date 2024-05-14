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
