import { SecretNetworkClient, TxResponse } from "secretjs";

export const Snip20Send = async (params: {
  secretjs: SecretNetworkClient;
  address: string;
  amount: string;
  msg: string;
  recipient: string;
  fee?: { amount: [{ amount: string; denom: string }]; gas: string };
}): Promise<TxResponse> => {
  const { secretjs, address, amount, msg, recipient, fee } = params;

  const executeMsg = {
    send: {
      amount,
      recipient,
      msg,
    },
  };

  const tx = await secretjs.tx.compute.executeContract(
    {
      sender: address,
      contract_address: recipient,
      code_hash: "", // Provide the correct code hash here
      msg: executeMsg,
      sent_funds: [],
    },
    {
      gasLimit: fee?.gas ? parseInt(fee.gas) : 200000,
      gasPriceInFeeDenom: fee?.amount?.[0]?.amount
        ? parseFloat(fee.amount[0].amount)
        : 0.25, // Convert gas price to number
      feeDenom: fee?.amount?.[0]?.denom || "uscrt",
    },
  );

  return tx;
};
