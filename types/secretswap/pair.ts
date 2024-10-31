import { Asset } from "./shared";
import { Pair } from "./shared";

// Execute

export type ExecuteMsg =
  | {
      provide_liquidity: {
        assets: [Asset, Asset];
        slippage_tolerance?: string;
      };
    }
  | {
      swap: {
        offer_asset: Asset;
        expected_return?: string;
        belief_price?: string;
        max_spread?: string;
        to?: string;
      };
    };

export type Cw20HookMsg =
  | {
      swap: {
        expected_return?: string;
        belief_price?: string;
        max_spread?: string;
        to?: string;
      };
    }
  | {
      withdraw_liquidity: object;
    };

// Query

export type QueryMsg =
  | {
      pair: object;
    }
  | {
      pool: object;
    }
  | {
      simulation: {
        offer_asset: Asset;
      };
    }
  | {
      reverse_simulation: {
        ask_asset: Asset;
      };
    };

export type PairResponse = Pair;

export interface PoolResponse {
  assets: [Asset, Asset];
  total_share: string;
}

export interface SimulationResponse {
  return_amount: string;
  spread_amount: string;
  commission_amount: string;
}

export interface ReverseSimulationResponse {
  offer_amount: string;
  spread_amount: string;
  commission_amount: string;
}
