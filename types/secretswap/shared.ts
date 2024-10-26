export interface ContractInfo {
  address: string;
  code_hash: string;
}

export interface Asset {
  info: AssetInfo;
  amount: string;
}

export type AssetInfo = Token | NativeToken;

export interface Token {
  token: {
    contract_addr: string;
    token_code_hash: string;
    viewing_key: string;
  };
}

export interface NativeToken {
  native_token: {
    denom: string;
  };
}

// Pair is the response of the "pair" QueryMsg
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
}
