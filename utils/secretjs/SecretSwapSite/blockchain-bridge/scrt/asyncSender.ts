import { Coin, SecretNetworkClient } from "secretjs";
import retry from "async-await-retry";
import { sleep } from "../utils";
import { extractError } from "./utils";
import { HandleMsg } from "@shadeprotocol/shadejs";
class CustomError extends Error {
  public txHash: string;

  constructor(message?: string) {
    super(message);
    this.txHash = "";
  }
}

type StdFee = {
  amount: readonly Coin[];
  gas: number;
};

export class AsyncSender extends SecretNetworkClient {
  asyncExecute = async (
    contractAddress: string,
    senderAddress: string,
    handleMsg: HandleMsg,
    memo?: string,
    transferAmount?: readonly Coin[],
    fee?: StdFee,
  ) => {
    let tx;
    try {
      tx = await this.tx.compute.executeContract(
        {
          contract_address: contractAddress,
          msg: handleMsg,
          sender: senderAddress,
          sent_funds: [{
            denom: "uscrt",
            amount: transferAmount || "",
          } as Coin],
        },
        {
          memo,
          gasLimit: fee?.gas || 2000000,
          feeDenom: fee?.amount[0].denom || "uscrt",
          feeGranter: senderAddress,
        },
      );
    } catch (e) {
      console.error(`failed to broadcast tx: ${e}`);
      throw new CustomError("Failed to broadcast transaction");
    }

    try {
      // optimistic
      await sleep(3000);
      const res = await retry(
        async () => {
          const result = await this.query.getTx(tx.transactionHash);
          if (!result) {
            throw new Error("Transaction not found");
          }
          return result;
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
