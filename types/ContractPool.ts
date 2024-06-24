export interface NativeTokenInfo {
  native_token: {
    denom: string;
  };
}

export interface TokenInfo {
  token: {
    contract_addr: string;
    token_code_hash: string;
    viewing_key: string;
  };
}

export type AssetInfo = NativeTokenInfo | TokenInfo;

export interface ContractPool {
  info: AssetInfo;
  amount: string;
}
