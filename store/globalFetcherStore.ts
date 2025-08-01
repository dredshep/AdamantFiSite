import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { TokenService } from '@/services/secret/TokenService';
import { SecretString } from '@/types';
import {
  LPStakingQueryAnswer,
  LPStakingQueryMsg,
  isBalanceResponse,
  isQueryErrorResponse,
} from '@/types/secretswap/lp-staking';
import { getAllStakingPools } from '@/utils/staking/stakingRegistry';
import { SecretNetworkClient } from 'secretjs';
import { create } from 'zustand';
import { useWalletStore } from './walletStore';

// Define the types of tasks our queue can handle
export enum FetcherTaskType {
  TOKEN_BALANCE = 'TOKEN_BALANCE',
  POOL_DATA_BUNDLE = 'POOL_DATA_BUNDLE',
}

// Define the structure of a task in the queue
interface FetcherTask {
  type: FetcherTaskType;
  key: string; // e.g., a contract address
  caller: string;
  priority: 'high' | 'normal' | 'low';
}

// Data state structure for each type
interface DataState<T> {
  value: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  needsViewingKey: boolean;
}

// TVL data structure
interface TvlData {
  totalUsd: number;
}

// Pool data response structure
interface PoolAsset {
  info: {
    token?: {
      contract_addr: string;
      token_code_hash: string;
    };
    native_token?: {
      denom: string;
    };
  };
  amount: string;
}

interface PoolQueryResponse {
  assets: PoolAsset[];
  total_share: string;
}

// The global store state
interface GlobalFetcherState {
  // Data maps for each type
  tokenBalances: Record<string, DataState<string>>;
  stakedBalances: Record<string, DataState<string>>;
  poolTvl: Record<string, DataState<TvlData | null>>;

  // Queue management
  queue: FetcherTask[];
  isProcessing: boolean;

  // Global delay modifier (between batches, not individual requests)
  fetchDelayMs: number;

  // NEW: Concurrency control
  maxConcurrentRequests: number; // How many requests can run simultaneously
  currentActiveRequests: number; // Track active requests

  // SecretJS client
  secretjs: SecretNetworkClient | null;

  // Actions
  setFetchDelayMs: (delay: number) => void;
  setMaxConcurrentRequests: (limit: number) => void; // NEW
  setSecretjs: (client: SecretNetworkClient | null) => void;
  enqueueTask: (task: Omit<FetcherTask, 'priority'>, priority?: 'high' | 'normal' | 'low') => void;
  processQueue: () => Promise<void>;
  processSingleTask: (task: FetcherTask) => Promise<void>; // NEW

  // Helper getters
  getTokenBalance: (address: string) => DataState<string>;
  getStakedBalance: (address: string) => DataState<string>;
  getPoolTvl: (address: string) => DataState<TvlData | null>;
}

// Default state for any data item
const createDefaultState = <T>(): DataState<T> => ({
  value: null,
  loading: false,
  error: null,
  lastUpdated: 0,
  needsViewingKey: false,
});

// Helper to get pool config by address
function getPoolConfigByAddress(poolAddress: string) {
  const pairInfo = LIQUIDITY_PAIRS.find((p) => p.pairContract === poolAddress);
  const stakingInfo = getAllStakingPools().find((s) => s.poolAddress === poolAddress);

  return {
    lpTokenAddress: pairInfo?.lpToken,
    stakingContractAddress: stakingInfo?.stakingInfo.stakingAddress,
    stakingContractCodeHash: stakingInfo?.stakingInfo.stakingCodeHash,
    pairInfo,
    stakingInfo,
  };
}

