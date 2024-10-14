interface TokenInfo {
  contract_addr: string;
  token_code_hash: string;
  viewing_key: string;
}

interface AssetInfo {
  token: TokenInfo;
}

export interface Asset {
  info: AssetInfo;
  amount: string;
}

// Query

export interface PoolResponse {
  assets: Asset[]; // 2 assets
  total_share: string;
}

// Execute

export interface ProvideLiquidity {
  assets: Asset[]; // 2 assets
  slippage_tolerance?: string;
}
