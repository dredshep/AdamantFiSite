import { SwapPair } from "../types/SwapPair";
import { GAS_FOR_SWAP_NATIVE_COIN } from "../utils/gasPrices";
import { getFeeForExecute } from "../blockchain-bridge/scrt";
import { AsyncSender } from "../blockchain-bridge/scrt/asyncSender";

export function executeSwapUscrt(
  secretjsSender: AsyncSender,
  secretAddress: string,
  pair: SwapPair,
  fromAmount: string,
  expected_return: string,
) {
  // call the swap function directly since this is with uscrt
  return secretjsSender.asyncExecute(
    pair.contract_addr,
    secretAddress,
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
    getFeeForExecute(GAS_FOR_SWAP_NATIVE_COIN),
  );
}
