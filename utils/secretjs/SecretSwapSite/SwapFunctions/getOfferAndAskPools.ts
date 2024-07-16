import BigNumber from "bignumber.js";
import { SwapPair } from "../types/SwapPair";
import { SwapTokenMap } from "../types/SwapToken";
import { humanizeBalance } from "../utils";

export function getOfferAndAskPools(
  fromToken: string,
  toToken: string,
  pair: SwapPair,
  tokens: SwapTokenMap,
  balances: { [key: string]: string }
): { offer_pool: BigNumber; ask_pool: BigNumber } {
  if (!pair) {
    return { offer_pool: new BigNumber(0), ask_pool: new BigNumber(0) };
  }

  const fromDecimals = tokens.get(fromToken)?.decimals ?? 18;
  const toDecimals = tokens.get(toToken)?.decimals ?? 18;

  // we normalize offer_pool & ask_pool
  // we could also canonicalize offer_amount & ask_amount
  // but this way is less code because we get the results normalized

  const offer_pool = humanizeBalance(
    new BigNumber(balances[`${fromToken}-${pair.identifier()}`]),
    fromDecimals
  );
  const ask_pool = humanizeBalance(
    new BigNumber(balances[`${toToken}-${pair.identifier()}`]),
    toDecimals
  );

  // this condition tested as never true,
  // therefore commented out in case a revert is needed later. 2021-01-13
  // if (offer_pool.isNaN() || ask_pool.isNaN()) {
  //   const balances = await this.props.refreshPools({ pair });
  //   offer_pool = humanizeBalance(new BigNumber(balances[`${fromToken}-${pair.identifier()}`] as any), fromDecimals);
  //   ask_pool = humanizeBalance(new BigNumber(balances[`${toToken}-${pair.identifier()}`] as any), toDecimals);
  // }

  return { offer_pool, ask_pool };
}
