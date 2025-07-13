import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { TokenService } from '@/services/secret/TokenService';
import {
  LPStakingQueryAnswer,
  LPStakingQueryMsg,
  isBalanceResponse,
  isQueryErrorResponse,
} from '@/types/secretswap/lp-staking';
import { getAllStakingPools } from '@/utils/staking/stakingRegistry';
import { Window as KeplrWindow } from '@keplr-wallet/types';
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

interface PoolDataResponse {
  assets: PoolAsset[];
  total_share: string;
}

// The global store state
interface GlobalFetcherState {
  // Data maps for each type
  tokenBalances: Record<string, DataState<string>>;
  stakedBalances: Record<string, DataState<string>>;
  poolTvl: Record<string, DataState<TvlData>>;

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
  getPoolTvl: (address: string) => DataState<TvlData>;
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
  const walletAddress = useWalletStore.getState().address;
  if (!walletAddress) {
    throw new Error('Wallet not connected');
  }

  const regularToken = TOKENS.find((t) => t.address === tokenAddress);
  const lpPair = LIQUIDITY_PAIRS.find((p) => p.lpToken === tokenAddress);

  if (!regularToken && !lpPair) {
    throw new Error('Token not found');
  }

  const tokenService = new TokenService();
  const codeHash = regularToken?.codeHash || lpPair?.lpTokenCodeHash;
  const decimals = regularToken?.decimals || 6; // LP tokens default to 6 decimals

  if (!codeHash) {
    throw new Error('Code hash not found for token');
  }

  const rawBalance = await tokenService.getBalance(
    tokenAddress,
    codeHash,
    'globalFetcher',
    `gf-${Date.now()}`
  );

  const humanBalance = (Number(rawBalance) / Math.pow(10, decimals)).toString();
  return humanBalance;
}

