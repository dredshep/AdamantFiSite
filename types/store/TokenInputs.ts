import { TokenInputState } from "./TokenInputState";

export interface SwapTokenInputs {
  "swap.pay": TokenInputState;
  "swap.receive": TokenInputState;
}

export interface PoolTokenInputs {
  "pool.tokenA": TokenInputState;
  "pool.tokenB": TokenInputState;
}
