import BigNumber from "bignumber.js";
import {
  extractValueFromLogs,
  getFeeForExecute,
} from "@/utils/secretjs/SecretSwapSite/blockchain-bridge";
import { AsyncSender } from "@/utils/secretjs/SecretSwapSite/blockchain-bridge/scrt/asyncSender";
import {
  compute_offer_amount,
  compute_swap,
} from "@/utils/secretjs/SecretSwapSite/blockchain-bridge/scrt/swap";
// import { RouteOutput } from '@/components/Swap/RouteRow';
import {
  PairMap,
  SwapPair,
} from "@/utils/secretjs/SecretSwapSite/types/SwapPair";
import { SwapTokenMap } from "@/utils/secretjs/SecretSwapSite/types/SwapToken";
import { CosmWasmClient } from "secretjs";
import { humanizeBalance } from "@/utils/secretjs/SecretSwapSite/utils";
import {
  GAS_FOR_BASE_SWAP_ROUTE,
  GAS_FOR_SWAP_NATIVE_COIN,
} from "@/utils/secretjs/SecretSwapSite/utils/gasPrices";
import { Token } from "@/utils/secretjs/SecretSwapSite/types/trade";
import { storeTxResultLocally } from "@/utils/secretjs/SecretSwapSite/Swap/utils";

export function executeRouterSwap(
  secretjsSender: AsyncSender,
  secretAddress: string,
  fromToken: string,
  fromAmount: string,
  hops: (null | {
    from_token: { snip20: { address: string; code_hash: string } } | "scrt";
    pair_address: string;
    pair_code_hash: string;
    expected_return?: string;
  })[],
  expected_return: string,
  bestRoute: string[]
) {
  if (fromToken === "uscrt") {
    return secretjsSender.asyncExecute(
      globalThis.config.AMM_ROUTER_CONTRACT,
      {
        receive: {
          from: secretAddress,
          amount: fromAmount,
          msg: btoa(
            JSON.stringify({
              to: secretAddress,
              hops,
              expected_return,
            })
          ),
        },
      },
      "",
      [
        {
          amount: fromAmount,
          denom: "uscrt",
        },
      ],
      getFeeForExecute((bestRoute.length - 1) * GAS_FOR_BASE_SWAP_ROUTE)
    );
  } else {
    return secretjsSender.asyncExecute(
      fromToken,
      {
        send: {
          recipient: globalThis.config.AMM_ROUTER_CONTRACT,
          amount: fromAmount,
          msg: btoa(
            JSON.stringify({
              to: secretAddress,
              hops,
              expected_return,
            })
          ),
        },
      },
      "",
      [],
      getFeeForExecute((bestRoute.length - 1) * GAS_FOR_BASE_SWAP_ROUTE)
    );
  }
}

export function executeSwapUscrt(
  secretjsSender: AsyncSender,
  pair: SwapPair,
  fromAmount: string,
  expected_return: string
) {
  // call the swap function directly since this is with uscrt
  return secretjsSender.asyncExecute(
    pair.contract_addr,
    {
      swap: {
        offer_asset: {
          info: { native_token: { denom: "uscrt" } },
          amount: fromAmount,
        },
        expected_return,
        // offer_asset: Asset,
        // expected_return: Option<Uint128>
        // belief_price: Option<Decimal>,
        // max_spread: Option<Decimal>,
        // to: Option<HumanAddr>, // TODO
      },
    },
    "",
    [
      {
        amount: fromAmount,
        denom: "uscrt",
      },
    ],
    getFeeForExecute(GAS_FOR_SWAP_NATIVE_COIN)
  );
}

const extractError = (result: any) => {
  if (
    result?.raw_log &&
    result.raw_log.includes("Operation fell short of expected_return")
  ) {
    return "Swap fell short of expected return (slippage error)";
  }
  if (result?.raw_log) {
    return result.raw_log;
  }
  console.error(result);
  return `Unknown error`;
};

