import { debugKeplrQuery } from '@/lib/keplr/utils';
import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';
import { SecretNetworkClient } from 'secretjs';
import {
  LPStakingQueryMsg,
  LPStakingQueryAnswer,
  isBalanceResponse,
  isQueryErrorResponse,
} from '@/types/secretswap/lp-staking';

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

  const lpStakingContract = getStakingContractInfo(lpToken);
  const lpStakingContractAddress = lpStakingContract?.stakingAddress;
  const lpStakingContractHash = lpStakingContract?.stakingCodeHash;

  if (typeof lpStakingContractAddress !== 'string' || lpStakingContractAddress.trim() === '') {
    throw new Error('lpStaking contract address is not configured');
  }

  if (typeof lpStakingContractHash !== 'string' || lpStakingContractHash.trim() === '') {
    throw new Error('lpStaking contract hash is not configured');
  }

  return debugKeplrQuery(
    async () => {
      const balanceQuery: LPStakingQueryMsg = {
        balance: {
          address: address,
          key: viewingKey,
        },
      };
      console.log('Querying staked balance with viewing key:', {
        contract_address: lpStakingContractAddress,
        code_hash: lpStakingContractHash,
        query: balanceQuery,
      });

      try {
        const queryResult = await secretjs.query.compute.queryContract({
          contract_address: lpStakingContractAddress,
          code_hash: lpStakingContractHash,
          query: balanceQuery,
        });

        console.log('Staked balance result:', queryResult);

        const parsedResult = queryResult as LPStakingQueryAnswer;

        // Handle different possible response formats
        if (isBalanceResponse(parsedResult)) {
          return parsedResult.balance.amount;
        } else if (isQueryErrorResponse(parsedResult)) {
          throw new Error(`Query error: ${parsedResult.query_error.msg}`);
        } else {
          throw new Error(
            `Invalid or unexpected response from contract: ${JSON.stringify(queryResult)}`
          );
        }
      } catch (error) {
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
              const parsedError = JSON.parse(
                errorMessage.substring(errorMessage.indexOf('{'), errorMessage.lastIndexOf('}') + 1)
              ) as LPStakingQueryAnswer;

              if (isQueryErrorResponse(parsedError)) {
                throw new Error(`Contract query error: ${parsedError.query_error.msg}`);
              }
            } catch (_parseError) {
              // If we can't parse it, just throw the original error
              throw error;
            }
          }

          // If we got a 500 error, the contract might not be deployed or accessible
          if (errorMessage.includes('500')) {
            throw new Error(
              `Contract not accessible at ${lpStakingContractAddress}. ` +
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
      contractAddress: lpStakingContractAddress,
      lpToken,
      userAddress: address,
      viewingKey: '[REDACTED]', // Don't log the actual viewing key
    }
  );
};
