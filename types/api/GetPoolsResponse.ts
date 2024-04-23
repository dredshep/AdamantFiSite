// type of response from https://api-bridge-mainnet.azurewebsites.net/secretswap_pools/?page=0&size=1000
export interface GetPoolsResponse {
  pools: Pool[];
}

export interface Pool {
  assets: ApiPoolAsset[];
  total_share: string;
  _id: string;
}

export interface ApiPoolAsset {
  info: ApiPoolInfo;
  amount: string;
}

export interface ApiPoolInfo {
  token?: ApiPoolToken;
  native_token?: ApiPoolNativeToken;
}

export interface ApiPoolToken {
  contract_addr: string;
  token_code_hash: string;
  viewing_key: string;
}

export interface ApiPoolNativeToken {
  denom: string;
}
