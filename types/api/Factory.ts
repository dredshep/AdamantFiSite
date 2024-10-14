interface TokenInfo {
  contract_addr: string;
  token_code_hash: string;
  viewing_key: string;
}

interface AssetInfo {
  token: TokenInfo;
}

// Query

export interface Pair {
  asset_infos: AssetInfo[];
  contract_addr: string;
  liquidity_token: string;
  token_code_hash: string;
  asset0_volume: string;
  asset1_volume: string;
  factory: {
    address: string;
    code_hash: string;
  };
  _id?: string;
}

export interface PairsResponse {
  pairs: Pair[];
}

// Execute

export interface MsgCreatePair {
  create_pair: {
    asset_infos: AssetInfo[];
    init_hook?: InitHook;
  };
}

export interface InitHook {
  msg: Uint8Array;
  contract_addr: string;
  code_hash: string;
}