export function storeResult(
  result: any,
  fromAmount: string,
  fromDecimals: number,
  bestRoute: string[],
  toDecimals: number
) {
  if (result?.code) {
    const error = extractError(result);
    throw new Error(error);
  }

  storeTxResultLocally(result);

  const sent = humanizeBalance(
    new BigNumber(fromAmount),
    fromDecimals
  ).toFixed();
  const received = humanizeBalance(
    new BigNumber(
      extractValueFromLogs(result, "return_amount", bestRoute != null)
    ),
    toDecimals
  ).toFixed();

  const fromTokenFromTxn = extractValueFromLogs(result, "offer_asset", false);
  const toTokenFromTxn = extractValueFromLogs(result, "ask_asset", true);

  return { fromTokenFromTxn, toTokenFromTxn, sent, received };
}

function getOfferAndAskPools(
  fromToken: string,
  toToken: string,
  pair: SwapPair,
  tokens: SwapTokenMap,
  balances
): { offer_pool: BigNumber; ask_pool: BigNumber } {
  if (pair === undefined) {
    return { offer_pool: new BigNumber(0), ask_pool: new BigNumber(0) };
  }

  const fromDecimals = tokens.get(fromToken).decimals;
  const toDecimals = tokens.get(toToken).decimals;

  // we normalize offer_pool & ask_pool
  // we could also canonicalize offer_amount & ask_amount
  // but this way is less code because we get the results normalized

  let offer_pool = humanizeBalance(
    new BigNumber(balances[`${fromToken}-${pair.identifier()}`] as any),
    fromDecimals
  );
  let ask_pool = humanizeBalance(
    new BigNumber(balances[`${toToken}-${pair.identifier()}`] as any),
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

export function getBestRoute(
  fromInput,
  toInput,
  cachedGasFeesUnfilledCoin,
  isToEstimated,
  routes,
  tokens,
  pairs,
  balances
) {
  let bestRoute: string[] = null;
  let allRoutesOutputs: Array<RouteOutput> = [];
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
        const pair: SwapPair = pairs.get(
          `${fromToken}${SwapPair.id_delimiter}${toToken}`
        );

        const { offer_pool, ask_pool } = getOfferAndAskPools(
          fromToken,
          toToken,
          pair,
          tokens,
          balances
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

        const { return_amount, spread_amount } = compute_swap(
          offer_pool,
          ask_pool,
          offer_amount
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
        const pair: SwapPair = pairs.get(
          `${fromToken}${SwapPair.id_delimiter}${toToken}`
        );
        const { offer_pool, ask_pool } = getOfferAndAskPools(
          fromToken,
          toToken,
          pair,
          tokens,
          balances
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

        const { offer_amount, spread_amount } = compute_offer_amount(
          offer_pool,
          ask_pool,
          ask_amount
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
        cachedGasFeesUnfilledCoin[route.length - 1]
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

export async function getHops(
  bestRoute: string[],
  pairs: PairMap,
  secretjs: CosmWasmClient
) {
  return (
    await Promise.all(
      bestRoute.map(async (fromToken, idx) => {
        if (idx === bestRoute.length - 1) {
          // destination token
          return null;
        }

        const hop: {
          from_token:
            | {
                snip20: {
                  address: string;
                  code_hash: string;
                };
              }
            | "scrt";
          pair_address: string;
          pair_code_hash: string;
          expected_return?: string;
        } = {
          from_token: null,
          pair_address: null,
          pair_code_hash: null,
        };

        const toToken = bestRoute[idx + 1];
        const pair: SwapPair = pairs.get(
          `${fromToken}${SwapPair.id_delimiter}${toToken}`
        );

        if (fromToken === "uscrt") {
          hop.from_token = "scrt";
        } else {
          hop.from_token = {
            snip20: {
              address: fromToken,
              code_hash: (
                pair.asset_infos.find(
                  (a) => (a.info as Token)?.token?.contract_addr === fromToken
                ).info as Token
              ).token.token_code_hash,
            },
          };
        }

        hop.pair_address = pair.contract_addr;
        hop.pair_code_hash = await SwapPair.getPairCodeHash(
          hop.pair_address,
          secretjs
        );

        return hop;
      })
    )
  ).filter((x) => x !== null);
}