// Individual fetch functions
async function fetchTokenBalance(tokenAddress: string): Promise<string> {
  console.log('🔍 fetchTokenBalance started for:', tokenAddress);

  const walletAddress = useWalletStore.getState().address;
  if (!walletAddress) {
    console.error('🔍 fetchTokenBalance - Wallet not connected');
    throw new Error('Wallet not connected');
  }
  console.log('🔍 fetchTokenBalance - Wallet address:', walletAddress);

  const regularToken = TOKENS.find((t) => t.address === tokenAddress);
  const lpPair = LIQUIDITY_PAIRS.find((p) => p.lpToken === tokenAddress);
  console.log('🔍 fetchTokenBalance - Token lookup:', {
    regularToken: regularToken ? regularToken.symbol : null,
    lpPair: lpPair ? `${lpPair.token0}/${lpPair.token1}` : null,
  });

  if (!regularToken && !lpPair) {
    console.error('🔍 fetchTokenBalance - Token not found in config');
    throw new Error('Token not found');
  }

  const tokenService = new TokenService();
  const codeHash = regularToken?.codeHash || lpPair?.lpTokenCodeHash;
  const decimals = regularToken?.decimals || 6; // LP tokens default to 6 decimals

  if (!codeHash) {
    console.error('🔍 fetchTokenBalance - Code hash not found for token');
    throw new Error('Code hash not found for token');
  }

  console.log('🔍 fetchTokenBalance - Using TokenService with:', {
    tokenAddress,
    codeHash,
    decimals,
  });

  const rawBalance = await tokenService.getBalance(
    tokenAddress,
    codeHash,
    'globalFetcher',
    `gf-${Date.now()}`
  );

  console.log('🔍 fetchTokenBalance - Raw balance received:', rawBalance);
  const humanBalance = (Number(rawBalance) / Math.pow(10, decimals)).toString();
  console.log('🔍 fetchTokenBalance - Human balance calculated:', humanBalance);

  return humanBalance;
}

async function fetchStakedBalance(
  stakingContractAddress: string,
  stakingContractCodeHash: string,
  secretjs: SecretNetworkClient,
  viewingKey: string
): Promise<string> {
  const walletAddress = useWalletStore.getState().address;
  if (!walletAddress) {
    throw new Error('Wallet not connected');
  }

  const queryMsg: LPStakingQueryMsg = {
    balance: {
      address: walletAddress,
      key: viewingKey,
    },
  };

  const result = await secretjs.query.compute.queryContract({
    contract_address: stakingContractAddress,
    code_hash: stakingContractCodeHash,
    query: queryMsg,
  });

  const parsedResult = result as LPStakingQueryAnswer;

  if (isBalanceResponse(parsedResult)) {
    const rawBalance = parsedResult.balance.amount;
    const humanBalance = (Number(rawBalance) / 1_000_000).toString();
    return humanBalance;
  } else if (isQueryErrorResponse(parsedResult)) {
    throw new Error(`Query error: ${parsedResult.query_error.msg}`);
  } else {
    throw new Error(`Unexpected response format: ${JSON.stringify(result)}`);
  }
}

async function fetchPoolTvl(
  poolAddress: string,
  secretjs: SecretNetworkClient
): Promise<TvlData | null> {
  try {
    // Find the pool configuration
    const poolConfig = getPoolConfigByAddress(poolAddress);
    if (!poolConfig.pairInfo) {
      console.warn(`Pool configuration not found for ${poolAddress}. TVL will be unavailable.`);
      return null;
    }

    if (!secretjs) {
      console.warn(`SecretJS client not available for ${poolAddress}. TVL will be unavailable.`);
      return null;
    }

    // Query the pool contract directly using the existing client
    const poolData = await secretjs.query.compute.queryContract<
      { pool: object },
      PoolQueryResponse
    >({
      contract_address: poolAddress,
      code_hash: poolConfig.pairInfo.pairContractCodeHash,
      query: { pool: {} },
    });

    if (!poolData.assets || !Array.isArray(poolData.assets) || poolData.assets.length !== 2) {
      console.warn(`Invalid pool data structure for ${poolAddress}. TVL will be unavailable.`);
      return null;
    }

    // For sSCRT/USDC.nbl pairs, we can use USDC as the base since it's ~$1
    if (poolConfig.pairInfo.symbol === 'sSCRT/USDC.nbl') {
      // Find the USDC asset
      const usdcAsset = poolData.assets.find((asset: PoolAsset) => {
        return (
          asset.info.token &&
          (poolConfig.pairInfo?.token1 === 'USDC.nbl' ||
            asset.info.token.contract_addr.includes('usdc'))
        );
      });

      if (usdcAsset) {
        // USDC has 6 decimals, convert to human readable
        const usdcReserve = parseFloat(usdcAsset.amount) / 1_000_000;

        // Total pool TVL = USDC reserve * 2 (assuming roughly equal value in both sides)
        const totalTvlUsd = usdcReserve * 2;

        return { totalUsd: totalTvlUsd };
      }
    }

    // For other pairs, implement basic TVL calculation
    // This is a simplified approach - in production you'd want real price feeds
    const reserve0 = parseFloat(poolData.assets[0]?.amount || '0');
    const reserve1 = parseFloat(poolData.assets[1]?.amount || '0');

    // Use a placeholder calculation for now
    // TODO: Integrate with proper price feeds (CoinGecko, etc.)
    const estimatedTvl = Math.max(reserve0, reserve1) / 1_000_000; // Rough estimate using larger reserve

    return { totalUsd: estimatedTvl };
  } catch (error) {
    console.warn(`Error fetching TVL for pool ${poolAddress}:`, error, 'TVL will be unavailable.');
    return null;
  }
}

