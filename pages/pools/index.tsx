import AppLayout from '@/components/app/Global/AppLayout';
import FilterButton from '@/components/app/Pages/Pools/FilterButton';
import SparklyButton from '@/components/app/Pages/Pools/SparklyButton';
import { LoadingPlaceholder } from '@/components/app/Shared/LoadingPlaceholder';
import {
  FinancialDataRow,
  FinancialTableSearchBar,
  TableHeaders,
} from '@/components/app/Shared/Tables/FinancialTable';
import TokenDisplay from '@/components/app/Shared/Tables/TokenDisplay';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LIQUIDITY_PAIRS, poolContainsStablecoin } from '@/config/tokens';
import { usePoolData } from '@/hooks/usePoolData';
import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { useGlobalFetcherStore } from '@/store/globalFetcherStore';
import { SecretString, TablePool } from '@/types';
import { getAllStakingPools } from '@/utils/staking/stakingRegistry';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { RiErrorWarningLine, RiRefreshLine } from 'react-icons/ri';
import { getTablePools } from '../../utils/apis/getTablePools';
import { validatePools } from '../../utils/apis/isPoolConfigured';

interface ValidatedPool extends TablePool {
  isValid: boolean;
  validationReason: string | undefined;
}

// Debug panel component
function DebugPanel() {
  const fetchDelayMs = useGlobalFetcherStore((state) => state.fetchDelayMs);
  const setFetchDelayMs = useGlobalFetcherStore((state) => state.setFetchDelayMs);
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm opacity-50 hover:opacity-100"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Global Fetcher Debug</h3>
        <button onClick={() => setShowDebug(false)} className="text-gray-400 hover:text-white">
          ×
        </button>
      </div>
      <div className="space-y-2">
        <label className="block text-xs text-gray-300">Fetch Delay (ms): {fetchDelayMs}</label>
        <input
          type="range"
          min="50"
          max="1000"
          step="50"
          value={fetchDelayMs}
          onChange={(e) => setFetchDelayMs(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFetchDelayMs(50)}
            className="px-2 py-1 bg-red-600 rounded text-xs"
          >
            Fast (50ms)
          </button>
          <button
            onClick={() => setFetchDelayMs(150)}
            className="px-2 py-1 bg-blue-600 rounded text-xs"
          >
            Default (150ms)
          </button>
          <button
            onClick={() => setFetchDelayMs(500)}
            className="px-2 py-1 bg-green-600 rounded text-xs"
          >
            Safe (500ms)
          </button>
        </div>
      </div>
    </div>
  );
}

