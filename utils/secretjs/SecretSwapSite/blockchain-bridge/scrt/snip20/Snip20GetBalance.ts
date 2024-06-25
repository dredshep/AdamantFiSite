import { SecretNetworkClient } from "secretjs";
import { sleep } from "../../../utils"; // Ensure correct path to import
import { GetContractCodeHash } from "./GetContractCodeHash"; // Ensure correct path to import
export const unlockToken = "Unlock";

interface BalanceQueryResponse {
  balance?: {
    amount: string;
  };
  viewing_key_error?: string;
}

export const Snip20GetBalance = async (params: {
  secretjs: SecretNetworkClient;
  token: string;
  address: string;
  key: string;
}): Promise<string> => {
  const { secretjs, address, token, key } = params;

  const codeHash = await GetContractCodeHash({ secretjs, address: token });
  if (!codeHash) {
    throw new Error("Code hash not found for the specified address.");
  }

  let balanceResponse: BalanceQueryResponse | undefined;
  for (let i = 0; i < 4; i++) {
    try {
      const response = await secretjs.query.compute.queryContract({
        contract_address: token,
        code_hash: codeHash, // Use the fetched code hash
        query: {
          balance: {
            address,
            key,
          },
        },
      });
      balanceResponse = response as BalanceQueryResponse;
      break;
    } catch (err) {
      const e = err as Error;
      console.error(e);
      if (
        e.message !==
          "Failed to decrypt the following error message: rpc error: code = Unknown desc = contract: not found (HTTP 500)."
      ) {
        return unlockToken;
      }
      await sleep(1000);
    }
  }

  if (!balanceResponse) {
    throw new Error("Failed to get balance response after several attempts.");
  }

  if (balanceResponse.viewing_key_error) {
    return "Fix Unlock";
  }

  if (balanceResponse.balance && Number(balanceResponse.balance.amount) === 0) {
    return "0";
  }

  return balanceResponse.balance
    ? balanceResponse.balance.amount
    : "Unknown Balance";
};
