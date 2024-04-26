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