// Create the global store
export const useGlobalFetcherStore = create<GlobalFetcherState>((set, get) => ({
  tokenBalances: {},
  stakedBalances: {},
  poolTvl: {},
  queue: [],
  isProcessing: false,
  fetchDelayMs: 30, // 30ms delay between batches to avoid 429 errors
  maxConcurrentRequests: 1, // Process one at a time to respect rate limits
  currentActiveRequests: 0,
  secretjs: null, // Initialize secretjs

  setFetchDelayMs: (delay: number) => set({ fetchDelayMs: delay }),
  setMaxConcurrentRequests: (limit: number) => set({ maxConcurrentRequests: limit }),
  setSecretjs: (client: SecretNetworkClient | null) => set({ secretjs: client }),

  enqueueTask: (task, priority = 'normal') => {
    const state = get();
    const fullTask: FetcherTask = { ...task, priority };

    console.log('🔄 ENQUEUE TASK:', {
      type: task.type,
      key: task.key,
      caller: task.caller,
      priority,
      timestamp: new Date().toISOString(),
    });

    // Check if already in queue
    if (state.queue.some((t) => t.type === task.type && t.key === task.key)) {
      console.log('⚠️ Task already in queue, skipping:', task.type, task.key);
      return;
    }

    // Add to queue and sort by priority
    set((s) => {
      const newQueue = [...s.queue, fullTask];
      newQueue.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      console.log('📋 Queue updated, new length:', newQueue.length);
      return { queue: newQueue };
    });

    // Start processing if not already running
    if (!state.isProcessing) {
      console.log('🚀 Starting queue processing...');
      void get().processQueue();
    } else {
      console.log('⏳ Queue processing already in progress');
    }
  },

  processQueue: async () => {
    const state = get();
    if (state.isProcessing || state.queue.length === 0) {
      console.log('🛑 ProcessQueue early exit:', {
        isProcessing: state.isProcessing,
        queueLength: state.queue.length,
      });
      return;
    }

    console.log('🔄 ProcessQueue started:', {
      queueLength: state.queue.length,
      maxConcurrentRequests: state.maxConcurrentRequests,
      fetchDelayMs: state.fetchDelayMs,
    });

    set({ isProcessing: true });

    try {
      // Process tasks in concurrent batches
      while (get().queue.length > 0) {
        const currentState = get();
        const availableSlots = Math.min(
          currentState.maxConcurrentRequests - currentState.currentActiveRequests,
          currentState.queue.length
        );

        console.log('📊 Batch processing:', {
          queueLength: currentState.queue.length,
          availableSlots,
          currentActiveRequests: currentState.currentActiveRequests,
          maxConcurrentRequests: currentState.maxConcurrentRequests,
        });

        if (availableSlots <= 0) {
          // Wait a bit and try again if no slots available
          await new Promise((resolve) => setTimeout(resolve, 10));
          continue;
        }

        // Take tasks from queue for this batch
        const tasksToProcess = currentState.queue.slice(0, availableSlots);

        console.log(
          '🎯 Processing batch:',
          tasksToProcess.map((t) => ({
            type: t.type,
            key: t.key,
            caller: t.caller,
            priority: t.priority,
          }))
        );

        // Remove these tasks from queue
        set((s) => ({
          queue: s.queue.slice(availableSlots),
          currentActiveRequests: s.currentActiveRequests + tasksToProcess.length,
        }));

        // Process all tasks in this batch concurrently
        const taskPromises = tasksToProcess.map(async (task) => {
          try {
            console.log('🔧 Starting task:', task.type, task.key);
            await get().processSingleTask(task);
            console.log('✅ Task completed:', task.type, task.key);
          } catch (error) {
            console.error(`❌ Failed to process task ${task.type} for ${task.key}:`, error);
          } finally {
            // Decrement active requests counter
            set((s) => ({
              currentActiveRequests: Math.max(0, s.currentActiveRequests - 1),
            }));
          }
        });

        // Wait for this batch to complete
        await Promise.all(taskPromises);

        // Add delay between batches (not individual requests)
        if (get().queue.length > 0) {
          const delayMs = get().fetchDelayMs;
          console.log(`⏱️ Batch delay: ${delayMs}ms`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    } catch (error) {
      console.error('💥 Critical error in processQueue:', error);
    } finally {
      console.log('🏁 ProcessQueue completed');
      set({ isProcessing: false, currentActiveRequests: 0 });
    }
  },

  // NEW: Extract single task processing logic
  processSingleTask: async (task: FetcherTask) => {
    console.log('🔍 ProcessSingleTask started:', {
      type: task.type,
      key: task.key,
      caller: task.caller,
      priority: task.priority,
    });

    try {
      switch (task.type) {
        case FetcherTaskType.TOKEN_BALANCE: {
          console.log('💰 TOKEN_BALANCE task - setting loading state for:', task.key);
          set((s) => ({
            tokenBalances: {
              ...s.tokenBalances,
              [task.key]: { ...createDefaultState<string>(), loading: true },
            },
          }));

          try {
            console.log('💰 TOKEN_BALANCE task - fetching balance for:', task.key);
            const balance = await fetchTokenBalance(task.key);
            console.log('💰 TOKEN_BALANCE task - balance fetched:', balance);
            set((s) => ({
              tokenBalances: {
                ...s.tokenBalances,
                [task.key]: {
                  value: balance,
                  loading: false,
                  error: null,
                  lastUpdated: Date.now(),
                  needsViewingKey: false,
                },
              },
            }));
            console.log('💰 TOKEN_BALANCE task - state updated successfully');
          } catch (tokenError) {
            const errorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error';
            const needsViewingKey = errorMessage.toLowerCase().includes('viewing key');
            console.log('💰 TOKEN_BALANCE task - error occurred:', {
              error: errorMessage,
              needsViewingKey,
            });
            set((s) => ({
              tokenBalances: {
                ...s.tokenBalances,
                [task.key]: {
                  value: null,
                  loading: false,
                  error: errorMessage,
                  lastUpdated: Date.now(),
                  needsViewingKey,
                },
              },
            }));

            if (needsViewingKey) {
              console.log('🔑 Auto-suggesting token due to viewing key requirement:', task.key);
              import('./balanceFetcherStore')
                .then(({ useBalanceFetcherStore }) => {
                  const { suggestToken } = useBalanceFetcherStore.getState();
                  suggestToken(task.key)
                    .then(() => {
                      console.log(
                        '✅ Key suggestion successful. Clearing error and starting to re-fetch.'
                      );

                      // Optimistically update state to loading and clear error/flags.
                      set((s) => ({
                        tokenBalances: {
                          ...s.tokenBalances,
                          [task.key]: {
                            ...(s.tokenBalances[task.key] ?? createDefaultState<string>()),
                            loading: true,
                            error: null,
                            needsViewingKey: false,
                          },
                        },
                      }));

                      // Retry with exponential back-off (up to 4 attempts)
                      const maxAttempts = 4;
                      const retryFetch = (attempt: number) => {
                        // Enqueue a fresh high-priority fetch
                        get().enqueueTask(
                          {
                            type: FetcherTaskType.TOKEN_BALANCE,
                            key: task.key,
                            caller: `${task.caller}:post-suggest-${attempt}`,
                          },
                          'high'
                        );

                        if (attempt < maxAttempts) {
                          const delayMs = 1000 * Math.pow(2, attempt - 1); // 1s,2s,4s
                          setTimeout(() => {
                            const state = get().tokenBalances[task.key];
                            const stillErrored = !state || !!state.error || state.needsViewingKey;
                            if (stillErrored) {
                              retryFetch(attempt + 1);
                            }
                          }, delayMs);
                        }
                      };

                      // Start retries after 1 s (gives Keplr time to broadcast)
                      setTimeout(() => retryFetch(1), 1000);
                    })
                    .catch((suggestError) => {
                      console.error('🔑 Auto-suggest was rejected or failed:', suggestError);
                      // The error state is already set from the initial `fetchTokenBalance` failure.
                    });
                })
                .catch((importError) =>
                  console.error('🔑 Failed to import balance fetcher store:', importError)
                );
            }
          }
          break;
        }

        case FetcherTaskType.POOL_DATA_BUNDLE: {
          const poolAddress = task.key;
          console.log('🏊 POOL_DATA_BUNDLE task - processing pool:', poolAddress);

          const poolConfig = getPoolConfigByAddress(poolAddress);
          if (!poolConfig.lpTokenAddress) {
            throw new Error(`No LP token found for pool ${poolAddress}`);
          }

          set((s) => ({
            tokenBalances: {
              ...s.tokenBalances,
              [poolConfig.lpTokenAddress!]: { ...createDefaultState(), loading: true },
            },
            stakedBalances: poolConfig.stakingContractAddress
              ? {
                  ...s.stakedBalances,
                  [poolConfig.stakingContractAddress]: { ...createDefaultState(), loading: true },
                }
              : s.stakedBalances,
            poolTvl: { ...s.poolTvl, [poolAddress]: { ...createDefaultState(), loading: true } },
          }));

          // Define interfaces for promise results for type safety
          interface BalanceResult {
            balance: string | null;
            error?: Error;
            needsSync?: boolean;
          }

          // Step 1: Fetch TVL using the existing SecretJS client
          const tvlPromise = fetchPoolTvl(poolAddress, get().secretjs!);

          // Step 2 & 3: Chained Balance Fetches
          const balancePromises = (async (): Promise<{
            lp: BalanceResult;
            staked: BalanceResult;
          }> => {
            let lpKey: string | null = null;
            let lpResult: BalanceResult = { balance: null };

            // Fetch LP
            try {
              const balance = await fetchTokenBalance(poolConfig.lpTokenAddress!);
              const { keplr } = window as unknown as Window;
              if (keplr)
                lpKey = await keplr.getSecret20ViewingKey('secret-4', poolConfig.lpTokenAddress!);
              lpResult = { balance };
            } catch (error) {
              lpResult = {
                balance: null,
                error: error instanceof Error ? error : new Error(String(error)),
              };
            }

            // Fetch Staked, dependent on LP key
            let stakedResult: BalanceResult = { balance: '0' }; // Default for no staking
            if (
              !lpResult.error &&
              lpKey &&
              poolConfig.stakingContractAddress &&
              poolConfig.stakingContractCodeHash
            ) {
              try {
                const balance = await fetchStakedBalance(
                  poolConfig.stakingContractAddress,
                  poolConfig.stakingContractCodeHash,
                  get().secretjs!,
                  lpKey
                );
                stakedResult = { balance };
              } catch (stakedError) {
                const errorMessage =
                  stakedError instanceof Error ? stakedError.message : 'Unknown error';
                if (errorMessage.toLowerCase().includes('viewing key')) {
                  console.log('🔑 Staking VK error. Attempting to sync from LP key...');
                  try {
                    const { setStakingKey } = await import('@/lib/keplr/incentives/setStakingKey');
                    await setStakingKey({
                      secretjs: get().secretjs!,
                      poolAddress: poolAddress as SecretString,
                      viewingKey: lpKey,
                    });
                    get().enqueueTask(
                      {
                        type: FetcherTaskType.POOL_DATA_BUNDLE,
                        key: poolAddress,
                        caller: `${task.caller}:post-vk-sync`,
                      },
                      'high'
                    );
                    stakedResult = {
                      balance: null,
                      error: new Error('Syncing key...'),
                      needsSync: true,
                    };
                  } catch (syncError) {
                    stakedResult = {
                      balance: null,
                      error: syncError instanceof Error ? syncError : new Error('Key sync failed'),
                    };
                  }
                } else {
                  stakedResult = {
                    balance: null,
                    error:
                      stakedError instanceof Error ? stakedError : new Error(String(stakedError)),
                  };
                }
              }
            }
            return { lp: lpResult, staked: stakedResult };
          })();

          // Step 4: Await all results and update state
          const [tvlResult, { lp, staked }] = await Promise.all([tvlPromise, balancePromises]);

          set((s) => ({
            poolTvl: {
              ...s.poolTvl,
              [poolAddress]: {
                value: tvlResult,
                loading: false,
                error: tvlResult ? null : 'TVL unavailable',
                lastUpdated: Date.now(),
                needsViewingKey: false,
              },
            },
            tokenBalances: {
              ...s.tokenBalances,
              [poolConfig.lpTokenAddress!]: {
                value: lp.balance,
                loading: false,
                error: lp.error?.message ?? null,
                lastUpdated: Date.now(),
                needsViewingKey: !!lp.error,
              },
            },
            stakedBalances: poolConfig.stakingContractAddress
              ? {
                  ...s.stakedBalances,
                  [poolConfig.stakingContractAddress]: {
                    value: staked.balance,
                    loading: staked.needsSync ?? false,
                    error: staked.error?.message ?? null,
                    lastUpdated: Date.now(),
                    needsViewingKey: !!staked.error,
                  },
                }
              : s.stakedBalances,
          }));
          break;
        }
      }
    } catch (error) {
      console.error(`🔥 ProcessSingleTask failed for ${task.type} (${task.key}):`, error);

      // Handle errors based on task type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('🔥 ProcessSingleTask error details:', {
        taskType: task.type,
        taskKey: task.key,
        errorMessage,
        caller: task.caller,
      });

      if (task.type === FetcherTaskType.TOKEN_BALANCE) {
        const needsViewingKey = errorMessage.toLowerCase().includes('viewing key');

        set((s) => ({
          tokenBalances: {
            ...s.tokenBalances,
            [task.key]: {
              value: null,
              loading: false,
              error: errorMessage,
              lastUpdated: Date.now(),
              needsViewingKey,
            },
          },
        }));

        // Note: Auto-suggestion is now handled in the individual task cases above
        // This fallback is only for truly unexpected errors
      } else if (task.type === FetcherTaskType.POOL_DATA_BUNDLE) {
        // Note: Auto-suggestion is now handled in the individual task cases above
        // This fallback is only for truly unexpected errors that bypass the inner handlers.
        const poolAddress = task.key;
        const poolConfig = getPoolConfigByAddress(poolAddress);

        const errorUpdates: Partial<GlobalFetcherState> = {
          poolTvl: {
            ...get().poolTvl,
            [poolAddress]: {
              value: null,
              loading: false,
              error: errorMessage,
              lastUpdated: 0,
              needsViewingKey: false,
            },
          },
        };

        if (poolConfig.lpTokenAddress) {
          const needsViewingKey = errorMessage.toLowerCase().includes('viewing key');

          errorUpdates.tokenBalances = {
            ...get().tokenBalances,
            [poolConfig.lpTokenAddress]: {
              value: null,
              loading: false,
              error: errorMessage,
              lastUpdated: 0,
              needsViewingKey,
            },
          };
        }

        if (poolConfig.stakingContractAddress) {
          errorUpdates.stakedBalances = {
            ...get().stakedBalances,
            [poolConfig.stakingContractAddress]: {
              value: null,
              loading: false,
              error: errorMessage,
              lastUpdated: 0,
              needsViewingKey: errorMessage.toLowerCase().includes('viewing key'),
            },
          };
        }

        set(errorUpdates);
      }
    }
  },

  // Helper getters
  getTokenBalance: (address: string) =>
    get().tokenBalances[address] || createDefaultState<string>(),
  getStakedBalance: (address: string) =>
    get().stakedBalances[address] || createDefaultState<string>(),
  getPoolTvl: (address: string) => get().poolTvl[address] || createDefaultState<TvlData | null>(),
}));

// Utility functions for easy configuration
export const configureGlobalFetcher = {
  // Preset configurations
  sequential: () => {
    useGlobalFetcherStore.getState().setMaxConcurrentRequests(1);
    useGlobalFetcherStore.getState().setFetchDelayMs(150);
  },

  conservative: () => {
    useGlobalFetcherStore.getState().setMaxConcurrentRequests(3);
    useGlobalFetcherStore.getState().setFetchDelayMs(100);
  },

  balanced: () => {
    useGlobalFetcherStore.getState().setMaxConcurrentRequests(5);
    useGlobalFetcherStore.getState().setFetchDelayMs(37);
  },

  aggressive: () => {
    useGlobalFetcherStore.getState().setMaxConcurrentRequests(10);
    useGlobalFetcherStore.getState().setFetchDelayMs(20);
  },

  unlimited: () => {
    useGlobalFetcherStore.getState().setMaxConcurrentRequests(999);
    useGlobalFetcherStore.getState().setFetchDelayMs(0);
  },

  // Custom configuration
  custom: (maxConcurrent: number, delayMs: number) => {
    useGlobalFetcherStore.getState().setMaxConcurrentRequests(maxConcurrent);
    useGlobalFetcherStore.getState().setFetchDelayMs(delayMs);
  },

  // Get current settings
  getSettings: () => {
    const state = useGlobalFetcherStore.getState();
    return {
      maxConcurrentRequests: state.maxConcurrentRequests,
      fetchDelayMs: state.fetchDelayMs,
      currentActiveRequests: state.currentActiveRequests,
      queueLength: state.queue.length,
    };
  },
};
