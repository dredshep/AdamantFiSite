// import { SecretNetworkClient } from "secretjs";
// import BigNumber from "bignumber.js";
// import { Keplr, Window } from "@keplr-wallet/types";
// import { SwapPair } from "../types/SwapPair";
// import { AsyncSender } from "../blockchain-bridge/scrt/asyncSender";
// // import { getFeeForExecute } from "../utils/gasPrices";
// import {
//   GAS_FOR_BASE_SWAP_ROUTE,
//   GAS_FOR_SWAP_NATIVE_COIN,
// } from "../utils/gasPrices";
// import { getOfferAndAskPools } from "../SwapFunctions/getOfferAndAskPools";
// // const { compute_offer_amount, compute_swap } = require("../blockchain-bridge/scrt/swap/swap");
// import {
//   compute_offer_amount,
//   compute_swap,
// } from "../blockchain-bridge/scrt/swap/swap";

// // Keplr Wallet Integration
// const connectKeplr = async () => {
//   await (window as Window).keplr?.enable("secret-4");
//   const offlineSigner = (window as Window).getOfflineSigner?.("secret-4");
//   const accounts = await offlineSigner?.getAccounts();
//   return {
//     address: accounts?.[0].address,
//     signer: offlineSigner,
//   };
// };

// const createClient = async (signer: ReturnType<Keplr["getOfflineSigner"]>) => {
//   const accounts = await signer.getAccounts();
//   const client = new SecretNetworkClient({
//     url: "https://grpc-web.secret-4.api.trivium.network:9091",
//     wallet: signer,
//     walletAddress: accounts?.[0].address,
//     chainId: "secret-4",
//   });
//   return client;
// };

// export function getBestRoute({
//   fromInput,
//   toInput,
//   cachedGasFeesUnfilledCoin,
//   isToEstimated,
//   routes,
//   tokens,
//   pairs,
//   balances,
// }: BestRouteParams): {
//   bestRoute: string[] | null;
//   allRoutesOutputs: RouteOutput[];
//   bestRouteToInput: BigNumber;
//   bestRouteFromInput: BigNumber;
// } {
//   const allRoutesOutputs: RouteOutput[] = [];
//   let bestRoute: string[] | null = null;

//   let bestRouteToInput = new BigNumber(-Infinity);
//   let bestRouteToInputWithGas = new BigNumber(-Infinity);
//   let bestRouteFromInput = new BigNumber(Infinity);
//   let bestRouteFromInputWithGas = new BigNumber(Infinity);

//   for (const route of routes) {
//     if (isToEstimated || toInput === null) {
//       let from = new BigNumber(fromInput);
//       let to = new BigNumber(0);
//       for (let i = 0; i < route.length - 1; i++) {
//         const fromToken = route[i];
//         const toToken = route[i + 1];
//         const pair = pairs.get(
//           `${fromToken}${SwapPair.id_delimiter}${toToken}`,
//         );
//         if (!pair) break;

//         const { offer_pool, ask_pool } = getOfferAndAskPools(
//           fromToken,
//           toToken,
//           pair,
//           tokens,
//           balances,
//         );

//         const offer_amount = from;
//         if (
//           offer_pool.isEqualTo(0) ||
//           ask_pool.isEqualTo(0) ||
//           offer_amount.isNaN() ||
//           offer_amount.isLessThanOrEqualTo(0)
//         ) {
//           to = new BigNumber(0);
//           break;
//         }

//         const { return_amount } = compute_swap(
//           offer_pool,
//           ask_pool,
//           offer_amount,
//         );

//         if (return_amount.isNaN() || return_amount.isLessThanOrEqualTo(0)) {
//           to = new BigNumber(0);
//           break;
//         }

//         to = return_amount;

//         if (i < route.length - 2) {
//           from = return_amount;
//         }
//       }

//       const toWithGas = to.minus(cachedGasFeesUnfilledCoin[route.length - 1]);
//       allRoutesOutputs.push({ route, toOutput: to, toWithGas });

//       if (toWithGas.isGreaterThan(bestRouteToInputWithGas)) {
//         bestRouteFromInput = new BigNumber(fromInput);
//         bestRouteToInput = to;
//         bestRouteToInputWithGas = toWithGas;
//         bestRoute = route;
//       }
//     } else {
//       let from = new BigNumber(0);
//       let to = new BigNumber(toInput);
//       for (let i = route.length - 1; i > 0; i--) {
//         const fromToken = route[i - 1];
//         const toToken = route[i];
//         const pair = pairs.get(
//           `${fromToken}${SwapPair.id_delimiter}${toToken}`,
//         );
//         if (!pair) break;

//         const { offer_pool, ask_pool } = getOfferAndAskPools(
//           fromToken,
//           toToken,
//           pair,
//           tokens,
//           balances,
//         );

//         const ask_amount = to;
//         if (
//           offer_pool.isEqualTo(0) ||
//           ask_pool.isEqualTo(0) ||
//           ask_amount.gt(ask_pool) ||
//           ask_amount.isNaN() ||
//           ask_amount.isZero()
//         ) {
//           from = new BigNumber(Infinity);
//           break;
//         }

//         const { offer_amount } = compute_offer_amount(
//           offer_pool,
//           ask_pool,
//           ask_amount,
//         );

