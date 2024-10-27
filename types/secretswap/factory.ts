import { AssetInfo, Pair } from "./shared";

// Factory types

export interface InitHook {
  msg: Uint8Array;
  contract_addr: string;
  code_hash: string;
}

export interface Fee {
  commission_rate_nom: string;
  commission_rate_denom: string;
}

export interface SwapDataEndpoint {
  address: string;
  code_hash: string;
}

// Execute

export type ExecuteMsg =
  | {
      create_pair: {
        asset_infos: AssetInfo[];
        init_hook?: InitHook;
      };
    }
  | {
      update_config: {
        owner?: string;
        token_code_id?: number;
        pair_code_id?: number;
        pair_code_hash?: string;
        token_code_hash?: string;
        swap_fee?: Fee;
        swap_data_endpoint?: SwapDataEndpoint;
      };
    };

// Query

export type QueryMsg =
  | { config: {} }
  | { pair_settings: {} }
  | { pair: { asset_infos: [AssetInfo, AssetInfo] } }
  | { pairs: { start_after?: [AssetInfo, AssetInfo]; limit?: number } };

export type PairResponse = Pair;

export interface PairsResponse {
  pairs: Pair[];
}
