import { Coin, SigningCosmWasmClient, StdFee } from "secretjs";
import retry from "async-await-retry";
import { sleep } from "../utils";
import stores from "stores";
import { extractError } from "./utils";
class CustomError extends Error {
  public txHash: string;

  constructor(message?: string) {
    super(message);
    this.txHash = "";
  }
}
const blacklistedTxs = ["burn"];

export class AsyncSender extends SigningCosmWasmClient {
  asyncExecute = async (
    contractAddress: string,
    handleMsg: object,
    memo?: string,
    transferAmount?: readonly Coin[],
    fee?: StdFee,
  ) => {
    let tx;
    const key = Object.keys(handleMsg)[0];
    if (
      globalThis.config.IS_MAINTENANCE === "true" &&
      blacklistedTxs.includes(key)
    ) {
      stores.user.setModalOpen(true);
      throw new CustomError(
        "We are working on add functionality back, please,try later.",
      );
    }
    try {
      tx = await this.execute(
        contractAddress,
        handleMsg,
        memo,
        transferAmount,
        fee,
      );
    } catch (e) {
      console.error(`failed to broadcast tx: ${e}`);
      throw new CustomError("Failed to broadcast transaction");
    }

    try {
      // optimistic
      await sleep(3000);
      const res = await retry(
        () => {
          return this.restClient.txById(tx.transactionHash);
        },
        undefined,
        { retriesMax: 5, interval: 6000 },
      );

      if (res?.code) {
        const error = extractError(res);
        throw new CustomError(error);
      }

      return {
        ...res,
        transactionHash: tx.transactionHash,
      };
    } catch (e) {
      console.error(`failed to broadcast tx: ${e}`);
      if ((e as Error).toString().includes("not found (HTTP 404)")) {
        e = new CustomError(
          `Timed out waiting for transaction. Your transaction is pending and may be processed soon. Check an explorer to confirm.`,
        );
      }
      // error.txHash = tx.transactionHash;
      throw e;
    }
  };
}