//         if (offer_amount.isNaN() || offer_amount.isLessThanOrEqualTo(0)) {
//           from = new BigNumber(Infinity);
//           break;
//         }

//         from = offer_amount;

//         if (i > 1) {
//           to = offer_amount;
//         }
//       }

//       const fromWithGas = from.plus(
//         cachedGasFeesUnfilledCoin[route.length - 1],
//       );

//       allRoutesOutputs.push({ route, fromOutput: from, fromWithGas });

//       if (fromWithGas.isLessThan(bestRouteFromInputWithGas)) {
//         bestRouteFromInput = from;
//         bestRouteFromInputWithGas = fromWithGas;
//         bestRouteToInput = new BigNumber(toInput);
//         bestRoute = route;
//       }
//     }
//   }

//   return { bestRoute, allRoutesOutputs, bestRouteToInput, bestRouteFromInput };
// }

// export async function executeRouterSwap(
//   secretjsSender: AsyncSender,
//   secretAddress: string,
//   fromToken: string,
//   fromAmount: string,
//   hops: (null | {
//     from_token: { address: string; code_hash: string } | "scrt";
//     pair_address: string;
//     pair_code_hash: string;
//   })[],
//   expected_return: string,
//   bestRoute: string[],
// ) {
//   const AMM_ROUTER_CONTRACT = "secret1..."; // Your AMM router contract address

//   const msg = {
//     receive: {
//       from: secretAddress,
//       amount: fromAmount,
//       msg: btoa(
//         JSON.stringify({
//           to: secretAddress,
//           hops,
//           expected_return,
//         }),
//       ),
//     },
//   };

//   if (fromToken === "uscrt") {
//     return secretjsSender.asyncExecute(
//       AMM_ROUTER_CONTRACT,
//       secretAddress,
//       msg,
//       "",
//       [
//         {
//           amount: fromAmount,
//           denom: "uscrt",
//         },
//       ],
//       getFeeForExecute((bestRoute.length - 1) * GAS_FOR_BASE_SWAP_ROUTE),
//     );
//   } else {
//     return secretjsSender.asyncExecute(
//       fromToken,
//       secretAddress,
//       {
//         send: {
//           recipient: AMM_ROUTER_CONTRACT,
//           amount: fromAmount,
//           msg: btoa(
//             JSON.stringify({
//               to: secretAddress,
//               hops,
//               expected_return,
//             }),
//           ),
//         },
//       },
//       "",
//       [],
//       getFeeForExecute((bestRoute.length - 1) * GAS_FOR_BASE_SWAP_ROUTE),
//     );
//   }
// }

// export async function executeSwapUscrt(
//   secretjsSender: AsyncSender,
//   secretAddress: string,
//   pair: SwapPair,
//   fromAmount: string,
//   expected_return: string,
// ) {
//   return secretjsSender.asyncExecute(
//     pair.contract_addr,
//     secretAddress,
//     {
//       swap: {
//         offer_asset: {
//           info: { native_token: { denom: "uscrt" } },
//           amount: fromAmount,
//         },
//         expected_return,
//       },
//     },
//     "",
//     [
//       {
//         amount: fromAmount,
//         denom: "uscrt",
//       },
//     ],
//     getFeeForExecute(GAS_FOR_SWAP_NATIVE_COIN),
//   );
// }

// interface SwapToken {
//   address: string;
//   code_hash: string;
// }

// // interface SwapPair {
// //   contract_addr: string;
// //   asset_infos: SwapToken[];
// // }

// interface RouteOutput {
//   route: string[];
//   toOutput?: BigNumber;
//   toWithGas?: BigNumber;
//   fromOutput?: BigNumber;
//   fromWithGas?: BigNumber;
// }

// interface BestRouteParams {
//   fromInput: number;
//   toInput: number;
//   cachedGasFeesUnfilledCoin: number[];
//   isToEstimated: boolean;
//   routes: string[][];
//   tokens: Record<string, SwapToken>;
//   pairs: Map<string, SwapPair>;
//   balances: Record<string, string>;
// }

// (async () => {
//   const keplrConnection = await connectKeplr();
//   const secretjs = await createClient(keplrConnection.signer);

//   // Define the parameters for the swap
//   const fromToken = "secret1...";
//   const toToken = "secret2...";
//   const fromAmount = "1000000"; // Example amount
//   const expectedReturn = "990000"; // Example expected return

//   const bestRouteData = getBestRoute({
//     fromInput: 1,
//     toInput: 1,
//     cachedGasFeesUnfilledCoin: [0.12],
//     isToEstimated: true,
//     routes: [["a", "b"]],
//     tokens: {
//       a: { address: "secret1...", code_hash: "..." },
//       b: { address: "secret2...", code_hash: "..." },
//     },
//     pairs: new Map([["a:b", { contract_addr: "secret1...", asset_infos: [] }]]),
//     balances: { a: "1000000", b: "1000000" },
//   });

//   if (bestRouteData.bestRoute) {
//     const hops = await getHops(
//       bestRouteData.bestRoute,
//       bestRouteData.pairs,
//       secretjs,
//     );

//     await executeRouterSwap(
//       keplrConnection.signer,
//       keplrConnection.address,
//       fromToken,
//       fromAmount,
//       hops,
//       expectedReturn,
//       bestRouteData.bestRoute,
//     );
//   } else {
//     console.error("No valid route found");
//   }
// })();
