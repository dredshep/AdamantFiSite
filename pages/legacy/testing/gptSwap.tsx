// import { useState } from "react";
// import { SecretNetworkClient, Wallet } from "secretjs";
// import BigNumber from "bignumber.js";
// import {
//   OfflineAminoSigner,
//   OfflineDirectSigner,
//   Window,
// } from "@keplr-wallet/types";

// import { SwapPair } from "@/utils/secretjs/SecretSwapSite/types/SwapPair";
// import { AsyncSender } from "@/utils/secretjs/SecretSwapSite/blockchain-bridge/scrt/asyncSender";
// import {
//   GAS_FOR_BASE_SWAP_ROUTE,
//   GAS_FOR_SWAP_NATIVE_COIN,
// } from "@/utils/secretjs/SecretSwapSite/utils/gasPrices";
// import { getOfferAndAskPools } from "@/utils/secretjs/SecretSwapSite/SwapFunctions/getOfferAndAskPools";
// import { Signer } from "secretjs/dist/wallet_amino";
// import { getFeeForExecute } from "@/utils/secretjs/SecretSwapSite/blockchain-bridge/scrt";
// import { SwapTokenMap } from "@/utils/secretjs/SecretSwapSite/types/SwapToken";

// const connectKeplr = async () => {
//   await (window as Window).keplr?.enable("secret-4");
//   const offlineSigner = (window as Window).getOfflineSigner?.("secret-4");
//   const accounts = await offlineSigner?.getAccounts();
//   return {
//     address: accounts?.[0].address,
//     signer: offlineSigner,
//   };
// };

// const createClient = async (signer: Signer) => {
//   const accounts = await signer.getAccounts();
//   const client = new SecretNetworkClient({
//     url: "https://scrt.public-rpc.com",
//     wallet: signer,
//     walletAddress: accounts[0].address,
//     chainId: "secret-4",
//   });
//   return client;
// };

// const SwapForm = () => {
//   const [fromToken, setFromToken] = useState("");
//   const [toToken, setToToken] = useState("");
//   const [fromAmount, setFromAmount] = useState("");
//   const [expectedReturn, setExpectedReturn] = useState("");
//   const [keplrConnection, setKeplrConnection] = useState<{
//     address: string | undefined;
//     signer: Signer | undefined;
//   } | null>(null);
//   const [client, setClient] = useState<SecretNetworkClient | null>(null);
//   const [error, setError] = useState("");

//   const handleConnectKeplr = async () => {
//     try {
//       const keplrConn = await connectKeplr();
//       if (!keplrConn?.signer) throw new Error("Keplr signer not found");
//       const secretjs = await createClient(keplrConn.signer);
//       setKeplrConnection(keplrConn);
//       setClient(secretjs);
//     } catch (err) {
//       setError("Failed to connect to Keplr");
//       console.error(err);
//     }
//   };

//   const handleSwap = async () => {
//     if (!keplrConnection || !client || !keplrConnection.address) {
//       setError("Please connect to Keplr first");
//       return;
//     }

//     try {
//       const bestRouteData = getBestRoute({
//         fromInput: parseFloat(fromAmount),
//         toInput: parseFloat(expectedReturn),
//         cachedGasFeesUnfilledCoin: [0.12],
//         isToEstimated: true,
//         routes: [["a", "b"]],
//         tokens: {
//           a: { address: fromToken, code_hash: "..." },
//           b: { address: toToken, code_hash: "..." },
//         },
//         pairs: new Map([
//           ["a:b", { contract_addr: "secret1...", asset_infos: [] }],
//         ]),
//         balances: { a: "1000000", b: "1000000" },
//       });

//       if (bestRouteData.bestRoute) {
//         const hops = await getHops(
//           bestRouteData.bestRoute,
//           bestRouteData.pairs,
//           client
//         );

//         await executeRouterSwap(
//           new AsyncSender(client),
//           keplrConnection.address,
//           fromToken,
//           fromAmount,
//           hops,
//           expectedReturn,
//           bestRouteData.bestRoute
//         );
//       } else {
//         setError("No valid route found");
//       }
//     } catch (err) {
//       setError("Swap failed");
//       console.error(err);
//     }
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Token Swap</h1>
//       {error && <div className="text-red-500 mb-4">{error}</div>}
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">
//           From Token
//         </label>
//         <input
//           type="text"
//           value={fromToken}
//           onChange={(e) => setFromToken(e.target.value)}
//           className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
//         />
//       </div>
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">
//           To Token
//         </label>
//         <input
//           type="text"
//           value={toToken}
//           onChange={(e) => setToToken(e.target.value)}
//           className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
//         />
//       </div>
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">
//           From Amount
//         </label>
//         <input
//           type="number"
//           value={fromAmount}
//           onChange={(e) => setFromAmount(e.target.value)}
//           className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
//         />
//       </div>
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700">
//           Expected Return
//         </label>
//         <input
//           type="number"
//           value={expectedReturn}
//           onChange={(e) => setExpectedReturn(e.target.value)}
//           className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
//         />
//       </div>
//       <div className="flex space-x-4">
//         <button
//           onClick={handleConnectKeplr}
//           className="px-4 py-2 bg-blue-600 text-white rounded-md"
//         >
//           Connect Keplr
//         </button>
//         <button
//           onClick={handleSwap}
//           className="px-4 py-2 bg-green-600 text-white rounded-md"
//         >
//           Swap
//         </button>
//       </div>
//     </div>
//   );
// };

