import AppLayout from '@/components/app/Global/AppLayout';
import FilterButton from '@/components/app/Pages/Pools/FilterButton';
import SparklyButton from '@/components/app/Pages/Pools/SparklyButton';
import { LoadingPlaceholder } from '@/components/app/Shared/Forms/Input/InputWrappers';
import {
  FinancialDataRow,
  FinancialTableSearchBar,
  TableHeaders,
} from '@/components/app/Shared/Tables/FinancialTable';
import TokenDisplay from '@/components/app/Shared/Tables/TokenDisplay';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LIQUIDITY_PAIRS, poolContainsStablecoin, TOKENS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { getRewardInfo } from '@/lib/keplr/incentives/getRewardInfo';
import { getStakedBalance } from '@/lib/keplr/incentives/getStakedBalance';
import { SecretString, TablePool } from '@/types';
import { getLpTokenPriceUsd } from '@/utils/pricing/lpTokenPricing';
import { getAllStakingPools } from '@/utils/staking/stakingRegistry';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { RotateCcw, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getTablePools } from '../../utils/apis/getTablePools';
import { validatePools } from '../../utils/apis/isPoolConfigured';

interface ValidatedPool extends TablePool {
  isValid: boolean;
  validationReason: string | undefined;
}

interface PoolData {
  tvlUsd: number | null; // null means not fetched yet, number means confirmed value (could be 0)
  // volume24h: number; // TODO: Implement volume tracking
  userLpBalance: number; // User's LP token balance for "Your Pools"
  userStakedBalance: number; // User's staked balance for "Your Pools"
  isLoading: boolean;
  hasError: boolean; // Track if there was an error fetching data
  hasTimedOut: boolean; // Track if fetching timed out
}

