import { SecretNetworkClient } from "secretjs";

export async function getTokenBalance(
  secretjs: SecretNetworkClient,
  tokenAddress: string,
  walletAddress: string,
  viewingKey: string
): Promise<string> {
  try {
    interface QueryResult {
      balance: string;
    }

    interface QueryArgs {
      balance: {
        address: string;
        key: string;
      };
    }

    const result = await secretjs.query.compute.queryContract<
      QueryArgs,
      QueryResult
    >({
      contract_address: tokenAddress,
      code_hash:
        "0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490", // Replace with actual code hash
      query: { balance: { address: walletAddress, key: viewingKey } },
    });

    return result.balance;
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return "0";
  }
}
