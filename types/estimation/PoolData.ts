import Decimal from "decimal.js";

export interface PoolData {
  reserves: {
    [token: string]: { amount: Decimal; decimals: number };
  };
  fee: number;
}
