import useGlobalConfigStore from "@/store/useGlobalConfigStore";
import { AsyncSender } from "./blockchain-bridge/scrt/asyncSender";
import { getFeeForExecute } from "./blockchain-bridge/scrt/utils";
import { GAS_FOR_BASE_SWAP_ROUTE } from "@/utils/secretjs/SecretSwapSite/utils/gasPrices";

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
  const { AMM_ROUTER_CONTRACT } = useGlobalConfigStore.getState().config;
  if (fromToken === "uscrt") {
    return secretjsSender.asyncExecute(
      AMM_ROUTER_CONTRACT,
      secretAddress,
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
      secretAddress,
      {
        send: {
          recipient: AMM_ROUTER_CONTRACT,
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
