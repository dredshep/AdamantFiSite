import { debugKeplrQuery } from '@/lib/keplr/utils';
import { ContractInfo } from '@/types/secretswap/shared';
import { SecretNetworkClient } from 'secretjs';

interface RewardsResponse {
  pending_rewards: string;
}

interface QueryErrorResponse {
  query_error?: {
    msg: string;
  };
}

/**
 * Parameters for getRewards function
 */
export interface GetRewardsParams {
  /** SecretNetworkClient instance */
  secretjs: SecretNetworkClient;
  /** Staking contract info */
  lpStakingContract: ContractInfo;
  /** Wallet address to check rewards for */
  address: string;
  /** Viewing key for authenticated queries */
  viewingKey: string;
  /** Current block height (optional, defaults to latest) */
  height?: number;
}

/**
 * Get the pending rewards for a wallet address using a viewing key
 */
export async function getRewards(params: GetRewardsParams): Promise<string> {
  const { secretjs, lpStakingContract, address, viewingKey, height = 1 } = params;

  if (secretjs === null) {
    throw new Error('SecretJS client is not available');
  }

  if (typeof viewingKey !== 'string' || viewingKey.trim() === '') {
    throw new Error('A valid viewing key is required');
  }

  return debugKeplrQuery(
    async () => {
      console.log('Querying rewards with viewing key:', {
        contract_address: lpStakingContract.address,
        code_hash: lpStakingContract.code_hash,
        query: {
          rewards: {
            address: address,
            key: viewingKey,
            height: height,
          },
        },
      });

      try {
        // Execute authenticated query with viewing key
        const result = await secretjs.query.compute.queryContract({
          contract_address: lpStakingContract.address,
          code_hash: lpStakingContract.code_hash,
          query: {
            rewards: {
              address: address,
              key: viewingKey,
              height: height,
            },
          },
        });

        console.log('Rewards query result:', result);

        // Handle different possible response formats
        if (result !== null && typeof result === 'object') {
          if ('pending_rewards' in result) {
            return (result as RewardsResponse).pending_rewards;
          }

          // Try to find the rewards amount in the response
          const rewards = Object.values(result).find(
            (val): val is string => typeof val === 'string'
          );
          if (rewards !== undefined) {
            return rewards;
          }
        }

        // Throw error for unexpected response format
        throw new Error(`Invalid or unexpected response from contract: ${JSON.stringify(result)}`);
      } catch (error) {
        // Check if the error is a viewing key error
        if (error instanceof Error) {
          const errorMessage = error.message;

          // For viewing key errors, provide a more helpful message
          if (errorMessage.includes('viewing key') || errorMessage.includes('unauthorized')) {
            throw new Error(
              `Viewing key authentication failed: The provided viewing key is incorrect or not authorized for this address.`
            );
          }

          // For other errors, try to parse the response
          if (errorMessage.includes('query_error')) {
            try {
              const errorData = JSON.parse(
                errorMessage.substring(errorMessage.indexOf('{'), errorMessage.lastIndexOf('}') + 1)
              ) as QueryErrorResponse;

              if (
                errorData.query_error &&
                errorData.query_error.msg &&
                errorData.query_error.msg.trim() !== ''
              ) {
                throw new Error(`Contract query error: ${errorData.query_error.msg}`);
              }
            } catch (_) {
              // If we can't parse it, just throw the original error
              throw error;
            }
          }

          // If we got a 500 error, the contract might not be deployed or accessible
          if (errorMessage.includes('500')) {
            throw new Error(
              `Contract not accessible at ${lpStakingContract.address}. ` +
                `The contract might not be deployed on this network or the code hash might be incorrect.`
            );
          }

          throw error; // Re-throw any other errors
        }

        throw error; // Re-throw any non-Error objects
      }
    },
    {
      operation: 'getRewards',
      contractAddress: lpStakingContract.address,
      userAddress: address,
      viewingKey: '[REDACTED]', // Don't log the actual viewing key
    }
  );
}
