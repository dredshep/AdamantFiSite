import { debugKeplrQuery } from '@/lib/keplr/utils';
import { useViewingKeyStore } from '@/store/viewingKeyStore';
import {
  LPStakingQueryAnswer,
  LPStakingQueryMsg,
  isQueryErrorResponse,
  isRewardsResponse,
} from '@/types/secretswap/lp-staking';
import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';
import { removeToast, showToastOnce, viewingKeyErrorAggregator } from '@/utils/toast/toastManager';
import { Window } from '@keplr-wallet/types';
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
export async function getRewards(params: GetRewardsParams): Promise<string | null> {
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

            const _handleCreateKey = async () => {
              try {
                // Clear any existing error toasts first
                removeToast('lp-token-vk-error');

                const newKey = generateRandomKey();
                const setViewingKeyMsg = {
                  set_viewing_key: {
                    key: newKey,
                  },
                };

                // Step 1: Inform user about the two-step process
                showToastOnce(
                  'create-vk-step1',
                  'Step 1/2: Creating LP Token Viewing Key',
                  'info',
                  {
                    message:
                      'Please approve the first transaction in Keplr to create your LP token viewing key.',
                    autoClose: false,
                  }
                );

                // Step 1: Create viewing key for the LP token (primary source of truth)
                const lpTokenStakingInfo = getStakingContractInfo(lpToken);
                if (!lpTokenStakingInfo) {
                  throw new Error('LP token staking info not found');
                }

                const lpTokenResult = await secretjs.tx.compute.executeContract(
                  {
                    sender: secretjs.address,
                    contract_address: lpToken,
                    code_hash: lpTokenStakingInfo.lpTokenCodeHash,
                    msg: setViewingKeyMsg,
                    sent_funds: [],
                  },
                  {
                    gasLimit: 150_000,
                  }
                );

                if (lpTokenResult.code !== TxResultCode.Success) {
                  throw new Error(`Failed to set LP token viewing key: ${lpTokenResult.rawLog}`);
                }

                // Clear step 1 toast and show step 2
                removeToast('create-vk-step1');
                showToastOnce(
                  'create-vk-step2',
                  'Step 2/2: Syncing with Staking Contract',
                  'info',
                  {
                    message:
                      'Please approve the second transaction to sync with the staking contract.',
                    autoClose: false,
                  }
                );

                // Step 2: Set the same viewing key on the staking contract to keep them in sync
                const stakingResult = await secretjs.tx.compute.executeContract(
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

                // Clear step 2 toast
                removeToast('create-vk-step2');

                if (stakingResult.code !== TxResultCode.Success) {
                  console.warn(
                    'Failed to sync staking contract viewing key, but LP token key was created successfully'
                  );
                  // Show partial success message
                  showToastOnce(
                    'create-vk-partial-success',
                    'LP Token viewing key created!',
                    'warning',
                    {
                      message:
                        'Your LP token key was created, but staking sync failed. LP functions should still work.',
                      actionLabel: 'Copy Key',
                      onAction: () => {
                        navigator.clipboard
                          .writeText(newKey)
                          .then(() => {
                            showToastOnce('copy-success', 'Key copied!', 'success', {
                              autoClose: 3000,
                            });
                          })
                          .catch(() => {
                            showToastOnce('copy-error', 'Failed to copy key.', 'error', {
                              autoClose: 3000,
                            });
                          });
                      },
                      autoClose: 8000,
                    }
                  );
                } else {
                  // Full success
                  showToastOnce(
                    'create-vk-complete-success',
                    'Viewing keys setup complete!',
                    'success',
                    {
                      message:
                        'Your LP token viewing key has been created and synced. You can now use all staking features.',
                      actionLabel: 'Copy Key',
                      onAction: () => {
                        navigator.clipboard
                          .writeText(newKey)
                          .then(() => {
                            showToastOnce('copy-success', 'Key copied!', 'success', {
                              autoClose: 3000,
                            });
                          })
                          .catch(() => {
                            showToastOnce('copy-error', 'Failed to copy key.', 'error', {
                              autoClose: 3000,
                            });
                          });
                      },
                      autoClose: 8000,
                    }
                  );
                }

                // Store the viewing key for the staking contract (for backward compatibility)
                useViewingKeyStore.getState().setViewingKey(lpStakingContractAddress, newKey);
              } catch (error) {
                // Clear any progress toasts on error
                removeToast('create-vk-step1');
                removeToast('create-vk-step2');
                removeToast('lp-token-vk-error');

                console.error('Error creating viewing key:', error);
                const message = error instanceof Error ? error.message : String(error);

                // Show user-friendly error message
                let userMessage = 'Failed to create viewing key.';
                if (message.includes('rejected') || message.includes('denied')) {
                  userMessage =
                    'Transaction was rejected. Please try again and approve both transactions.';
                } else if (message.includes('insufficient')) {
                  userMessage =
                    'Insufficient gas fees. Please ensure you have enough SCRT for transaction fees.';
                }

                showToastOnce('create-vk-final-error', userMessage, 'error', {
                  message: 'You can try again or contact support if the problem persists.',
                  actionLabel: 'Retry',
                  onAction: () => {
                    removeToast('create-vk-final-error');
                    void _handleCreateKey();
                  },
                  autoClose: false,
                });
              }
            };
            // let's log our old key:
            console.log('🔑 Old viewing key:', viewingKey);

            // Use aggregation system instead of individual toast
            // Note: This error is from the STAKING contract, not the LP token
            viewingKeyErrorAggregator.addError({
              tokenAddress: lpStakingContractAddress,
              tokenSymbol: 'Staking Contract',
              errorType: 'required',
              isLpToken: false, // This is a staking contract error, not LP token
              timestamp: Date.now(),
              onSyncKey: () => {
                // Auto-sync functionality: copy LP token viewing key to staking contract
                void (async () => {
                  try {
                    const keplr = (window as unknown as Window).keplr;
                    if (!keplr) return;

                    // Get LP token viewing key
                    const lpKey = await keplr.getSecret20ViewingKey('secret-4', lpToken);
                    if (!lpKey) return;

                    // Set the same key on staking contract
                    const setViewingKeyMsg = { set_viewing_key: { key: lpKey } };

                    const result = await secretjs.tx.compute.executeContract(
                      {
                        sender: secretjs.address,
                        contract_address: lpStakingContractAddress,
                        code_hash: lpStakingContractHash,
                        msg: setViewingKeyMsg,
                        sent_funds: [],
                      },
                      { gasLimit: 150_000 }
                    );

                    if (result.code === TxResultCode.Success) {
                      showToastOnce('sync-success', 'Viewing key synced!', 'success', {
                        message:
                          'Your LP token viewing key has been successfully synced to the staking contract.',
                        autoClose: 5000,
                      });
                    }
                  } catch (error) {
                    console.error('Auto-sync failed:', error);
                    showToastOnce('sync-error', 'Sync failed', 'error', {
                      message: 'Failed to sync viewing key. Please try manually.',
                      autoClose: 5000,
                    });
                  }
                })();
              },
            });

            // Auto creation disabled - user requested no auto sync
            // void _handleCreateKey();

            // Return null instead of throwing to avoid unhandled runtime errors
            return null;
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
