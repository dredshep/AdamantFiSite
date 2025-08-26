// Inline truncate function to avoid linter issues
const safeTruncateAddress = (address: string): string => {
  const startChars = 8;
  const endChars = 6;
  if (address.length <= startChars + endChars + 3) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
import { SecretNetworkClient } from 'secretjs';

export async function getTokenBalance(
  secretjs: SecretNetworkClient,
  tokenAddress: string,
  tokenCodeHash: string,
  walletAddress: string,
  viewingKey: string
): Promise<string> {
  interface QueryResult {
    balance: string;
  }

  interface QueryArgs {
    balance: {
      address: string;
      key: string;
    };
  }

  try {
    const result = await secretjs.query.compute.queryContract<QueryArgs, QueryResult>({
      contract_address: tokenAddress,
      code_hash: tokenCodeHash,
      query: { balance: { address: walletAddress, key: viewingKey } },
    });

    return result.balance;
  } catch (error) {
    console.error('Error fetching token balance:', error);

    // Check if this is a viewing key related error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isViewingKeyError =
      errorMessage.toLowerCase().includes('viewing key') ||
      errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('invalid key') ||
      errorMessage.toLowerCase().includes('wrong viewing key');

    if (isViewingKeyError) {
      const truncatedAddress = safeTruncateAddress(tokenAddress);
      throw new Error(
        `Invalid or missing viewing key for token ${truncatedAddress}: ${errorMessage}`
      );
    }

    // For other types of errors, still throw them instead of silent zero
    const truncatedAddress = safeTruncateAddress(tokenAddress);
    throw new Error(`Failed to fetch balance for token ${truncatedAddress}: ${errorMessage}`);
  }
}
