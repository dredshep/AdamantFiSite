import { debugKeplrQuery } from '@/lib/keplr/utils';
import { useViewingKeyStore } from '@/store/viewingKeyStore';
import {
  LPStakingQueryAnswer,
  LPStakingQueryMsg,
  isQueryErrorResponse,
  isRewardsResponse,
} from '@/types/secretswap/lp-staking';
import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';
import { showToastOnce } from '@/utils/toast/toastManager';
import { SecretNetworkClient, TxResultCode } from 'secretjs';

/**
 * Parameters for getRewards function
 */
export interface GetRewardsParams {
  /** SecretNetworkClient instance */
  secretjs: SecretNetworkClient;
  /** LP token address (used for registry lookup) */
  lpToken: string;
  /** Wallet address to check rewards for */
  address: string;
  /** Viewing key for authenticated queries */
  viewingKey: string;
  /** Optional block height for the query (will fetch latest if not provided) */
  height?: number | string;
  /** Optional: Direct staking contract address (bypasses registry lookup) */
  stakingContractAddress?: string;
  /** Optional: Direct staking contract code hash (bypasses registry lookup) */
  stakingContractCodeHash?: string;
}

/**
 * Get the pending rewards for a wallet address using a viewing key
 */
export async function getRewards(params: GetRewardsParams): Promise<string> {
  const {
    secretjs,
    lpToken,
    address,
    viewingKey,
    stakingContractAddress,
    stakingContractCodeHash,
  } = params;

  if (viewingKey.trim() === '') {
    throw new Error('A valid viewing key is required');
  }

  // Use direct contract info if provided, otherwise fall back to registry lookup
  let lpStakingContractAddress: string;
  let lpStakingContractHash: string;

  if (stakingContractAddress && stakingContractCodeHash) {
    lpStakingContractAddress = stakingContractAddress;
    lpStakingContractHash = stakingContractCodeHash;
  } else {
    const lpStakingContract = getStakingContractInfo(lpToken);
    lpStakingContractAddress = lpStakingContract?.stakingAddress || '';
    lpStakingContractHash = lpStakingContract?.stakingCodeHash || '';
  }

  if (typeof lpStakingContractAddress !== 'string' || lpStakingContractAddress.trim() === '') {
    throw new Error('lpStaking contract address is not configured');
  }

  if (typeof lpStakingContractHash !== 'string' || lpStakingContractHash.trim() === '') {
    throw new Error('lpStaking contract hash is not configured');
  }

  // Use provided height or get the latest block height
  let height: number;

  if (params.height !== undefined) {
    // Use the provided height, ensuring it's a number
    height = typeof params.height === 'string' ? parseInt(params.height, 10) : params.height;
  } else {
    // Get the latest block height
    const blockResponse = await secretjs.query.tendermint.getLatestBlock({});
    const rawHeight = blockResponse.block?.header?.height;

    // Return early with an error if height is undefined
    if (rawHeight === undefined) {
      throw new Error('Failed to get latest block height');
    }

    // Parse the height to ensure it's a number
    height = typeof rawHeight === 'string' ? parseInt(rawHeight, 10) : rawHeight;
  }

  return debugKeplrQuery(
    async () => {
      // Ensure height is definitely a number before creating the query
      // Blockchain dev suggested this might fix the 0 rewards issue
      const numericHeight = Number(height);
      if (!Number.isInteger(numericHeight) || numericHeight <= 0) {
        throw new Error(`Invalid block height: ${height} (converted to: ${numericHeight})`);
      }

      const rewardsQuery: LPStakingQueryMsg = {
        rewards: {
          address: address,
          key: viewingKey,
          height: numericHeight, // Explicitly ensure this is a number, not a string
        },
      };

      // console.log('🎁 Rewards query:', rewardsQuery);
      // console.log('🔢 Height type verification:', {
      //   originalHeight: height,
      //   numericHeight,
      //   heightType: typeof numericHeight,
      //   isInteger: Number.isInteger(numericHeight)
      // });

      // console.log('Querying rewards with viewing key:', {
      //   contract_address: lpStakingContractAddress,
      //   code_hash: lpStakingContractHash,
      //   query: rewardsQuery,
      // });

      try {
        const queryResult = await secretjs.query.compute.queryContract({
          contract_address: lpStakingContractAddress,
          code_hash: lpStakingContractHash,
          query: rewardsQuery,
        });

        // console.log('Rewards query result:', queryResult);

        const parsedResult = queryResult as LPStakingQueryAnswer;

        // Handle different possible response formats
        if (isRewardsResponse(parsedResult)) {
          const rawRewards = parsedResult.rewards.rewards;
          // log query
          // console.log('🎁 Rewards query:', rewardsQuery);
          // // log response
          // console.log('🎁 Raw rewards from contract:', {
          //   rawRewards,
          //   type: typeof rawRewards,
          //   parsed: parseInt(rawRewards),
          //   withDecimals: parseInt(rawRewards) / 1_000_000,
          // });
          return rawRewards;
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
            console.log('🔑 Viewing key authentication failed:', { errorMessage });

            const generateRandomKey = () => {
              const randomBytes = new Uint8Array(32);
              crypto.getRandomValues(randomBytes);
              return Array.from(randomBytes)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
            };

            const handleCreateKey = async () => {
              try {
                const newKey = generateRandomKey();
                const setViewingKeyMsg = {
                  set_viewing_key: {
                    key: newKey,
                  },
                };

                showToastOnce(
                  'create-vk-info',
                  'Please approve the transaction in Keplr to create a new viewing key.',
                  'info',
                  { autoClose: 10000 }
                );

                const result = await secretjs.tx.compute.executeContract(
                  {
                    sender: secretjs.address,
                    contract_address: lpStakingContractAddress,
                    code_hash: lpStakingContractHash,
                    msg: setViewingKeyMsg,
                    sent_funds: [],
                  },
                  {
                    gasLimit: 150_000,
                  }
                );

                if (result.code === TxResultCode.Success) {
                  useViewingKeyStore.getState().setViewingKey(lpStakingContractAddress, newKey);
                  showToastOnce('create-vk-success', 'Viewing key created!', 'success', {
                    message: `Your new key is: ${newKey}. Please copy it and save it securely.`,
                    actionLabel: 'Copy Key',
                    onAction: () => {
                      navigator.clipboard
                        .writeText(newKey)
                        .then(() => {
                          showToastOnce('copy-success', 'Key copied to clipboard!', 'success');
                        })
                        .catch((err) => {
                          console.error('Failed to copy key: ', err);
                          showToastOnce('copy-error', 'Failed to copy key.', 'error');
                        });
                    },
                    autoClose: false,
                  });
                } else {
                  throw new Error(`Failed to set viewing key: ${result.rawLog}`);
                }
              } catch (error) {
                console.error('Error creating viewing key:', error);
                const message = error instanceof Error ? error.message : String(error);
                showToastOnce(
                  'create-vk-error',
                  `Failed to create viewing key: ${message}`,
                  'error'
                );
              }
            };
            // let's log our old key:
            console.log('🔑 Old viewing key:', viewingKey);

            showToastOnce('staking-vk-error', 'Viewing Key Error', 'error', {
              message:
                'The viewing key for this staking pool is invalid or not set. You can create a new one.',
              actionLabel: 'Create New Key',
              onAction: () => {
                void handleCreateKey();
              },
              autoClose: false,
            });

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
      operation: 'getRewards',
      contractAddress: lpStakingContractAddress,
      userAddress: address,
      viewingKey: '[REDACTED]', // Don't log the actual viewing key
    }
  );
}
