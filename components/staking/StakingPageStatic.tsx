import StakingOverview from '@/components/app/Pages/Pool/StakingForm/StakingOverview';
import DualTokenIcon from '@/components/app/Shared/DualTokenIcon';
import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { calculateDailyRewards } from '@/config/staking';
import { LIQUIDITY_PAIRS, LP_TOKENS, TOKENS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { useLpAndStakingVK } from '@/hooks/useLpAndStakingVK';
import { getRewardInfo } from '@/lib/keplr/incentives/getRewardInfo';
import { SecretString } from '@/types';
import {
  isBalanceResponse,
  isQueryErrorResponse,
  isRewardsResponse,
  LPStakingQueryAnswer,
} from '@/types/secretswap/lp-staking';
import { getLpTokenPriceUsd, getTvlUsd } from '@/utils/pricing/lpTokenPricing';
import { getStakingContractInfoByAddress } from '@/utils/staking/stakingRegistry';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { StakingActions } from './StakingActions';
import { StaticStakingInput } from './StaticStakingInput';

interface StakingPageStaticProps {
  stakingContractAddress: string;
}

interface StakingPageState {
  poolData: {
    status: 'loading' | 'success' | 'error';
    data: {
      totalLocked: string;
      tvlUsd: number;
      dailyRewards: string;
    } | null;
    error: string | null;
  };
  userPosition: {
    status: 'loading' | 'success' | 'error' | 'no_viewing_key';
    data: {
      stakedBalance: string;
      pendingRewards: string;
      stakedValueUsd: number | undefined;
      userSharePercentage: number;
      dailyEarnings: number | undefined;
    } | null;
    error: string | null;
  };
  lastRefreshed: Date | null;
}

export const StakingPageStatic: React.FC<StakingPageStaticProps> = ({ stakingContractAddress }) => {
  const { secretjs } = useKeplrConnection();
  const router = useRouter();

  // Get staking contract info by staking contract address (reverse lookup)
  const stakingInfo = getStakingContractInfoByAddress(stakingContractAddress);

  // Get LP token address from staking info
  const lpTokenAddress = stakingInfo?.lpTokenAddress || '';

  // Use viewing key validation hook
  const viewingKeys = useLpAndStakingVK(lpTokenAddress, stakingContractAddress);

  // Read amount from query parameters for pre-filling (from smart search)
  const prefilledAmount = router.query.amount as string | undefined;

  console.log('🎯 STAKING PAGE: Query params:', router.query);
  console.log('🎯 STAKING PAGE: Prefilled amount:', prefilledAmount);
  console.log('🎯 STAKING PAGE: Current pathname:', router.pathname);
  console.log('🎯 STAKING PAGE: Router ready:', router.isReady);

  // We'll fetch reward estimates manually in our static functions instead of using the reactive hook

  const [state, setState] = useState<StakingPageState>({
    poolData: {
      status: 'loading',
      data: null,
      error: null,
    },
    userPosition: {
      status: 'loading',
      data: null,
      error: null,
    },
    lastRefreshed: null,
  });

  const [lpTokenBalance, setLpTokenBalance] = useState<{
    balance: string;
    isLoading: boolean;
    error: string | null;
  }>({
    balance: '-',
    isLoading: true,
    error: null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasAttemptedRetry, setHasAttemptedRetry] = useState(false);

  // Track amounts for staking actions
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  // Fetch LP token balance
  const fetchLpTokenBalance = useCallback(async () => {
    if (!secretjs || !stakingInfo || !viewingKeys.lpToken.isValid) {
      setLpTokenBalance({
        balance: '-',
        isLoading: false,
        error: viewingKeys.lpToken.isValid ? null : 'Valid LP viewing key required',
      });
      return;
    }

    setLpTokenBalance((prev) => ({ ...prev, isLoading: true }));

    try {
      const balanceResult = await secretjs.query.compute.queryContract({
        contract_address: lpTokenAddress,
        code_hash: stakingInfo.lpTokenCodeHash,
        query: { balance: { address: secretjs.address, key: viewingKeys.sharedKey } },
      });

      const typedResult = balanceResult as LPStakingQueryAnswer;

      if (isQueryErrorResponse(typedResult)) {
        throw new Error(`LP balance query failed: ${typedResult.query_error.msg}`);
      } else if (isBalanceResponse(typedResult)) {
        // Convert from raw amount to display amount (6 decimals)
        const rawBalance = typedResult.balance.amount;
        const displayBalance = (parseInt(rawBalance) / 1_000_000).toString();

        setLpTokenBalance({
          balance: displayBalance,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('Unknown LP balance response format');
      }
    } catch (error) {
      setLpTokenBalance({
        balance: '-',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch LP balance',
      });
    }
  }, [secretjs, stakingInfo, lpTokenAddress, viewingKeys.lpToken.isValid, viewingKeys.sharedKey]);

  // Fetch user staking balance and rewards
  const fetchUserPosition = useCallback(async () => {
    if (!secretjs || !stakingInfo) {
      setState((prev) => ({
        ...prev,
        userPosition: {
          status: 'error',
          data: null,
          error: 'Missing required data (secretjs or staking info)',
        },
      }));
      return;
    }

    if (!viewingKeys.sharedKey) {
      setState((prev) => ({
        ...prev,
        userPosition: {
          status: 'no_viewing_key',
          data: null,
          error: 'Valid viewing key required',
        },
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      userPosition: { ...prev.userPosition, status: 'loading' },
    }));

    try {
      // Query staked balance
      const balanceResult = await secretjs.query.compute.queryContract({
        contract_address: stakingContractAddress,
        code_hash: stakingInfo.stakingCodeHash,
        query: { balance: { address: secretjs.address, key: viewingKeys.sharedKey } },
      });

      // Query pending rewards
      const rewardsResult = await secretjs.query.compute.queryContract({
        contract_address: stakingContractAddress,
        code_hash: stakingInfo.stakingCodeHash,
        query: { rewards: { address: secretjs.address, key: viewingKeys.sharedKey, height: 0 } },
      });

      // Parse results with proper type guards
      let stakedBalanceRaw = '0';
      let pendingRewardsRaw = '0';

      // Handle balance result
      const balanceTyped = balanceResult as LPStakingQueryAnswer;
      if (isQueryErrorResponse(balanceTyped)) {
        throw new Error(`Balance query failed: ${balanceTyped.query_error.msg}`);
      } else if (isBalanceResponse(balanceTyped)) {
        stakedBalanceRaw = balanceTyped.balance.amount;
      }

      // Handle rewards result
      const rewardsTyped = rewardsResult as LPStakingQueryAnswer;
      if (isQueryErrorResponse(rewardsTyped)) {
        throw new Error(`Rewards query failed: ${rewardsTyped.query_error.msg}`);
      } else if (isRewardsResponse(rewardsTyped)) {
        pendingRewardsRaw = rewardsTyped.rewards.rewards;
      }

      // Calculate additional metrics manually
      // Determine decimals using tokens.ts
      const lpDecimals = LP_TOKENS.find((t) => t.address === lpTokenAddress)?.decimals ?? 6;
      const rewardDecimals =
        TOKENS.find((t) => t.symbol === stakingInfo.rewardTokenSymbol)?.decimals ?? 6;

      const lpDenomFactor = Math.pow(10, lpDecimals);
      const rewardDenomFactor = Math.pow(10, rewardDecimals);

      // Convert raw amounts to display amounts
      const stakedBalanceDisplay = (parseFloat(stakedBalanceRaw) / lpDenomFactor).toString();
      const pendingRewardsDisplay = (parseFloat(pendingRewardsRaw) / rewardDenomFactor).toString();

      // Calculate USD value
      let stakedValueUsd: number | undefined;
      const lpTokenPrice = await getLpTokenPriceUsd(secretjs, lpTokenAddress);
      if (lpTokenPrice) {
        stakedValueUsd = (parseFloat(stakedBalanceRaw) / lpDenomFactor) * lpTokenPrice;
      }

      // Calculate user share percentage and daily earnings
      let userSharePercentage = 0;
      let dailyEarnings: number | undefined;
      const rewardInfo = await getRewardInfo({ secretjs, lpToken: lpTokenAddress });
      const totalLocked = parseFloat(rewardInfo.totalLocked) / lpDenomFactor;
      const userStaked = parseFloat(stakedBalanceRaw) / lpDenomFactor;

      if (totalLocked > 0) {
        userSharePercentage = (userStaked / totalLocked) * 100;
        const dailyPoolRewards = calculateDailyRewards();
        const userShare = userStaked / totalLocked;
        dailyEarnings = userShare * dailyPoolRewards;
      }

      setState((prev) => ({
        ...prev,
        userPosition: {
          status: 'success',
          data: {
            stakedBalance: stakedBalanceDisplay,
            pendingRewards: pendingRewardsDisplay,
            stakedValueUsd,
            userSharePercentage,
            dailyEarnings,
          },
          error: null,
        },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        userPosition: {
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'Failed to fetch user position',
        },
      }));
    }
  }, [secretjs, stakingInfo, stakingContractAddress, viewingKeys.sharedKey, lpTokenAddress]);

  // Static pool data fetching - completely independent
  const fetchPoolData = useCallback(async () => {
    if (!lpTokenAddress || !secretjs) {
      setState((prev) => ({
        ...prev,
        poolData: {
          status: 'error',
          data: null,
          error: 'Missing LP token address or SecretJS client',
        },
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      poolData: { ...prev.poolData, status: 'loading' },
    }));

    try {
      // Manually fetch pool data without reactive hooks
      const rewardInfo = await getRewardInfo({ secretjs, lpToken: lpTokenAddress });
      const totalLocked = rewardInfo.totalLocked;
      const totalLockedFormatted = parseFloat(totalLocked) / 1_000_000;

      // Get TVL
      const tvlUsd = await getTvlUsd(secretjs, lpTokenAddress, totalLocked);

      // Calculate daily rewards from configuration
      const dailyPoolRewards = calculateDailyRewards();

      const poolData = {
        totalLocked: totalLockedFormatted.toString(),
        tvlUsd: tvlUsd || 0,
        dailyRewards: dailyPoolRewards.toString(),
      };

      setState((prev) => ({
        ...prev,
        poolData: {
          status: 'success',
          data: poolData,
          error: null,
        },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        poolData: {
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'Failed to fetch pool data',
        },
      }));
    }
  }, [lpTokenAddress, secretjs]);

  // Simple data loading function
  const loadData = useCallback(async () => {
    // Always load pool data first (doesn't require viewing keys)
    await fetchPoolData();

    // Load user data if viewing keys are available
    if (viewingKeys.lpToken.isValid) {
      await fetchLpTokenBalance();

      if (viewingKeys.stakingContract.isValid) {
        await fetchUserPosition();
      }
    } else if (!viewingKeys.lpToken.isLoading && !viewingKeys.stakingContract.isLoading) {
      // Set final state if viewing keys are not valid
      setState((prev) => ({
        ...prev,
        userPosition: {
          status: 'no_viewing_key',
          data: null,
          error: 'Valid viewing keys required to load user position',
        },
      }));
    }
  }, [
    viewingKeys.lpToken.isValid,
    viewingKeys.lpToken.isLoading,
    viewingKeys.stakingContract.isValid,
    viewingKeys.stakingContract.isLoading,
    fetchPoolData,
    fetchLpTokenBalance,
    fetchUserPosition,
  ]);

  // Initial data load on mount
  useEffect(() => {
    void loadData();
  }, []); // Empty dependency array - run only once on mount

  // Simple retry after 3 seconds if staked balance is not loaded
  useEffect(() => {
    if (!hasAttemptedRetry && !state.userPosition.data?.stakedBalance) {
      const timer = setTimeout(() => {
        console.log('Attempting one retry after 3 seconds...');
        setHasAttemptedRetry(true);
        void loadData();
      }, 3000);

      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for all code paths
  }, [hasAttemptedRetry, state.userPosition.data?.stakedBalance, loadData]);

  // Manual refresh function
  const refreshAllData = useCallback(() => {
    setIsRefreshing(true);
    setHasAttemptedRetry(false); // Reset retry state

    setState((prev) => ({
      ...prev,
      lastRefreshed: new Date(),
      poolData: { ...prev.poolData, status: 'loading' },
      userPosition: { ...prev.userPosition, status: 'loading' },
    }));

    setLpTokenBalance((prev) => ({
      ...prev,
      isLoading: true,
    }));

    try {
      // Refresh viewing keys
      viewingKeys.refresh();

      // Give viewing keys a moment to update, then refresh data
      setTimeout(() => {
        void Promise.allSettled([fetchPoolData(), fetchLpTokenBalance(), fetchUserPosition()]).then(
          () => {
            setIsRefreshing(false);
          }
        );
      }, 1000);
    } catch (error) {
      console.error('Error during manual refresh:', error);
      setIsRefreshing(false);
    }
  }, [fetchPoolData, fetchLpTokenBalance, fetchUserPosition, viewingKeys]);

  // Show error if staking contract info not found
  if (!stakingInfo) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-adamant-text-box-main mb-2">
            Staking Contract Not Found
          </h1>
          <p className="text-adamant-text-box-secondary mb-4">
            The staking contract address{' '}
            <code className="bg-adamant-box-dark px-2 py-1 rounded text-sm">
              {stakingContractAddress}
            </code>{' '}
            is not recognized.
          </p>
          <p className="text-adamant-text-box-secondary">
            Please verify the address and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section - Match original design */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {/* Get LP token info for icons */}
          {(() => {
            const lpTokenInfo = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === lpTokenAddress);
            const token0 = lpTokenInfo
              ? TOKENS.find((t) => t.symbol === lpTokenInfo.token0)
              : undefined;
            const token1 = lpTokenInfo
              ? TOKENS.find((t) => t.symbol === lpTokenInfo.token1)
              : undefined;

            return token0 && token1 ? (
              <DualTokenIcon
                token0Address={token0.address}
                token1Address={token1.address}
                token0Symbol={token0.symbol}
                token1Symbol={token1.symbol}
                size={24}
              />
            ) : (
              <TokenImageWithFallback
                tokenAddress={stakingContractAddress as SecretString}
                size={24}
                alt={`${stakingInfo.poolName} staking pool`}
              />
            );
          })()}
          <h2 className="text-xl font-semibold text-adamant-text-box-main">
            Staking {stakingInfo.poolName} LP
          </h2>
        </div>
        <p className="text-adamant-text-box-secondary text-sm">
          Stake your LP tokens to earn{' '}
          <span className="font-medium text-adamant-accentText">bADMT</span> rewards
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <StakingOverview
          stakedBalance={state.userPosition.data?.stakedBalance || null}
          pendingRewards={state.userPosition.data?.pendingRewards || null}
          rewardSymbol="bADMT"
          isLoading={state.userPosition.status === 'loading' || state.poolData.status === 'loading'}
          showRefreshButton={true}
          onRefresh={refreshAllData}
          isRefreshing={isRefreshing}
          stakingContractAddress={stakingContractAddress}
          pairSymbol={stakingInfo.poolName}
          lpTokenAddress={lpTokenAddress}
        />

        {/* Loading state - Show when viewing keys are being checked */}
        {(viewingKeys.lpToken.isLoading || viewingKeys.stakingContract.isLoading) && (
          <div className="flex items-center justify-center min-h-[200px] bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl border border-adamant-box-border">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adamant-accentText mx-auto mb-4"></div>
              <p className="text-adamant-text-box-secondary">Checking viewing keys...</p>
            </div>
          </div>
        )}

        {/* Fix Key Button - Show when keys need attention */}
        {/* {(!viewingKeys.lpToken.isValid || !viewingKeys.stakingContract.isValid) &&
          !viewingKeys.lpToken.isLoading &&
          !viewingKeys.stakingContract.isLoading && (
            <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-amber-400 font-semibold mb-2 text-lg">
                    Viewing Key Required
                  </h3>
                  <p className="text-amber-300/80 text-sm leading-relaxed">
                    Set up viewing keys to access your staking balance and rewards. This is required
                    to see your LP token balance and staking position.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ViewingKeyFixButton
                    lpTokenAddress={lpTokenAddress}
                    stakingContractAddress={stakingContractAddress}
                    onSyncSuccess={() => {
                      // Refresh viewing keys and data after successful sync
                      viewingKeys.refresh();
                      setTimeout(() => {
                        void Promise.allSettled([
                          fetchPoolData(),
                          fetchLpTokenBalance(),
                          fetchUserPosition(),
                        ]);
                      }, 1000);
                    }}
                  />
                </div>
              </div>
            </div>
          )} */}

        {/* Staking Input Section - Only show when viewing keys are valid */}
        {viewingKeys.lpToken.isValid && viewingKeys.stakingContract.isValid && (
          <>
            <StaticStakingInput
              operation="stake"
              balance={lpTokenBalance.balance}
              balanceLabel="Available LP Balance"
              tokenSymbol={stakingInfo.poolName}
              stakingContractAddress={stakingContractAddress}
              lpTokenAddress={lpTokenAddress}
              isLoading={lpTokenBalance.isLoading}
              initialAmount={prefilledAmount || ''}
              onAmountChange={(amount) => {
                console.log('Stake amount changed:', amount);
                setStakeAmount(amount);
              }}
            />

            {/* Unstaking Section - Show if we have staked tokens */}
            {state.userPosition.data?.stakedBalance &&
              state.userPosition.data.stakedBalance !== '0' && (
                <StaticStakingInput
                  operation="unstake"
                  balance={state.userPosition.data.stakedBalance}
                  balanceLabel="Staked LP Balance"
                  tokenSymbol={stakingInfo.poolName}
                  stakingContractAddress={stakingContractAddress}
                  lpTokenAddress={lpTokenAddress}
                  isLoading={state.userPosition.status === 'loading'}
                  onAmountChange={(amount) => {
                    console.log('Unstake amount changed:', amount);
                    setUnstakeAmount(amount);
                  }}
                />
              )}
          </>
        )}
      </div>

      {/* Action Buttons - Match original layout */}
      {(() => {
        console.log('🎯 STAKING PAGE: Viewing key status:', {
          lpTokenValid: viewingKeys.lpToken.isValid,
          stakingContractValid: viewingKeys.stakingContract.isValid,
          shouldShowActions: viewingKeys.lpToken.isValid && viewingKeys.stakingContract.isValid,
        });
        return null;
      })()}
      {viewingKeys.lpToken.isValid && viewingKeys.stakingContract.isValid && (
        <div className="mt-auto pt-6">
          <StakingActions
            stakingContractAddress={stakingContractAddress}
            lpTokenAddress={lpTokenAddress}
            canStake={true}
            stakeAmount={stakeAmount}
            unstakeAmount={unstakeAmount}
            onTransactionComplete={() => {
              setTimeout(() => void fetchUserPosition(), 2000);
            }}
          />
        </div>
      )}
    </div>
  );
};
