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