export default function PoolsPage() {
  const [pools, setPools] = useState<ValidatedPool[]>([]);
  const [poolDataMap, setPoolDataMap] = useState<Map<string, PoolData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stablecoins, setStablecoins] = useState(false);
  // const [native, setNative] = useState(false); // TODO: Implement native token filtering
  const [incentivized, setIncentivized] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'your'>('all');

  const { secretjs } = useKeplrConnection();
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    const fetchAndValidatePools = () => {
      try {
        // Get pools from configuration
        const poolsData = getTablePools();

        // Validate pools
        const validationResults = validatePools(poolsData);

        const validatedPools: ValidatedPool[] = poolsData.map((pool, index) => ({
          ...pool,
          isValid: validationResults[index]?.isValid ?? false,
          validationReason: validationResults[index]?.reason,
        }));

        setPools(validatedPools);
      } catch (error) {
        console.error('Error fetching and validating pools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndValidatePools();
  }, []);

  // Get staking pools for checking which pools have incentives
  const stakingPools = getAllStakingPools();

  // Helper to get token price in USD (simplified - assumes sSCRT base pair)
  const getTokenPriceUsd = useCallback(async (tokenSymbol: string): Promise<number> => {
    // For now, use simple price assumptions
    // TODO: Implement real price feeds
    await new Promise((resolve) => setTimeout(resolve, 0)); // Dummy await to satisfy linter
    switch (tokenSymbol) {
      case 'USDC.nbl':
      case 'SILK':
        return 1.0; // Stablecoins = $1
      case 'sSCRT':
        return 0.5; // Assume sSCRT = $0.50 (this should be from price feeds)
      case 'sATOM':
        return 8.0; // Assume sATOM = $8.00 (this should be from price feeds)
      case 'ETH.axl':
        return 2500.0; // Assume ETH = $2500 (this should be from price feeds)
      case 'JKL':
        return 0.05; // Assume JKL = $0.05 (this should be from price feeds)
      default:
        return 1.0; // Default fallback
    }
  }, []);

  // Calculate TVL from pool reserves
  const calculatePoolTvl = useCallback(
    async (poolAddress: string, pairInfo: (typeof LIQUIDITY_PAIRS)[0]): Promise<number> => {
      if (!secretjs) return 0;

      try {
        // Query pool reserves
        const poolQuery = { pool: {} };
        const poolResult = await secretjs.query.compute.queryContract({
          contract_address: poolAddress,
          code_hash: pairInfo.pairContractCodeHash,
          query: poolQuery,
        });

        const poolData = poolResult as {
          assets: Array<{
            info: {
              token?: { contract_addr: string };
              native_token?: { denom: string };
            };
            amount: string;
          }>;
        };

        if (!poolData.assets || poolData.assets.length !== 2) {
          return 0;
        }

        // Get token prices
        const [token0Price, token1Price] = await Promise.all([
          getTokenPriceUsd(pairInfo.token0),
          getTokenPriceUsd(pairInfo.token1),
        ]);

        // Calculate TVL from reserves
        let totalTvl = 0;

        for (const asset of poolData.assets) {
          const token0Info = TOKENS.find((t) => t.symbol === pairInfo.token0);
          const token1Info = TOKENS.find((t) => t.symbol === pairInfo.token1);

          let tokenPrice = 1;
          let decimals = 6;

          if (token0Info && asset.info.token?.contract_addr === token0Info.address) {
            tokenPrice = token0Price;
            decimals = token0Info.decimals;
          } else if (token1Info && asset.info.token?.contract_addr === token1Info.address) {
            tokenPrice = token1Price;
            decimals = token1Info.decimals;
          }

          const amount = parseFloat(asset.amount) / Math.pow(10, decimals);
          totalTvl += amount * tokenPrice;
        }

        return totalTvl;
      } catch (error) {
        console.error(`Error calculating TVL for pool ${poolAddress}:`, error);
        return 0;
      }
    },
    [secretjs, getTokenPriceUsd]
  );

  // Get user's LP token balance
  const getUserLpBalance = useCallback(
    async (lpTokenAddress: string, lpTokenCodeHash: string): Promise<number> => {
      if (!secretjs || !window.keplr) return 0;

      try {
        // Try to get viewing key for LP token
        let viewingKey: string | null = null;

        try {
          viewingKey = await window.keplr.getSecret20ViewingKey('secret-4', lpTokenAddress);
        } catch {
          // No viewing key available
          return 0;
        }

        if (!viewingKey) return 0;

        // Query balance
        const balance = await secretjs.query.snip20.getBalance({
          contract: {
            address: lpTokenAddress,
            code_hash: lpTokenCodeHash,
          },
          address: secretjs.address,
          auth: { key: viewingKey },
        });

        if (balance && typeof balance === 'object' && 'balance' in balance) {
          const balanceObj = balance.balance as { amount: string };
          return parseFloat(balanceObj.amount) / 1_000_000; // Convert from raw amount (6 decimals)
        }

        return 0;
      } catch (error) {
        // Log errors but don't crash the app or show toasts for balance queries
        console.warn('LP balance query failed:', error);
        return 0;
      }
    },
    [secretjs]
  );

  // Get user's staked balance
  const getUserStakedBalance = useCallback(
    async (
      lpTokenAddress: string,
      stakingContractAddress: string,
      stakingContractCodeHash: string
    ): Promise<number> => {
      if (!secretjs || !window.keplr) return 0;

      try {
        // Try to get viewing key for staking contract
        let viewingKey: string | null = null;

        try {
          viewingKey = await window.keplr.getSecret20ViewingKey('secret-4', stakingContractAddress);
        } catch {
          // No viewing key available
          return 0;
        }

        if (!viewingKey) return 0;

        // Query staked balance
        const rawBalance = await getStakedBalance({
          secretjs,
          lpToken: lpTokenAddress,
          stakingContractAddress,
          stakingContractCodeHash,
          address: secretjs.address,
          viewingKey,
        });

        // Convert from raw amount (6 decimals) to display amount
        return parseFloat(rawBalance) / 1_000_000;
      } catch (error) {
        // Log errors but don't crash the app or show toasts for balance queries
        console.warn('Staked balance query failed:', error);
        return 0;
      }
    },
    [secretjs]
  );

  // Helper to format numbers
  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Optimized data fetching with proper rate limiting to avoid 429 errors
  const fetchPoolData = useCallback(async () => {
    if (!secretjs || dataFetchedRef.current || pools.length === 0) {
      return;
    }

    // console.log('🔄 Fetching pool data for', pools.length, 'pools with rate limiting...');
    dataFetchedRef.current = true;

    try {
      // Initialize loading states - tvlUsd starts as null (not fetched)
      const initialDataMap = new Map<string, PoolData>();
      pools.forEach((pool) => {
        initialDataMap.set(pool.contract_address, {
          tvlUsd: null, // null = not fetched yet
          userLpBalance: 0,
          userStakedBalance: 0,
          isLoading: true,
          hasError: false,
          hasTimedOut: false,
        });
      });
      setPoolDataMap(initialDataMap);

      // Process pools sequentially to avoid rate limiting
      for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];
        if (!pool) continue; // Safety check

        const poolAddress = pool.contract_address;

        // console.log(`📊 Processing pool ${i + 1}/${pools.length}: ${pool.name}`);

        let poolTvl = 0;
        let stakingTvl = 0;
        let userLpBalance = 0;
        let userStakedBalance = 0;
        let hasError = false;
        let hasTimedOut = false;

        try {
          // Set a timeout for this pool's data fetching
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Pool data fetch timeout')), 10000); // 10 second timeout
          });

          const fetchPromise = (async () => {
            // Find the LP token for this pool
            const pairInfo = LIQUIDITY_PAIRS.find((pair) => pair.pairContract === poolAddress);

            if (!pairInfo) {
              console.warn(`No pair info found for pool ${poolAddress}`);
              throw new Error('No pair info found');
            }

            // Check if this pool has staking
            const stakingInfo = stakingPools.find(
              (stakingPool) => stakingPool.poolAddress === poolAddress
            );

            // Calculate direct pool TVL from reserves
            try {
              poolTvl = await calculatePoolTvl(poolAddress, pairInfo);
              // Small delay after pool TVL query
              await new Promise((resolve) => setTimeout(resolve, 150));
            } catch (error) {
              console.error(`Error calculating pool TVL for ${poolAddress}:`, error);
              // Don't throw here, just log and continue with 0 TVL
            }

            // Calculate staking TVL and user staked balance if available
            if (stakingInfo) {
              try {
                const [rewardInfo, lpTokenPrice] = await Promise.all([
                  getRewardInfo({ secretjs, lpToken: stakingInfo.stakingInfo.lpTokenAddress }),
                  getLpTokenPriceUsd(secretjs, stakingInfo.stakingInfo.lpTokenAddress),
                ]);
                const totalLockedFormatted = parseFloat(rewardInfo.totalLocked) / 1_000_000;
                stakingTvl = totalLockedFormatted * lpTokenPrice;

                // Get user's staked balance
                userStakedBalance = await getUserStakedBalance(
                  stakingInfo.stakingInfo.lpTokenAddress,
                  stakingInfo.stakingInfo.stakingAddress,
                  stakingInfo.stakingInfo.stakingCodeHash
                );

                // Small delay after staking queries
                await new Promise((resolve) => setTimeout(resolve, 150));
              } catch (error) {
                console.error(`Error calculating staking TVL for ${poolAddress}:`, error);
                // Don't throw here, just log and continue
              }
            }

            // Get user's LP balance
            try {
              userLpBalance = await getUserLpBalance(pairInfo.lpToken, pairInfo.lpTokenCodeHash);
              // Small delay after balance query
              await new Promise((resolve) => setTimeout(resolve, 150));
            } catch (error) {
              console.error(`Error getting user balance for ${poolAddress}:`, error);
              // Don't throw here since it's not critical for TVL display
            }

            // Return success to indicate completion
            return 'success';
          })();

          // Race between fetching and timeout
          await Promise.race([fetchPromise, timeoutPromise]);
        } catch (error) {
          if (error instanceof Error && error.message === 'Pool data fetch timeout') {
            console.warn(`Pool ${poolAddress} data fetch timed out`);
            hasTimedOut = true;
          } else {
            console.error(`Error processing pool ${poolAddress}:`, error);
            hasError = true;
          }
        }

        // Total TVL = pool liquidity + staked amount (confirmed values)
        const totalTvl = poolTvl + stakingTvl;

        // console.log(`✅ Pool ${pool.name} completed:`, {
        //   poolTvl,
        //   stakingTvl,
        //   totalTvl,
        //   userLpBalance,
        //   userStakedBalance,
        //   hasError,
        //   hasTimedOut,
        // });

        // Update this specific pool's data immediately when it's done
        setPoolDataMap((prevMap) => {
          const newMap = new Map(prevMap);
          newMap.set(poolAddress, {
            tvlUsd: hasError || hasTimedOut ? null : totalTvl, // null for errors/timeouts, number for confirmed values
            userLpBalance,
            userStakedBalance,
            isLoading: false, // Only set to false when we have final data (success or failure)
            hasError,
            hasTimedOut,
          });
          return newMap;
        });

        // Longer delay between pools to avoid overwhelming the node
        if (i < pools.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // console.log('✅ Pool data fetching completed with rate limiting');
    } catch (error) {
      console.error('Error in sequential pool data fetch:', error);
      // Reset loading states on error
      setPoolDataMap((_prevMap) => {
        const errorDataMap = new Map<string, PoolData>();
        pools.forEach((pool) => {
          errorDataMap.set(pool.contract_address, {
            tvlUsd: null, // null for error state
            userLpBalance: 0,
            userStakedBalance: 0,
            isLoading: false,
            hasError: true,
            hasTimedOut: false,
          });
        });
        return errorDataMap;
      });
    }
  }, [secretjs, pools, stakingPools, calculatePoolTvl, getUserLpBalance, getUserStakedBalance]);

  // Fetch data when secretjs and pools are available
  useEffect(() => {
    if (secretjs && pools.length > 0 && !dataFetchedRef.current) {
      void fetchPoolData();
    }
  }, [fetchPoolData, secretjs, pools.length]);

  // Reset data fetch when wallet changes
  useEffect(() => {
    if (secretjs) {
      dataFetchedRef.current = false;
    }
  }, [secretjs?.address]);

  // Function to refresh a specific pool's data
  const refreshPoolData = useCallback(
    async (poolAddress: string) => {
      if (!secretjs) return;

      // console.log(`🔄 Refreshing data for pool: ${poolName}`);

      // Set this pool to loading state
      setPoolDataMap((prevMap) => {
        const newMap = new Map(prevMap);
        const currentData = newMap.get(poolAddress);
        if (currentData) {
          newMap.set(poolAddress, {
            ...currentData,
            isLoading: true,
            hasError: false,
            hasTimedOut: false,
          });
        }
        return newMap;
      });

      let poolTvl = 0;
      let stakingTvl = 0;
      let userLpBalance = 0;
      let userStakedBalance = 0;
      let hasError = false;
      let hasTimedOut = false;

      try {
        // Set a timeout for this pool's data fetching
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Pool data fetch timeout')), 10000);
        });

        const fetchPromise = (async () => {
          // Find the LP token for this pool
          const pairInfo = LIQUIDITY_PAIRS.find((pair) => pair.pairContract === poolAddress);

          if (!pairInfo) {
            console.warn(`No pair info found for pool ${poolAddress}`);
            throw new Error('No pair info found');
          }

          // Check if this pool has staking
          const stakingInfo = stakingPools.find(
            (stakingPool) => stakingPool.poolAddress === poolAddress
          );

          // Calculate direct pool TVL from reserves
          try {
            poolTvl = await calculatePoolTvl(poolAddress, pairInfo);
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Error calculating pool TVL for ${poolAddress}:`, error);
          }

          // Calculate staking TVL and user staked balance if available
          if (stakingInfo) {
            try {
              const [rewardInfo, lpTokenPrice] = await Promise.all([
                getRewardInfo({ secretjs, lpToken: stakingInfo.stakingInfo.lpTokenAddress }),
                getLpTokenPriceUsd(secretjs, stakingInfo.stakingInfo.lpTokenAddress),
              ]);
              const totalLockedFormatted = parseFloat(rewardInfo.totalLocked) / 1_000_000;
              stakingTvl = totalLockedFormatted * lpTokenPrice;

              // Get user's staked balance
              userStakedBalance = await getUserStakedBalance(
                stakingInfo.stakingInfo.lpTokenAddress,
                stakingInfo.stakingInfo.stakingAddress,
                stakingInfo.stakingInfo.stakingCodeHash
              );

              await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Error calculating staking TVL for ${poolAddress}:`, error);
            }
          }

          // Get user's LP balance
          try {
            userLpBalance = await getUserLpBalance(pairInfo.lpToken, pairInfo.lpTokenCodeHash);
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Error getting user balance for ${poolAddress}:`, error);
          }

          // Return success to indicate completion
          return 'success';
        })();

        // Race between fetching and timeout
        await Promise.race([fetchPromise, timeoutPromise]);
      } catch (error) {
        if (error instanceof Error && error.message === 'Pool data fetch timeout') {
          console.warn(`Pool ${poolAddress} refresh timed out`);
          hasTimedOut = true;
        } else {
          console.error(`Error refreshing pool ${poolAddress}:`, error);
          hasError = true;
        }
      }

      // Total TVL = pool liquidity + staked amount (confirmed values)
      const totalTvl = poolTvl + stakingTvl;

      // console.log(`✅ Pool ${poolName} refresh completed:`, {
      //   poolTvl,
      //   stakingTvl,
      //   totalTvl,
      //   userLpBalance,
      //   userStakedBalance,
      //   hasError,
      //   hasTimedOut,
      // });

      // Update this specific pool's data
      setPoolDataMap((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(poolAddress, {
          tvlUsd: hasError || hasTimedOut ? null : totalTvl,
          userLpBalance,
          userStakedBalance,
          isLoading: false,
          hasError,
          hasTimedOut,
        });
        return newMap;
      });
    },
    [secretjs, stakingPools, calculatePoolTvl, getUserLpBalance, getUserStakedBalance]
  );

  const filteredPools = pools.filter((pool) => {
    const matchesSearch =
      pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.contract_address.toLowerCase().includes(searchTerm.toLowerCase());

    // Apply filters
    let matchesFilters = true;

    if (incentivized) {
      const hasStaking = stakingPools.some(
        (stakingPool) => stakingPool.poolAddress === pool.contract_address
      );
      matchesFilters = matchesFilters && hasStaking;
    }

    if (stablecoins) {
      matchesFilters = matchesFilters && poolContainsStablecoin(pool.name);
    }

    // Your Pools filter - only show pools where user has LP tokens OR staked tokens
    if (activeTab === 'your') {
      const poolData = poolDataMap.get(pool.contract_address);
      const hasTokens =
        (poolData?.userLpBalance || 0) > 0 || (poolData?.userStakedBalance || 0) > 0;
      matchesFilters = matchesFilters && hasTokens;
    }

    // TODO: Implement native token filtering when metadata is available
    // if (native) {
    //   matchesFilters = matchesFilters && pool.hasNativeToken;
    // }

    return matchesSearch && matchesFilters;
  });

  // Helper to check if pool has staking rewards
  const getPoolStakingInfo = (contractAddress: string) => {
    return stakingPools.find((stakingPool) => stakingPool.poolAddress === contractAddress);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
          <LoadingSpinner size={40} />
          <div className="text-lg font-medium text-adamant-text-box-main">Loading pools...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto mt-12 px-4">
        {/* Header Section */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Tabs Section */}
            <Tabs.Root
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'all' | 'your')}
              className="w-full lg:w-auto"
            >
              <Tabs.List className="flex bg-adamant-app-box-lighter p-2 rounded-xl max-w-fit items-center border border-adamant-box-border">
                <Tabs.Trigger
                  value="all"
                  className="flex-1 lg:flex-none px-6 py-3 text-base font-medium rounded-lg
                           text-adamant-text-box-secondary transition-all duration-200
                           data-[state=active]:text-adamant-text-box-main 
                           data-[state=active]:bg-adamant-box-regular
                           hover:text-adamant-text-box-main hover:bg-adamant-box-regular/50"
                >
                  All Pools
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="your"
                  className="flex-1 lg:flex-none px-6 py-3 text-base font-medium rounded-lg
                           text-adamant-text-box-secondary transition-all duration-200
                           data-[state=active]:text-adamant-text-box-main 
                           data-[state=active]:bg-adamant-box-regular
                           hover:text-adamant-text-box-main hover:bg-adamant-box-regular/50"
                >
                  Your Pools
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-3 flex-wrap">
                <FilterButton
                  icon="dollar"
                  label="Stablecoins"
                  isActive={stablecoins}
                  onClick={() => setStablecoins(!stablecoins)}
                />
                {/* TODO: Implement native token filtering */}
                {/* <FilterButton
                  icon="native"
                  label="Native"
                  isActive={native}
                  onClick={() => setNative(!native)}
                /> */}
                <SparklyButton
                  isActive={incentivized}
                  onClick={() => setIncentivized(!incentivized)}
                />
              </div>

              <div className="w-full sm:w-auto min-w-[280px]">
                <FinancialTableSearchBar placeholder="Search pools..." onSearch={setSearchTerm} />
              </div>
            </div>
          </div>

          {/* Filter Banners */}
          {incentivized && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-yellow-500/10 to-amber-600/10 
                       border border-yellow-500/20 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-400 font-medium text-sm">
                    Showing incentivized pools only
                  </p>
                  <p className="text-yellow-400/70 text-xs">
                    Stake your LP tokens to earn bADMT rewards
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {stablecoins && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 
                       border border-green-500/20 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                  <span className="text-xs font-bold text-black">$</span>
                </div>
                <div>
                  <p className="text-green-400 font-medium text-sm">
                    Showing stablecoin pools only
                  </p>
                  <p className="text-green-400/70 text-xs">
                    Pools containing SILK, USDC.nbl, or other stablecoins
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'your' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-500/10 to-indigo-600/10 
                       border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center">
                  <span className="text-xs font-bold text-black">👤</span>
                </div>
                <div>
                  <p className="text-blue-400 font-medium text-sm">Showing your pools only</p>
                  <p className="text-blue-400/70 text-xs">
                    Pools where you have LP tokens or staked balances
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Table */}
        <div className="bg-adamant-box-regular rounded-xl border border-adamant-box-border overflow-hidden">
          <TableHeaders
            headers={[
              { title: 'Pool', minWidth: '240px', align: 'start' },
              { title: 'TVL', minWidth: '120px', align: 'end' },
              // { title: 'Volume (24h)', minWidth: '120px', align: 'end' }, // TODO: Implement volume tracking
              { title: 'Rewards', minWidth: '120px', align: 'end' },
              { title: 'Your Position', minWidth: '160px', align: 'end' },
              { title: '', minWidth: '120px', align: 'end' },
            ]}
          />

          <div className="divide-y divide-adamant-box-border">
            {filteredPools.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="bg-adamant-app-box-darker p-6 rounded-xl">
                  <TrendingUp className="w-12 h-12 text-adamant-text-box-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-adamant-text-box-main text-center mb-2">
                    No pools found
                  </h3>
                  <p className="text-adamant-text-box-secondary text-center text-sm max-w-md">
                    {searchTerm
                      ? 'Try adjusting your search terms or filters'
                      : activeTab === 'your'
                      ? "You don't have LP tokens or staked balances in any pools yet"
                      : incentivized
                      ? 'No incentivized pools match your current filters'
                      : stablecoins
                      ? 'No stablecoin pools match your current filters'
                      : 'No pools available at the moment'}
                  </p>
                </div>
              </div>
            ) : (
              filteredPools.map((pool, index) => {
                const stakingInfo = getPoolStakingInfo(pool.contract_address);
                const hasStaking = !!stakingInfo;
                const poolData = poolDataMap.get(pool.contract_address);

                return (
                  <motion.div
                    key={pool.contract_address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      className="flex items-center bg-adamant-box-dark/50 hover:bg-adamant-box-dark 
                               transition-all duration-200 py-4 px-6 group"
                      href={`/pool/${pool.contract_address}`}
                    >
                      <FinancialDataRow
                        cells={[
                          {
                            content: (
                              <div className="flex items-center gap-3">
                                <TokenDisplay
                                  seed={pool.contract_address as SecretString}
                                  name={pool.name}
                                />
                                {hasStaking && (
                                  <div
                                    className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 
                                                px-2 py-1 rounded-full border border-yellow-500/20"
                                  >
                                    <Sparkles className="w-3 h-3 text-yellow-400" />
                                    <span className="text-xs font-medium text-yellow-400">
                                      Rewards
                                    </span>
                                  </div>
                                )}
                              </div>
                            ),
                            minWidth: '240px',
                          },
                          {
                            content: (
                              <div className="text-right flex justify-end">
                                {(() => {
                                  // Debug logging for TVL display
                                  if (pool.name.includes('NBL') || pool.name.includes('SILK')) {
                                    // console.log(`🔍 TVL Debug for ${pool.name}:`, {
                                    //   poolData,
                                    //   isLoading: poolData?.isLoading,
                                    //   tvlUsd: poolData?.tvlUsd,
                                    //   hasError: poolData?.hasError,
                                    //   hasTimedOut: poolData?.hasTimedOut,
                                    // });
                                  }

                                  if (poolData?.isLoading) {
                                    return <LoadingPlaceholder size="small" />;
                                  } else if (!poolData || poolData.tvlUsd === null) {
                                    return (
                                      <span className="font-medium text-adamant-text-box-secondary">
                                        -
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="font-medium text-adamant-text-box-main">
                                        {formatNumber(poolData.tvlUsd)}
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            ),
                            minWidth: '120px',
                          },
                          // {
                          //   content: (
                          //     <div className="text-right flex justify-end">
                          //       <span className="font-medium text-adamant-text-box-secondary">
                          //         {/* TODO: Implement 24h volume fetching */}
                          //         -
                          //       </span>
                          //     </div>
                          //   ),
                          //   minWidth: '120px',
                          // },
                          {
                            content: (
                              <div className="text-right flex justify-end">
                                {hasStaking ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-adamant-accentText">
                                      {stakingInfo.stakingInfo.rewardTokenSymbol}
                                    </span>
                                    {/* <div className="w-2 h-2 bg-adamant-accentText rounded-full"></div> */}
                                  </div>
                                ) : (
                                  <span className="text-adamant-text-box-secondary text-sm">-</span>
                                )}
                              </div>
                            ),
                            minWidth: '120px',
                          },
                          {
                            content: (
                              <div className="text-right flex flex-col items-end gap-1">
                                {(() => {
                                  // Debug logging for position display
                                  if (pool.name.includes('NBL') || pool.name.includes('SILK')) {
                                    // console.log(`🔍 Position Debug for ${pool.name}:`, {
                                    //   poolData,
                                    //   userLpBalance: poolData?.userLpBalance,
                                    //   userStakedBalance: poolData?.userStakedBalance,
                                    //   isLoading: poolData?.isLoading,
                                    // });
                                  }

                                  if (poolData?.isLoading) {
                                    return <LoadingPlaceholder size="medium" />;
                                  } else if (
                                    poolData &&
                                    ((poolData.userLpBalance || 0) > 0 ||
                                      (poolData.userStakedBalance || 0) > 0)
                                  ) {
                                    return (
                                      <>
                                        {poolData.userLpBalance > 0 && (
                                          <div
                                            className="flex items-center gap-1 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 
                                                        px-2 py-1 rounded-md border border-blue-500/20"
                                          >
                                            <span className="text-xs font-medium text-blue-400">
                                              {poolData.userLpBalance.toFixed(2)} LP
                                            </span>
                                          </div>
                                        )}
                                        {poolData.userStakedBalance > 0 && (
                                          <div
                                            className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 
                                                        px-2 py-1 rounded-md border border-yellow-500/20"
                                          >
                                            <span className="text-xs font-medium text-yellow-400">
                                              {poolData.userStakedBalance.toFixed(2)} Staked
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    );
                                  } else {
                                    return (
                                      <span className="text-adamant-text-box-secondary text-xs">
                                        -
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                            ),
                            minWidth: '160px',
                          },
                          {
                            content: (
                              <div className="text-right flex items-center justify-end gap-2">
                                <motion.button
                                  className="bg-adamant-button-form-main text-adamant-button-form-secondary 
                                           px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                                           hover:opacity-90 border border-adamant-box-border
                                           group-hover:scale-105"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Manage
                                </motion.button>
                                <motion.button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    refreshPoolData(pool.contract_address);
                                  }}
                                  disabled={poolData?.isLoading}
                                  className="p-2 rounded-lg border border-adamant-box-border
                                           bg-adamant-app-box-lighter hover:bg-adamant-box-regular
                                           transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                                           flex items-center justify-center"
                                  whileHover={{ scale: poolData?.isLoading ? 1 : 1.1 }}
                                  whileTap={{ scale: poolData?.isLoading ? 1 : 0.9 }}
                                  title="Refresh pool data"
                                >
                                  <RotateCcw
                                    className={`w-3 h-3 text-adamant-text-box-secondary 
                                              ${poolData?.isLoading ? 'animate-spin' : ''}`}
                                  />
                                </motion.button>
                              </div>
                            ),
                            minWidth: '120px',
                          },
                        ]}
                      />
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-adamant-text-box-secondary text-sm">
            {filteredPools.length} pool{filteredPools.length !== 1 ? 's' : ''} available
            {incentivized && <span className="ml-2 text-yellow-400">• Earning bADMT rewards</span>}
            {stablecoins && <span className="ml-2 text-green-400">• Contains stablecoins</span>}
            {activeTab === 'your' && <span className="ml-2 text-blue-400">• Your positions</span>}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
