import { decode } from "bech32";
import { GAS_FOR_BASE_SWAP_ROUTE } from "@/utils/secretjs/SecretSwapSite/utils/gasPrices";
import { Token } from "@/types";
import { Coin, TxResponse } from "secretjs";
import { useTokenStore } from "@/store/tokenStore";

const HRP = "secret";
export const extractError = (result: TxResponse): string => {
  // Check for slippage error in arrayLog
  console.error(JSON.stringify(result, null, 2));
  if (result?.arrayLog) {
    for (const log of result.arrayLog) {
      if (log.key === "Operation fell short of expected_return") {
        return "Swap fell short of expected return (slippage error)";
      }
    }
  }

  // Fallback to jsonLog for any other logs
  if (result?.jsonLog) {
    return JSON.stringify(result.jsonLog);
  }

  console.error(result);
  return `Unknown error`;
};

export * from "./utils/extractValueFromLogs";

// export const swapContractAddress = (network: NETWORKS): string => {
//   switch (network) {
//     case NETWORKS.ETH:
//       return globalThis.config.SCRT_SWAP_CONTRACT;
//     case NETWORKS.BSC:
//       return globalThis.config.BSC_SCRT_SWAP_CONTRACT;
//     case NETWORKS.PLSM:
//       return globalThis.config.PLSM_SWAP_CONTRACT;
//   }
// };

export const getScrtAddress = (address: string): string => {
  try {
    const decoded = decode(address, 46);
    return decoded.prefix === HRP ? address : "";
  } catch {
    return "";
  }
};

export const validateBech32Address = (address: string): boolean => {
  return getScrtAddress(address) !== "";
};

type StdFee = {
  amount: readonly Coin[];
  gas: number;
};
const gasPriceUscrt = 0.25;
export function getFeeForExecute(gas: number): StdFee {
  return {
    amount: [
      {
        amount: String(Math.floor(gas * gasPriceUscrt) + 1),
        denom: "uscrt",
      },
    ],
    gas: gas,
  };
}

export function getFeeForExecuteUSD(numHops: number): number {
  const getTokenBySymbol = (symbol: string): Token | null => {
    return useTokenStore.getState().getTokenBySymbol(symbol);
  };
  // if (numHops === 1) {
  //   return GAS_FOR_SWAP_DIRECT;
  // } else {
  //   return numHops * GAS_FOR_BASE_SWAP_ROUTE;
  // }
  const gas = numHops * GAS_FOR_BASE_SWAP_ROUTE;

  return (
    ((Number(getTokenBySymbol("sSCRT")?.usdPrice) * gas) / 1_000_000) *
    gasPriceUscrt
  );
}

// Cache fees by numHops so we don't have to recompute as often
export function cacheFeesForExecuteUSD(): number[] {
  return [
    0,
    getFeeForExecuteUSD(1),
    getFeeForExecuteUSD(2),
    getFeeForExecuteUSD(3),
    getFeeForExecuteUSD(4),
  ];
}

// todo: fix this up - proxy token
// export const secretTokenName = (
//   mode: EXCHANGE_MODE,
//   token: Token[],
//   label: string
// ): string => {
//   if (label === "SEFI") {
//     return "SEFI";
//   } else if (label === "WSCRT") {
//     return mode === EXCHANGE_MODE.FROM_SCRT ? "SSCRT" : "WSCRT";
//   } else if (label === "WSIENNA") {
//     return mode === EXCHANGE_MODE.FROM_SCRT ? "SIENNA" : "WSIENNA";
//   } else {
//     return (
//       (mode === EXCHANGE_MODE.FROM_SCRT && token === TOKEN.ERC20
//         ? "secret"
//         : "") + label
//     );
//   }
// };

// export function notify(
//   type: "success" | "error" | "errorWithHash",
//   msg: string,
//   hideAfterSec: number = 120,
//   txHash?: string,
//   useContainer: boolean = false
// ) {
//   // if(globalThis.config.IS_MAINTENANCE === 'true') return;
//   let cogoType: string = type;
//   if (type === "error" && typeof msg === "string") {
//     msg = msg.replaceAll("Failed to decrypt the following error message: ", "");
//     msg = msg.replace(/\. Decryption error of the error message:.+?/, "");
//   }

//   let onClick = () => {
//     hide();
//   };
//   if (type === "errorWithHash") {
//     cogoType = "warn";
//     onClick = () => {
//       const url = `https://secretnodes.com/secret/chains/secret-4/transactions/${txHash}`;
//       const win = window.open(url, "_blank");
//       win.focus();
//       hide();
//     };
//   }

//   // const { hide } = cogoToast[cogoType](msg, {
//   //   toastContainerID: "notifications_container",
//   //   hideAfter: hideAfterSec,
//   //   onClick,
//   // });
//   // NotificationManager[type](undefined, msg, closesAfterMs);
// }
