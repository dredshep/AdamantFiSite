import { SecretNetworkClient } from 'secretjs';

export async function getTokenBalance(
  secretjs: SecretNetworkClient,
  tokenAddress: string,
  tokenCodeHash: string,
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

    const result = await secretjs.query.compute.queryContract<QueryArgs, QueryResult>({
      contract_address: tokenAddress,
      code_hash: tokenCodeHash,
      query: { balance: { address: walletAddress, key: viewingKey } },
    });

    return result.balance;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return '0';
  }
}
