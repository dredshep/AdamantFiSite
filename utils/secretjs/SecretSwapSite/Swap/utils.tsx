import BigNumber from "bignumber.js";
import { humanizeBalance } from "@/utils/secretjs/SecretSwapSite/utils";
import { TxResponse } from "secretjs";

export function compareNormalize(
  number1: BigNumber.Value,
  number2: { amount: BigNumber.Value; decimals: number }
): boolean {
  return humanizeBalance(
    new BigNumber(number2.amount as any),
    number2.decimals
  ).isLessThan(new BigNumber(number1));
}

export function storeTxResultLocally(txResult: TxResponse) {
  if (!localStorage || !localStorage.setItem || !txResult.transactionHash) {
    return;
  }
  const result = {
    data: new TextDecoder().decode(Uint8Array.from(txResult.data.flatMap((arr) => Array.from(arr)))),
    logs: txResult.arrayLog,
  };
  localStorage.setItem(txResult.transactionHash, JSON.stringify(result));
}

export const shareOfPoolNumberFormat = new Intl.NumberFormat("en", {
  maximumFractionDigits: 10,
});
