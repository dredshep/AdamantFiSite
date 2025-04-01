import { debugKeplrQuery } from '@/lib/keplr/utils';
import { SecretNetworkClient } from 'secretjs';

interface GetStakedBalanceResult {
  staked_amount: string;
}

interface QueryErrorResponse {
  query_error?: {
    msg: string;
  };
}

/**
 * Parameters for getStakedBalance function
 */
export interface StakedBalanceParams {
  /** SecretNetworkClient instance */
  secretjs: SecretNetworkClient;
  /** LP token address */
  lpToken: string;
  /** Wallet address to check balance for */
  address: string;
  /** Viewing key for authenticated queries */
  viewingKey: string;
}

/**
 * Get the staked balance for a wallet address using a viewing key
 */
export const getStakedBalance = async (params: StakedBalanceParams): Promise<string> => {
  const { secretjs, lpToken, address, viewingKey } = params;

  if (secretjs === null) {
    throw new Error('SecretJS client is not available');
  }

  if (typeof viewingKey !== 'string' || viewingKey.trim() === '') {
    throw new Error('A valid viewing key is required');
  }

  const incentivesContractAddress = process.env['NEXT_PUBLIC_INCENTIVES_CONTRACT_ADDRESS'];
  const incentivesContractHash = process.env['NEXT_PUBLIC_INCENTIVES_CONTRACT_HASH'];

  if (typeof incentivesContractAddress !== 'string' || incentivesContractAddress.trim() === '') {
    throw new Error('Incentives contract address is not configured');
  }

  if (typeof incentivesContractHash !== 'string' || incentivesContractHash.trim() === '') {
    throw new Error('Incentives contract hash is not configured');
  }

  // Use enhanced error handling with debugKeplrQuery
  return debugKeplrQuery(
    async () => {
      console.log('Querying staked balance with viewing key:', {
        contract_address: incentivesContractAddress,
        code_hash: incentivesContractHash,
        query: {
          balance: {
            address: address,
            key: viewingKey, // Using the provided viewing key
          },
        },
      });

      try {
        // Execute authenticated query with viewing key
        const queryResult = await secretjs.query.compute.queryContract({
          contract_address: incentivesContractAddress,
          code_hash: incentivesContractHash,
          query: {
            balance: {
              address: address,
              key: viewingKey,
            },
          },
        });

        console.log('Staked balance result:', queryResult);

        // Handle different possible response formats
        if (queryResult !== null && typeof queryResult === 'object') {
          if ('staked_amount' in queryResult) {
            return (queryResult as GetStakedBalanceResult).staked_amount;
          }

          // Try to find the staked amount in the response
          const amount = Object.values(queryResult).find(
            (val): val is string => typeof val === 'string'
          );
          if (amount !== undefined) return amount;
        }

        // Throw error for unexpected response format
        throw new Error(
          `Invalid or unexpected response from contract: ${JSON.stringify(queryResult)}`
        );
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
            } catch (_parseError) {
              // If we can't parse it, just throw the original error
              throw error;
            }
          }

          // If we got a 500 error, the contract might not be deployed or accessible
          if (errorMessage.includes('500')) {
            throw new Error(
              `Contract not accessible at ${incentivesContractAddress}. ` +
                `The contract might not be deployed on this network or the code hash might be incorrect.`
            );
          }

          throw error; // Re-throw any other errors
        }

        throw error; // Re-throw any non-Error objects
      }
    },
    {
      operation: 'getStakedBalance',
      contractAddress: incentivesContractAddress,
      lpToken,
      userAddress: address,
      viewingKey: '[REDACTED]', // Don't log the actual viewing key
    }
  );
};