// export default SwapForm;

// const getHops = async (
//   bestRoute: string[],
//   pairs: Map<string, SwapPair>,
//   secretjs: SecretNetworkClient
// ) => {
//   // Placeholder function to get hops
//   // Replace with your actual implementation
//   return bestRoute.map((token) => ({
//     from_token: { address: token, code_hash: "..." },
//     pair_address: pairs.get(token)?.contract_addr || "",
//     pair_code_hash: "...",
//   }));
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
//           `${fromToken}${SwapPair.id_delimiter}${toToken}`
//         );
//         if (!pair) break;

//         const { offer_pool, ask_pool } = getOfferAndAskPools(
//           fromToken,
//           toToken,
//           pair,
//           tokens,
//           balances
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
//           offer_amount
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
//           `${fromToken}${SwapPair.id_delimiter}${toToken}`
//         );
//         if (!pair) break;

//         const { offer_pool, ask_pool } = getOfferAndAskPools(
//           fromToken,
//           toToken,
//           pair,
//           tokens,
//           balances
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
//           ask_amount
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
//         cachedGasFeesUnfilledCoin[route.length - 1]
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
//   bestRoute: string[]
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
//         })
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
//       getFeeForExecute((bestRoute.length - 1) * GAS_FOR_BASE_SWAP_ROUTE)
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
//             })
//           ),
//         },
//       },
//       "",
//       [],
//       getFeeForExecute((bestRoute.length - 1) * GAS_FOR_BASE_SWAP_ROUTE)
//     );
//   }
// }

// export async function executeSwapUscrt(
//   secretjsSender: AsyncSender,
//   secretAddress: string,
//   pair: SwapPair,
//   fromAmount: string,
//   expected_return: string
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
//     getFeeForExecute(GAS_FOR_SWAP_NATIVE_COIN)
//   );
// }

// interface SwapToken {
//   address: string;
//   code_hash: string;
// }

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
//   tokens: SwapTokenMap;
//   pairs: Map<string, SwapPair>;
//   balances: Record<string, string>;
// }
// export const compute_offer_amount = (
//   offer_pool: BigNumber,
//   ask_pool: BigNumber,
//   ask_amount: BigNumber
// ): {
//   offer_amount: BigNumber;
//   spread_amount: BigNumber;
//   commission_amount: BigNumber;
// } => {
//   // ask => offer
//   // offer_amount = cp / (ask_pool - ask_amount / (1 - commission_rate)) - offer_pool
//   const cp = offer_pool.multipliedBy(ask_pool);
//   const one_minus_commission = new BigNumber(1).minus(COMMISSION_RATE);

//   const offer_amount = cp
//     .multipliedBy(
//       new BigNumber(1).dividedBy(
//         ask_pool.minus(
//           ask_amount.multipliedBy(reverse_decimal(one_minus_commission))
//         )
//       )
//     )
//     .minus(offer_pool);

//   const before_commission_deduction = ask_amount.multipliedBy(
//     reverse_decimal(one_minus_commission)
//   );

//   let spread_amount = new BigNumber(0);
//   try {
//     spread_amount = offer_amount
//       .multipliedBy(ask_pool.dividedBy(offer_pool))
//       .minus(before_commission_deduction);
//   } catch (e) {}

//   const commission_amount =
//     before_commission_deduction.multipliedBy(COMMISSION_RATE);
//   return { offer_amount, spread_amount, commission_amount };
// };

// export const reverse_decimal = (decimal: BigNumber): BigNumber => {
//   if (decimal.isEqualTo(0)) {
//     return new BigNumber(0);
//   }

//   return DECIMAL_FRACTIONAL.dividedBy(decimal.multipliedBy(DECIMAL_FRACTIONAL));
// };
// const DECIMAL_FRACTIONAL = new BigNumber(1_000_000_000);
// const COMMISSION_RATE = new BigNumber(0.3 / 100);

// placeholder export so it doesn't error out. empty file otherwise.
export default function GptSwap() {
  return <div></div>;
}
