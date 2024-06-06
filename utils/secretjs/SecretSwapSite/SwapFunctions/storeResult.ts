import BigNumber from "bignumber.js";
import {
  extractError,
} from "@/utils/secretjs/SecretSwapSite/blockchain-bridge/scrt/utils";
// import { RouteOutput } from '@/components/Swap/RouteRow';
import { humanizeBalance } from "@/utils/secretjs/SecretSwapSite/utils";
import { storeTxResultLocally } from "@/utils/secretjs/SecretSwapSite/Swap/utils";
import { TxResponse } from "secretjs";
import extractValueFromLogs from "@/utils/secretjs/SecretSwapSite/blockchain-bridge/scrt/utils/extractValueFromLogs";

export function storeResult(
  result: TxResponse,
  fromAmount: string,
  fromDecimals: number,
  bestRoute: string[],
  toDecimals: number,
) {
  if (result?.code) {
    const error = extractError(result);
    throw new Error(error);
  }

  storeTxResultLocally(result);

  const sent = humanizeBalance(
    new BigNumber(fromAmount),
    fromDecimals,
  ).toFixed();
  const received = humanizeBalance(
    new BigNumber(
      extractValueFromLogs(result, "return_amount", bestRoute != null),
    ),
    toDecimals,
  ).toFixed();

  const fromTokenFromTxn = extractValueFromLogs(result, "offer_asset", false);
  const toTokenFromTxn = extractValueFromLogs(result, "ask_asset", true);

  return { fromTokenFromTxn, toTokenFromTxn, sent, received };
}
