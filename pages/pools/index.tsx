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
import { useMultiplePoolBalances } from '@/hooks/useMultiplePoolBalances';
import { getRewardInfo } from '@/lib/keplr/incentives/getRewardInfo';
import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { SecretString, TablePool } from '@/types';
import { PoolResponse, QueryMsg } from '@/types/secretswap/pair';
import { getLpTokenPriceUsd } from '@/utils/pricing/lpTokenPricing';
import { getAllStakingPools } from '@/utils/staking/stakingRegistry';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiErrorWarningLine, RiRefreshLine } from 'react-icons/ri';
import { getTablePools } from '../../utils/apis/getTablePools';
import { validatePools } from '../../utils/apis/isPoolConfigured';

interface ValidatedPool extends TablePool {
  isValid: boolean;
  validationReason: string | undefined;
}

// This now only holds TVL data, as balance data is handled by the `useMultiplePoolBalances` hook.
interface PoolTvlData {
  tvlUsd: number | null;
  isLoading: boolean;
  hasError: boolean;
}

export default function PoolsPage() {
  const [pools, setPools] = useState<ValidatedPool[]>([]);
  const [poolTvlMap, setPoolTvlMap] = useState<Map<string, PoolTvlData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stablecoins, setStablecoins] = useState(false);
  const [incentivized, setIncentivized] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'your'>('all');

  const { secretjs } = useKeplrConnection();
  const { suggestToken } = useBalanceFetcherStore();
  const dataFetchedRef = useRef(false);

  // Initial fetch of pool configurations
  useEffect(() => {
    try {
      const poolsData = getTablePools();
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
  }, []);

  const stakingPools = getAllStakingPools();

  // Prepare configs for the balance fetching hook
  const poolBalanceConfigs = useMemo(() => {
    return pools
      .map((pool) => {
        const pairInfo = LIQUIDITY_PAIRS.find((p) => p.pairContract === pool.contract_address);
        const stakingInfo = stakingPools.find((s) => s.poolAddress === pool.contract_address);
        return {
          lpTokenAddress: pairInfo?.lpToken || '',
          stakingContractAddress: stakingInfo?.stakingInfo.stakingAddress,
          stakingContractCodeHash: stakingInfo?.stakingInfo.stakingCodeHash,
        };
      })
      .filter((c) => c.lpTokenAddress);
  }, [pools, stakingPools]);

  // Single hook to fetch all balances for all visible pools
  const allPoolBalances = useMultiplePoolBalances(poolBalanceConfigs);

  // Helper to get token price in USD
  const getTokenPriceUsd = useCallback(async (tokenSymbol: string): Promise<number> => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    switch (tokenSymbol) {
      case 'USDC.nbl':
      case 'SILK':
        return 1.0;
      case 'sSCRT':
        return 0.5;
      case 'sATOM':
        return 8.0;
      case 'ETH.axl':
        return 2500.0;
      case 'JKL':
        return 0.05;
      default:
        return 1.0;
    }
  }, []);

  // Function to calculate TVL for a single pool
  const calculatePoolTvl = useCallback(
    async (poolAddress: string, pairInfo: (typeof LIQUIDITY_PAIRS)[0]): Promise<number> => {
      if (!secretjs) return 0;
      try {
        const query: QueryMsg = { pool: {} };
        const poolData = await secretjs.query.compute.queryContract<QueryMsg, PoolResponse>({
          contract_address: poolAddress,
          code_hash: pairInfo.pairContractCodeHash,
          query,
        });

        if (!poolData.assets || poolData.assets.length !== 2) return 0;

        const [token0Price, token1Price] = await Promise.all([
          getTokenPriceUsd(pairInfo.token0),
          getTokenPriceUsd(pairInfo.token1),
        ]);

        let totalTvl = 0;
        for (const asset of poolData.assets) {
          // Type guard to check if asset info is a Token
          if ('token' in asset.info) {
            const tokenInfo = asset.info;
            const tokenConfig = TOKENS.find((t) => t.address === tokenInfo.token.contract_addr);
            if (tokenConfig) {
              const price =
                TOKENS.find((t) => t.symbol === pairInfo.token0)?.address === tokenConfig.address
                  ? token0Price
                  : token1Price;
              totalTvl += (parseFloat(asset.amount) / 10 ** tokenConfig.decimals) * price;
            }
          }
        }
        return totalTvl;
      } catch (error) {
        console.error(`Error calculating TVL for pool ${poolAddress}:`, error);
        return 0;
      }
    },
    [secretjs, getTokenPriceUsd]
  );

  // Fetches TVL for all pools
  const fetchAllPoolTvl = useCallback(async () => {
    if (!secretjs || dataFetchedRef.current || pools.length === 0) return;
    dataFetchedRef.current = true;

    const initialMap = new Map<string, PoolTvlData>();
    pools.forEach((pool) =>
      initialMap.set(pool.contract_address, { tvlUsd: null, isLoading: true, hasError: false })
    );
    setPoolTvlMap(initialMap);

    for (const pool of pools) {
      const pairInfo = LIQUIDITY_PAIRS.find((p) => p.pairContract === pool.contract_address);
      if (!pairInfo) continue;

      const stakingInfo = stakingPools.find((s) => s.poolAddress === pool.contract_address);
      let poolTvl = 0;
      let stakingTvl = 0;

      try {
        poolTvl = await calculatePoolTvl(pool.contract_address, pairInfo);
        if (stakingInfo) {
          const [rewardInfo, lpTokenPrice] = await Promise.all([
            getRewardInfo({ secretjs, lpToken: stakingInfo.stakingInfo.lpTokenAddress }),
            getLpTokenPriceUsd(secretjs, stakingInfo.stakingInfo.lpTokenAddress),
          ]);
          stakingTvl = (parseFloat(rewardInfo.totalLocked) / 1e6) * lpTokenPrice;
        }
        setPoolTvlMap((prev) =>
          new Map(prev).set(pool.contract_address, {
            tvlUsd: poolTvl + stakingTvl,
            isLoading: false,
            hasError: false,
          })
        );
      } catch (error) {
        console.error(`Failed to fetch TVL for ${pool.name}`, error);
        setPoolTvlMap((prev) =>
          new Map(prev).set(pool.contract_address, {
            tvlUsd: null,
            isLoading: false,
            hasError: true,
          })
        );
      }
    }
  }, [secretjs, pools, stakingPools, calculatePoolTvl]);

  useEffect(() => {
    if (secretjs && pools.length > 0 && !dataFetchedRef.current) {
      void fetchAllPoolTvl();
    }
  }, [fetchAllPoolTvl, secretjs, pools.length]);

  const filteredPools = useMemo(
    () =>
      pools.filter((pool) => {
        const lpToken = LIQUIDITY_PAIRS.find(
          (p) => p.pairContract === pool.contract_address
        )?.lpToken;
        const balanceData = lpToken ? allPoolBalances[lpToken] : undefined;

        if (activeTab === 'your' && !balanceData?.hasAnyBalance) return false;
        if (incentivized && !stakingPools.some((s) => s.poolAddress === pool.contract_address))
          return false;
        if (stablecoins && !poolContainsStablecoin(pool.name)) return false;
        if (
          searchTerm &&
          !pool.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !pool.contract_address.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;

        return true;
      }),
    [pools, allPoolBalances, activeTab, incentivized, stablecoins, searchTerm, stakingPools]
  );

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
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
        {/* Header and filters */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <Tabs.Root
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'all' | 'your')}
              className="w-full lg:w-auto"
            >
              <Tabs.List className="flex bg-adamant-app-box-lighter p-2 rounded-xl max-w-fit items-center border border-adamant-box-border">
                <Tabs.Trigger
                  value="all"
                  className="flex-1 lg:flex-none px-6 py-3 text-base font-medium rounded-lg text-adamant-text-box-secondary transition-all duration-200 data-[state=active]:text-adamant-text-box-main data-[state=active]:bg-adamant-box-regular hover:text-adamant-text-box-main hover:bg-adamant-box-regular/50"
                >
                  All Pools
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="your"
                  className="flex-1 lg:flex-none px-6 py-3 text-base font-medium rounded-lg text-adamant-text-box-secondary transition-all duration-200 data-[state=active]:text-adamant-text-box-main data-[state=active]:bg-adamant-box-regular hover:text-adamant-text-box-main hover:bg-adamant-box-regular/50"
                >
                  Your Pools
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-3 flex-wrap">
                <FilterButton
                  icon="dollar"
                  label="Stablecoins"
                  isActive={stablecoins}
                  onClick={() => setStablecoins(!stablecoins)}
                />
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
        </div>

        {/* Table */}
        <div className="bg-adamant-box-regular rounded-xl border border-adamant-box-border overflow-hidden mt-6">
          <TableHeaders
            headers={[
              { title: 'Pool', minWidth: '240px', align: 'start' },
              { title: 'TVL', minWidth: '120px', align: 'end' },
              { title: 'Rewards', minWidth: '120px', align: 'end' },
              { title: 'Your Position', minWidth: '160px', align: 'end' },
              { title: '', minWidth: '120px', align: 'end' },
            ]}
          />
          <div className="divide-y divide-adamant-box-border">
            {filteredPools.map((pool, index) => {
              const lpToken =
                LIQUIDITY_PAIRS.find((p) => p.pairContract === pool.contract_address)?.lpToken ||
                '';
              const balanceData = allPoolBalances[lpToken];
              const tvlData = poolTvlMap.get(pool.contract_address);
              const stakingInfo = stakingPools.find((s) => s.poolAddress === pool.contract_address);

              return (
                <motion.div
                  key={pool.contract_address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/pool/${pool.contract_address}`}
                    className="flex items-center bg-adamant-box-dark/50 hover:bg-adamant-box-dark transition-all duration-200 py-4 px-6 group"
                  >
                    <FinancialDataRow
                      cells={[
                        // Pool Name Cell
                        {
                          content: (
                            <div className="flex items-center gap-3">
                              <TokenDisplay
                                seed={pool.contract_address as SecretString}
                                name={pool.name}
                              />
                              {stakingInfo && (
                                <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 px-2 py-1 rounded-full border border-yellow-500/20">
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
                        // TVL Cell
                        {
                          content: (
                            <div className="text-right flex justify-end">
                              {tvlData?.isLoading ? (
                                <LoadingPlaceholder size="small" />
                              ) : tvlData?.tvlUsd != null ? (
                                <span className="font-medium text-adamant-text-box-main">
                                  {formatNumber(tvlData.tvlUsd)}
                                </span>
                              ) : (
                                <span className="font-medium text-adamant-text-box-secondary">
                                  -
                                </span>
                              )}
                            </div>
                          ),
                          minWidth: '120px',
                        },
                        // Rewards Cell
                        {
                          content: (
                            <div className="text-right flex justify-end">
                              {stakingInfo ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-adamant-accentText">
                                    {stakingInfo.stakingInfo.rewardTokenSymbol}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-adamant-text-box-secondary text-sm">-</span>
                              )}
                            </div>
                          ),
                          minWidth: '120px',
                        },
                        // Your Position Cell
                        {
                          content: (
                            <div className="text-right flex flex-col items-end gap-1">
                              {!balanceData ||
                              balanceData.lpLoading ||
                              balanceData.stakedLoading ? (
                                <LoadingPlaceholder size="medium" />
                              ) : balanceData.lpNeedsViewingKey ||
                                balanceData.stakedNeedsViewingKey ? (
                                <>
                                  <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-600/20 px-2 py-1 rounded-md border border-orange-500/20">
                                    <RiErrorWarningLine className="w-3 h-3 text-orange-400" />
                                    <span className="text-xs font-medium text-orange-400">
                                      Key Required
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      void suggestToken(lpToken as SecretString);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-adamant-gradientBright/10 hover:bg-adamant-gradientBright/20 border border-adamant-gradientBright/20 hover:border-adamant-gradientBright/40 rounded-md text-adamant-gradientBright hover:text-white transition-all duration-200"
                                  >
                                    <RiRefreshLine className="w-3 h-3" /> Set Key
                                  </button>
                                </>
                              ) : balanceData.lpError || balanceData.stakedError ? (
                                <>
                                  <div className="flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-red-600/20 px-2 py-1 rounded-md border border-red-500/20">
                                    <RiErrorWarningLine className="w-3 h-3 text-red-400" />
                                    <span className="text-xs font-medium text-red-400">Error</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      void balanceData.retryLpBalance();
                                      void balanceData.retryStakedBalance();
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-adamant-gradientBright/10 hover:bg-adamant-gradientBright/20 border border-adamant-gradientBright/20 hover:border-adamant-gradientBright/40 rounded-md text-adamant-gradientBright hover:text-white transition-all duration-200"
                                  >
                                    <RiRefreshLine className="w-3 h-3" /> Retry
                                  </button>
                                </>
                              ) : balanceData.hasAnyBalance ? (
                                <>
                                  {parseFloat(balanceData.lpBalance) > 0 && (
                                    <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 px-2 py-1 rounded-md border border-blue-500/20">
                                      <span className="text-xs font-medium text-blue-400">
                                        {parseFloat(balanceData.lpBalance).toFixed(2)} LP
                                      </span>
                                    </div>
                                  )}
                                  {parseFloat(balanceData.stakedBalance) > 0 && (
                                    <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 px-2 py-1 rounded-md border border-yellow-500/20">
                                      <span className="text-xs font-medium text-yellow-400">
                                        {parseFloat(balanceData.stakedBalance).toFixed(2)} Staked
                                      </span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-adamant-text-box-secondary text-sm">-</span>
                              )}
                            </div>
                          ),
                          minWidth: '160px',
                        },
                        // Manage Button cell
                        {
                          content: (
                            <div className="text-right flex items-center justify-end gap-2">
                              <motion.button
                                className="bg-adamant-button-form-main text-adamant-button-form-secondary px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90 border border-adamant-box-border group-hover:scale-105"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Manage
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
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