async function fetchStakedBalance(
  stakingContractAddress: string,
  stakingContractCodeHash: string,
  secretjs: SecretNetworkClient
): Promise<string> {
  const walletAddress = useWalletStore.getState().address;
  if (!walletAddress) {
    throw new Error('Wallet not connected');
  }

  const { keplr } = window as unknown as KeplrWindow;
  if (!keplr) {
    throw new Error('Keplr not found');
  }

  const viewingKey = await keplr.getSecret20ViewingKey('secret-4', stakingContractAddress);

  if (!secretjs) {
    throw new Error('SecretJS not available');
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

async function fetchPoolTvl(poolAddress: string): Promise<TvlData> {
  try {
    // Find the pool configuration
    const poolConfig = getPoolConfigByAddress(poolAddress);
    if (!poolConfig.pairInfo) {
      throw new Error(`Pool configuration not found for ${poolAddress}`);
    }

    // Query the pool contract for reserves
    const response = await fetch(
      `/api/getPairPool?contract_addr=${encodeURIComponent(poolAddress)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch pool data: ${response.statusText}`);
    }

    const poolData = (await response.json()) as PoolDataResponse;

    if (!poolData.assets || !Array.isArray(poolData.assets) || poolData.assets.length !== 2) {
      throw new Error('Invalid pool data structure');
    }

    // For now, we'll use a simplified TVL calculation
    // In a full implementation, we'd need to:
    // 1. Get the token prices from CoinGecko or other price feeds
    // 2. Calculate the USD value of each reserve
    // 3. Sum them up

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

    // For other pairs, return a placeholder for now
    // In a full implementation, we'd need proper price feeds
    return { totalUsd: 0 };
  } catch (error) {
    console.error(`Error fetching TVL for pool ${poolAddress}:`, error);
    throw error;
  }
}

// Create the global store
export const useGlobalFetcherStore = create<GlobalFetcherState>((set, get) => ({
  tokenBalances: {},
  stakedBalances: {},
  poolTvl: {},
  queue: [],
  isProcessing: false,
  fetchDelayMs: 0,
  maxConcurrentRequests: 100, // Default to 5
  currentActiveRequests: 0,
  secretjs: null, // Initialize secretjs

  setFetchDelayMs: (delay: number) => set({ fetchDelayMs: delay }),
  setMaxConcurrentRequests: (limit: number) => set({ maxConcurrentRequests: limit }),
  setSecretjs: (client: SecretNetworkClient | null) => set({ secretjs: client }),

  enqueueTask: (task, priority = 'normal') => {
    const state = get();
    const fullTask: FetcherTask = { ...task, priority };

    // Check if already in queue
    if (state.queue.some((t) => t.type === task.type && t.key === task.key)) {
      return;
    }

    // Add to queue and sort by priority
    set((s) => {
      const newQueue = [...s.queue, fullTask];
      newQueue.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      return { queue: newQueue };
    });

    // Start processing if not already running
    if (!state.isProcessing) {
      void get().processQueue();
    }
  },

  processQueue: async () => {
    const state = get();
    if (state.isProcessing || state.queue.length === 0) {
      return;
    }

    set({ isProcessing: true });

    try {
      // Process tasks in concurrent batches
      while (get().queue.length > 0) {
        const currentState = get();
        const availableSlots = Math.min(
          currentState.maxConcurrentRequests - currentState.currentActiveRequests,
          currentState.queue.length
        );

        if (availableSlots <= 0) {
          // Wait a bit and try again if no slots available
          await new Promise((resolve) => setTimeout(resolve, 10));
          continue;
        }

        // Take tasks from queue for this batch
        const tasksToProcess = currentState.queue.slice(0, availableSlots);

        // Remove these tasks from queue
        set((s) => ({
          queue: s.queue.slice(availableSlots),
          currentActiveRequests: s.currentActiveRequests + tasksToProcess.length,
        }));

        // Process all tasks in this batch concurrently
        const taskPromises = tasksToProcess.map(async (task) => {
          try {
            await get().processSingleTask(task);
          } catch (error) {
            console.error(`Failed to process task ${task.type} for ${task.key}:`, error);
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
          await new Promise((resolve) => setTimeout(resolve, get().fetchDelayMs));
        }
      }
    } catch (error) {
      console.error('Critical error in processQueue:', error);
    } finally {
      set({ isProcessing: false, currentActiveRequests: 0 });
    }
  },

  // NEW: Extract single task processing logic
  processSingleTask: async (task: FetcherTask) => {
    try {
      switch (task.type) {
        case FetcherTaskType.TOKEN_BALANCE: {
          // Set loading state
          set((s) => ({
            tokenBalances: {
              ...s.tokenBalances,
              [task.key]: {
                ...createDefaultState<string>(),
                loading: true,
              },
            },
          }));

          const balance = await fetchTokenBalance(task.key);

          // Update with success
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
          break;
        }

        case FetcherTaskType.POOL_DATA_BUNDLE: {
          const poolAddress = task.key;
          const poolConfig = getPoolConfigByAddress(poolAddress);

          if (!poolConfig.lpTokenAddress) {
            throw new Error(`No LP token found for pool ${poolAddress}`);
          }

          // Set all loading states
          const updates: Partial<GlobalFetcherState> = {};

          if (poolConfig.lpTokenAddress) {
            updates.tokenBalances = {
              ...get().tokenBalances,
              [poolConfig.lpTokenAddress]: {
                ...createDefaultState<string>(),
                loading: true,
              },
            };
          }

          if (poolConfig.stakingContractAddress) {
            updates.stakedBalances = {
              ...get().stakedBalances,
              [poolConfig.stakingContractAddress]: {
                ...createDefaultState<string>(),
                loading: true,
              },
            };
          }

          updates.poolTvl = {
            ...get().poolTvl,
            [poolAddress]: {
              ...createDefaultState<TvlData>(),
              loading: true,
            },
          };

          set(updates);

          // Fetch data independently (allows TVL to succeed even if balance fails)
          // 1. Always fetch TVL (doesn't require viewing key)
          let tvlResult: TvlData | null = null;
          let tvlError: string | null = null;
          try {
            tvlResult = await fetchPoolTvl(poolAddress);
          } catch (error) {
            tvlError = error instanceof Error ? error.message : 'TVL fetch failed';
            console.error(`TVL fetch failed for ${poolAddress}:`, error);
          }

          // 2. Fetch LP balance (may fail due to viewing key)
          let lpResult: string | null = null;
          let lpError: string | null = null;
          let lpNeedsViewingKey = false;
          try {
            lpResult = await fetchTokenBalance(poolConfig.lpTokenAddress);
          } catch (error) {
            lpError = error instanceof Error ? error.message : 'LP balance fetch failed';
            lpNeedsViewingKey = lpError.includes('viewing key');
            console.error(`LP balance fetch failed for ${poolConfig.lpTokenAddress}:`, error);
          }

          // 3. Fetch staked balance (may fail due to viewing key)
          let stakedResult: string | null = null;
          let stakedError: string | null = null;
          let stakedNeedsViewingKey = false;
          if (poolConfig.stakingContractAddress && poolConfig.stakingContractCodeHash) {
            const currentSecretjs = get().secretjs;
            if (currentSecretjs) {
              try {
                stakedResult = await fetchStakedBalance(
                  poolConfig.stakingContractAddress,
                  poolConfig.stakingContractCodeHash,
                  currentSecretjs
                );
              } catch (error) {
                stakedError =
                  error instanceof Error ? error.message : 'Staked balance fetch failed';
                stakedNeedsViewingKey = stakedError.includes('viewing key');
                console.error(
                  `Staked balance fetch failed for ${poolConfig.stakingContractAddress}:`,
                  error
                );
              }
            } else {
              stakedError = 'SecretJS not available';
            }
          } else {
            stakedResult = '0'; // No staking contract
          }

          // ATOMIC UPDATE: Update all state at once with individual success/error states
          const atomicUpdates: Partial<GlobalFetcherState> = {
            tokenBalances: {
              ...get().tokenBalances,
              [poolConfig.lpTokenAddress]: {
                value: lpResult,
                loading: false,
                error: lpError,
                lastUpdated: lpResult !== null ? Date.now() : 0,
                needsViewingKey: lpNeedsViewingKey,
              },
            },
            poolTvl: {
              ...get().poolTvl,
              [poolAddress]: {
                value: tvlResult,
                loading: false,
                error: tvlError,
                lastUpdated: tvlResult !== null ? Date.now() : 0,
                needsViewingKey: false, // TVL never needs viewing key
              },
            },
          };

          if (poolConfig.stakingContractAddress) {
            atomicUpdates.stakedBalances = {
              ...get().stakedBalances,
              [poolConfig.stakingContractAddress]: {
                value: stakedResult,
                loading: false,
                error: stakedError,
                lastUpdated: stakedResult !== null ? Date.now() : 0,
                needsViewingKey: stakedNeedsViewingKey,
              },
            };
          }

          set(atomicUpdates);
          break;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${task.type} for ${task.key}:`, error);

      // Handle errors based on task type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (task.type === FetcherTaskType.TOKEN_BALANCE) {
        set((s) => ({
          tokenBalances: {
            ...s.tokenBalances,
            [task.key]: {
              value: null,
              loading: false,
              error: errorMessage,
              lastUpdated: Date.now(),
              needsViewingKey: errorMessage.includes('viewing key'),
            },
          },
        }));
      } else if (task.type === FetcherTaskType.POOL_DATA_BUNDLE) {
        // For POOL_DATA_BUNDLE, we should rarely get here since we handle errors individually
        // But if we do, set all related data to error state
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
          errorUpdates.tokenBalances = {
            ...get().tokenBalances,
            [poolConfig.lpTokenAddress]: {
              value: null,
              loading: false,
              error: errorMessage,
              lastUpdated: 0,
              needsViewingKey: errorMessage.includes('viewing key'),
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
              needsViewingKey: errorMessage.includes('viewing key'),
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
  getPoolTvl: (address: string) => get().poolTvl[address] || createDefaultState<TvlData>(),
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
