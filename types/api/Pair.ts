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

export interface PoolResponse {
  assets: Asset[];
  total_share: string;
}