// Individual pool card component for mobile - table-like layout
function PoolCard({ pool, index }: { pool: ValidatedPool; index: number }) {
  const poolData = usePoolData(pool.contract_address, `poolCard:${pool.name}`);
  const { suggestToken } = useBalanceFetcherStore();
  const stakingPools = getAllStakingPools();
  const stakingInfo = stakingPools.find((s) => s.poolAddress === pool.contract_address);
  const lpToken =
    LIQUIDITY_PAIRS.find((p) => p.pairContract === pool.contract_address)?.lpToken || '';

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-adamant-app-input rounded-xl border border-adamant-box-border overflow-hidden hover:bg-adamant-app-input/80 transition-all duration-200"
    >
      <Link href={`/pool/${pool.contract_address}`} className="block">
        {/* Table-like row layout */}
        <div className="p-4">
          {/* Pool Name with Fee */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <TokenDisplay 
                seed={pool.contract_address as SecretString} 
                name={pool.name}
                showFee={true}
              />
              {stakingInfo && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 px-2 py-1 rounded-full border border-yellow-500/20">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">Rewards</span>
                </div>
              )}
            </div>
          </div>

          {/* Table-like data rows */}
          <div className="space-y-2 text-sm">
            {/* TVL Row */}
            <div className="flex justify-between items-center">
              <span className="text-adamant-text-box-secondary">TVL:</span>
              {poolData.isLoading ? (
                <LoadingPlaceholder size="small" />
              ) : poolData.tvl != null ? (
                <span className="font-medium text-white">
                  {formatNumber(poolData.tvl)}
                </span>
              ) : (
                <span className="font-medium text-adamant-text-box-secondary">-</span>
              )}
            </div>

            {/* Rewards Row */}
            <div className="flex justify-between items-center">
              <span className="text-adamant-text-box-secondary">Rewards:</span>
              {stakingInfo ? (
                <span className="font-medium text-adamant-accentText">
                  {stakingInfo.stakingInfo.rewardTokenSymbol}
                </span>
              ) : (
                <span className="font-medium text-adamant-text-box-secondary">-</span>
              )}
            </div>

            {/* Your Position Row */}
            <div className="flex justify-between items-start">
              <span className="text-adamant-text-box-secondary">Position:</span>
              <div className="text-right">
                {poolData.isLoading ? (
                  <LoadingPlaceholder size="small" />
                ) : poolData.lpNeedsViewingKey || poolData.stakedNeedsViewingKey ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-orange-400">Key Required</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        void suggestToken(lpToken as SecretString);
                      }}
                      className="text-xs bg-adamant-gradientBright/10 hover:bg-adamant-gradientBright/20 border border-adamant-gradientBright/20 px-2 py-1 rounded text-adamant-gradientBright"
                    >
                      Set Key
                    </button>
                  </div>
                ) : poolData.error ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-red-400">Error</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        poolData.retryLpBalance();
                        poolData.retryStakedBalance();
                      }}
                      className="text-xs bg-adamant-gradientBright/10 hover:bg-adamant-gradientBright/20 border border-adamant-gradientBright/20 px-2 py-1 rounded text-adamant-gradientBright"
                    >
                      Retry
                    </button>
                  </div>
                ) : poolData.hasAnyBalance ? (
                  <div className="flex flex-col items-end gap-1">
                    {poolData.hasLpBalance && (
                      <span className="text-xs text-blue-400">
                        {parseFloat(poolData.lpBalance || '0').toFixed(2)} LP
                      </span>
                    )}
                    {stakingInfo && poolData.hasStakedBalance && (
                      <span className="text-xs text-yellow-400">
                        {parseFloat(poolData.stakedBalance || '0').toFixed(2)} Staked
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="font-medium text-adamant-text-box-secondary">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-3 pt-3 border-t border-adamant-box-border/20">
            <motion.button
              className="w-full bg-adamant-app-input hover:bg-adamant-app-input/80 text-adamant-text-box-secondary hover:text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border border-adamant-box-border hover:border-adamant-gradientBright/40"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/pool/${pool.contract_address}`;
              }}
            >
              Provide liquidity
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Individual pool row component for mobile
function PoolRow({ pool, index }: { pool: ValidatedPool; index: number }) {
  const poolData = usePoolData(pool.contract_address, `poolRow:${pool.name}`);
  const { suggestToken } = useBalanceFetcherStore();
  const stakingPools = getAllStakingPools();
  const stakingInfo = stakingPools.find((s) => s.poolAddress === pool.contract_address);
  const lpToken =
    LIQUIDITY_PAIRS.find((p) => p.pairContract === pool.contract_address)?.lpToken || '';

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <motion.div
      key={pool.contract_address}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/pool/${pool.contract_address}`}
        className="flex items-center bg-adamant-app-input hover:bg-adamant-app-input/80 transition-all duration-200 py-4 px-6 group border-b border-adamant-box-border/20 last:border-b-0"
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
                    showFee={true}
                  />
                  {stakingInfo && (
                    <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 px-2 py-1 rounded-full border border-yellow-500/20">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-400">Rewards</span>
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
                  {poolData.isLoading ? (
                    <LoadingPlaceholder size="small" />
                  ) : poolData.tvl != null ? (
                    <span className="font-medium text-adamant-text-box-main">
                      {formatNumber(poolData.tvl)}
                    </span>
                  ) : (
                    <span className="font-medium text-adamant-text-box-secondary">-</span>
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
                  {poolData.isLoading ? (
                    <LoadingPlaceholder size="medium" />
                  ) : poolData.lpNeedsViewingKey || poolData.stakedNeedsViewingKey ? (
                    <>
                      <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-600/20 px-2 py-1 rounded-md border border-orange-500/20">
                        <RiErrorWarningLine className="w-3 h-3 text-orange-400" />
                        <span className="text-xs font-medium text-orange-400">Key Required</span>
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
                  ) : poolData.error ? (
                    <>
                      <div className="flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-red-600/20 px-2 py-1 rounded-md border border-red-500/20">
                        <RiErrorWarningLine className="w-3 h-3 text-red-400" />
                        <span className="text-xs font-medium text-red-400">Error</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();

                          // Comprehensive logging for retry functionality
                          console.log('=== RETRY BUTTON CLICKED ===');
                          console.log('Pool:', pool.name);
                          console.log('Pool Address:', pool.contract_address);
                          console.log('Timestamp:', new Date().toISOString());

                          // Log current pool data state
                          console.log('Current poolData state:', {
                            isLoading: poolData.isLoading,
                            error: poolData.error,
                            lpBalance: poolData.lpBalance,
                            stakedBalance: poolData.stakedBalance,
                            hasLpBalance: poolData.hasLpBalance,
                            hasStakedBalance: poolData.hasStakedBalance,
                            lpNeedsViewingKey: poolData.lpNeedsViewingKey,
                            stakedNeedsViewingKey: poolData.stakedNeedsViewingKey,
                          });

                          // Log LP token info
                          const lpTokenInfo = LIQUIDITY_PAIRS.find(
                            (p) => p.pairContract === pool.contract_address
                          );
                          console.log('LP Token Info:', {
                            lpToken: lpTokenInfo?.lpToken,
                            lpTokenCodeHash: lpTokenInfo?.lpTokenCodeHash,
                          });

                          // Log staking info
                          const stakingPools = getAllStakingPools();
                          const stakingInfo = stakingPools.find(
                            (s) => s.poolAddress === pool.contract_address
                          );
                          console.log('Staking Info:', {
                            hasStaking: !!stakingInfo,
                            stakingAddress: stakingInfo?.stakingInfo?.stakingAddress,
                            stakingCodeHash: stakingInfo?.stakingInfo?.stakingCodeHash,
                          });

                          // Log retry function availability
                          console.log('Retry functions available:', {
                            retryLpBalance: typeof poolData.retryLpBalance,
                            retryStakedBalance: typeof poolData.retryStakedBalance,
                          });

                          try {
                            console.log('Calling retryLpBalance...');
                            poolData.retryLpBalance();
                            console.log('retryLpBalance called successfully');
                          } catch (error) {
                            console.error('Error calling retryLpBalance:', error);
                          }

                          try {
                            console.log('Calling retryStakedBalance...');
                            poolData.retryStakedBalance();
                            console.log('retryStakedBalance called successfully');
                          } catch (error) {
                            console.error('Error calling retryStakedBalance:', error);
                          }

                          console.log('=== RETRY BUTTON PROCESSING COMPLETE ===');

                          // Add a small delay and then log the new state
                          setTimeout(() => {
                            console.log('=== RETRY RESULT CHECK (after 1 second) ===');
                            console.log('New poolData state:', {
                              isLoading: poolData.isLoading,
                              error: poolData.error,
                              lpBalance: poolData.lpBalance,
                              stakedBalance: poolData.stakedBalance,
                            });
                          }, 1000);

                          // Also check after 3 seconds
                          setTimeout(() => {
                            console.log('=== RETRY RESULT CHECK (after 3 seconds) ===');
                            console.log('Final poolData state:', {
                              isLoading: poolData.isLoading,
                              error: poolData.error,
                              lpBalance: poolData.lpBalance,
                              stakedBalance: poolData.stakedBalance,
                            });
                          }, 3000);

                          // Check after 10 seconds to see if auto-suggestion worked
                          setTimeout(() => {
                            console.log(
                              '=== RETRY RESULT CHECK (after 10 seconds - post auto-suggest) ==='
                            );
                            console.log('Post auto-suggest poolData state:', {
                              isLoading: poolData.isLoading,
                              error: poolData.error,
                              lpBalance: poolData.lpBalance,
                              stakedBalance: poolData.stakedBalance,
                              lpNeedsViewingKey: poolData.lpNeedsViewingKey,
                              stakedNeedsViewingKey: poolData.stakedNeedsViewingKey,
                            });
                          }, 10000);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-adamant-gradientBright/10 hover:bg-adamant-gradientBright/20 border border-adamant-gradientBright/20 hover:border-adamant-gradientBright/40 rounded-md text-adamant-gradientBright hover:text-white transition-all duration-200"
                      >
                        <RiRefreshLine className="w-3 h-3" /> Retry
                      </button>
                    </>
                  ) : poolData.hasAnyBalance ? (
                    <>
                      {poolData.hasLpBalance && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 px-2 py-1 rounded-md border border-blue-500/20">
                          <span className="text-xs font-medium text-blue-400">
                            {parseFloat(poolData.lpBalance || '0').toFixed(2)} LP
                          </span>
                        </div>
                      )}
                      {stakingInfo && poolData.hasStakedBalance && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 px-2 py-1 rounded-md border border-yellow-500/20">
                          <span className="text-xs font-medium text-yellow-400">
                            {parseFloat(poolData.stakedBalance || '0').toFixed(2)} Staked
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
            // Provide Liquidity Button cell
            {
              content: (
                <div className="text-right flex items-center justify-end gap-2">
                  <motion.button
                    className="bg-adamant-app-input hover:bg-adamant-app-input/80 text-adamant-text-box-secondary hover:text-white px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 border border-adamant-box-border hover:border-adamant-gradientBright/40 group-hover:scale-105"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Provide liquidity
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
}

export default function PoolsPage() {
  const [pools, setPools] = useState<ValidatedPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stablecoins, setStablecoins] = useState(false);
  const [incentivized, setIncentivized] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'your'>('all');

  const stakingPools = getAllStakingPools();

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

  const filteredPools = useMemo(
    () =>
      pools.filter((pool) => {
        // For the "your" tab, we'll need to check if any pool has balances
        // This is a simplified check - in reality we'd need to check the actual balance data
        if (activeTab === 'your') {
          // For now, show all pools in "your" tab since we can't easily check balances here
          // The individual PoolRow components will handle showing/hiding based on actual balance data
        }

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
    [pools, activeTab, incentivized, stablecoins, searchTerm, stakingPools]
  );

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
              <Tabs.List className="flex bg-adamant-app-filterBg rounded-xl max-w-fit items-center border border-adamant-box-inputBorder h-[37px] py-2">
                <Tabs.Trigger
                  value="all"
                  className="flex-1 lg:flex-none px-4 text-sm font-medium rounded-lg text-adamant-text-box-secondary transition-all duration-200 data-[state=active]:text-black data-[state=active]:bg-white hover:text-adamant-text-box-main h-[35px]"
                >
                  All Pools
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="your"
                  className="flex-1 lg:flex-none px-4 text-sm font-medium rounded-lg text-adamant-text-box-secondary transition-all duration-200 data-[state=active]:text-black data-[state=active]:bg-white hover:text-adamant-text-box-main h-[35px]"
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

        {/* Desktop Table Layout */}
        <div className="hidden lg:block mt-6">
          <div className="bg-adamant-app-input rounded-xl border border-adamant-box-border overflow-hidden">
            <TableHeaders
              headers={[
                { title: 'Pool', minWidth: '240px', align: 'start' },
                { title: 'TVL', minWidth: '120px', align: 'end' },
                { title: 'Rewards', minWidth: '120px', align: 'end' },
                { title: 'Your Position', minWidth: '160px', align: 'end' },
                { title: '', minWidth: '120px', align: 'end' },
              ]}
            />
            <div className="divide-y divide-adamant-box-border/20">
              {filteredPools.map((pool, index) => (
                <PoolRow key={pool.contract_address} pool={pool} index={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Cards Layout - Table-like arrangement */}
        <div className="lg:hidden mt-6">
          <div className="space-y-3">
            {filteredPools.map((pool, index) => (
              <PoolCard key={pool.contract_address} pool={pool} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel />
    </AppLayout>
  );
}
