import { SecretNetworkClient, TxResponse } from "secretjs";
import { Snip20Send } from "./Snip20Send"; // Ensure correct path to import Snip20Send
import { GetContractCodeHash } from "./GetContractCodeHash"; // Ensure correct path to import
import useGlobalConfigStore from "@/store/useGlobalConfigStore";

export const Snip20SendToBridge = async (params: {
  secretjs: SecretNetworkClient;
  address: string;
  amount: string;
  msg: string;
  recipient?: string;
  fee?: { amount: [{ amount: string; denom: string }]; gas: string };
}): Promise<string> => {
  const { SCRT_SWAP_CONTRACT } = useGlobalConfigStore().config;
  const recipientAddress = params.recipient || SCRT_SWAP_CONTRACT;

  // Fetch the code hash of the recipient contract
  const codeHash = await GetContractCodeHash({
    secretjs: params.secretjs,
    address: recipientAddress,
  });
  if (!codeHash) {
    throw new Error("Code hash not found for the specified recipient address.");
  }

  const tx: TxResponse = await Snip20Send({
    ...params,
    recipient: recipientAddress,
  });

  // Parse the transaction logs to find the tx_id
  let tx_id: string | undefined;
  if (tx.arrayLog) {
    const txIdKvp = tx.arrayLog.find((kv) => kv.key === "tx_id");
    if (txIdKvp) {
      tx_id = txIdKvp.value;
    }
  }

  if (!tx_id && tx.jsonLog) {
    for (const log of tx.jsonLog) {
      const txIdKvp = log.events.find((event) => event.type === "wasm")
        ?.attributes.find((kv) => kv.key === "tx_id");
      if (txIdKvp) {
        tx_id = txIdKvp.value;
        break;
      }
    }
  }

  if (!tx_id) {
    throw new Error("Failed to get tx_id");
  }

  return tx_id;
};
