import { TokenInputState } from "./TokenInputState";

export interface SwapTokenInputs {
  "swap.pay": TokenInputState;
  "swap.receive": TokenInputState;
}

export interface PoolTokenInputs {
  "pool.deposit.tokenA": TokenInputState;
  "pool.deposit.tokenB": TokenInputState;
  "pool.withdraw.tokenA": TokenInputState;
  "pool.withdraw.lpToken": TokenInputState;
  // "pool.withdraw.tokenB": TokenInputState;
  // "pool.withdraw.lpToken": TokenInputState;
  // "pool.create.tokenA": TokenInputState;
  // "pool.create.tokenB": TokenInputState;
}
