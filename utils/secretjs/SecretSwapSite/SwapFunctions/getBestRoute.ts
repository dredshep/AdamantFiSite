import BigNumber from "bignumber.js";
import {
  compute_offer_amount,
  compute_swap,
} from "../blockchain-bridge/scrt/swap/swap";
import { SwapPair } from "../types/SwapPair";
import { getOfferAndAskPools } from "./getOfferAndAskPools";
import { SwapTokenMap } from "../types/SwapToken";

export type RouteOutput = {
  route: string[];
  toOutput?: BigNumber;
  toWithGas?: BigNumber;
  fromOutput?: BigNumber;
  fromWithGas?: BigNumber;
};

export function getBestRoute({
  fromInput,
  toInput,
  cachedGasFeesUnfilledCoin,
  isToEstimated,
  routes,
  tokens,
  pairs,
  balances,
}: {
  fromInput: number;
  toInput: number;
  cachedGasFeesUnfilledCoin: number[];
  isToEstimated: boolean;
  routes: string[][];
  tokens: SwapTokenMap;
  pairs: Map<string, SwapPair>;
  balances: { [key: string]: string };
}) {
  const allRoutesOutputs: Array<RouteOutput> = [];
  let bestRoute: string[] | null = null;

  let bestRouteToInput,
    bestRouteToInputWithGas = new BigNumber(-Infinity);
  let bestRouteFromInput,
    bestRouteFromInputWithGas = new BigNumber(Infinity);

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];

    if (isToEstimated /* top input is filled */ || toInput === null) {
      let from = new BigNumber(fromInput);
      let to = new BigNumber(0);
      for (let i = 0; i < route.length - 1; i++) {
        const fromToken = route[i];
        const toToken = route[i + 1];
        const pair: SwapPair | undefined = pairs.get(
          `${fromToken}${SwapPair.id_delimiter}${toToken}`,
        );
        if (!pair) {
          break;
        }

        const { offer_pool, ask_pool } = getOfferAndAskPools(
          fromToken,
          toToken,
          pair,
          tokens,
          balances,
        );

        const offer_amount = from;
        if (
          offer_pool.isEqualTo(0) ||
          ask_pool.isEqualTo(0) ||
          offer_amount.isNaN() ||
          offer_amount.isLessThanOrEqualTo(0)
        ) {
          to = new BigNumber(0);
          break;
        }

        const { return_amount } = compute_swap(
          offer_pool,
          ask_pool,
          offer_amount,
        );

        if (return_amount.isNaN() || return_amount.isLessThanOrEqualTo(0)) {
          to = new BigNumber(0);
          break;
        }

        to = return_amount;

        if (i < route.length - 2) {
          // setup for next iteration
          from = return_amount;
        }
      }

      const toWithGas = to.minus(cachedGasFeesUnfilledCoin[route.length - 1]);

      allRoutesOutputs.push({ route, toOutput: to, toWithGas });

      if (toWithGas.isGreaterThan(bestRouteToInputWithGas)) {
        bestRouteFromInput = new BigNumber(fromInput);
        bestRouteToInput = to;
        bestRouteToInputWithGas = toWithGas;
        bestRoute = route;
      }
    } else {
      // isFromEstimated
      // bottom input is filled
      let from = new BigNumber(0);
      let to = new BigNumber(toInput);
      for (let i = route.length - 1; i > 0; i--) {
        const fromToken = route[i - 1];
        const toToken = route[i];
        const pair: SwapPair | undefined = pairs.get(
          `${fromToken}${SwapPair.id_delimiter}${toToken}`,
        );
        if (!pair) {
          break;
        }
        const { offer_pool, ask_pool } = getOfferAndAskPools(
          fromToken,
          toToken,
          pair,
          tokens,
          balances,
        );

        const ask_amount = to;
        if (
          offer_pool.isEqualTo(0) ||
          ask_pool.isEqualTo(0) ||
          ask_amount.gt(ask_pool) ||
          ask_amount.isNaN() ||
          ask_amount.isZero()
        ) {
          from = new BigNumber(Infinity);
          break;
        }

        const { offer_amount } = compute_offer_amount(
          offer_pool,
          ask_pool,
          ask_amount,
        );

        if (offer_amount.isNaN() || offer_amount.isLessThanOrEqualTo(0)) {
          from = new BigNumber(Infinity);
          break;
        }

        from = offer_amount;

        if (i > 1) {
          // setup for next iteration
          to = offer_amount;
        }
      }

      const fromWithGas = from.plus(
        cachedGasFeesUnfilledCoin[route.length - 1],
      );

      allRoutesOutputs.push({ route, fromOutput: from, fromWithGas });

      if (fromWithGas.isLessThan(bestRouteFromInputWithGas)) {
        bestRouteFromInput = from;
        bestRouteFromInputWithGas = fromWithGas;
        bestRouteToInput = new BigNumber(toInput);
        bestRoute = route;
      }
    }
  }
  return { bestRoute, allRoutesOutputs, bestRouteToInput, bestRouteFromInput };
}

// sample execution:
// getBestRoute({
//   fromInput: 1,
//   toInput: 1,
//   cachedGasFeesUnfilledCoin: [0.12],
//   isToEstimated: true,
//   routes: [["a", "b"]],
//   tokens: { a: "a", b: "b" },
//   pairs: new Map([["a:b", { id: "a:b" }]]),
//   balances: { a: "a", b: "b" },
// });
