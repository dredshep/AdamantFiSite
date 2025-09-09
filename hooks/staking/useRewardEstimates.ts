import { calculateDailyRewards } from '@/config/staking';
import { LP_TOKENS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { getRewardInfo } from '@/lib/keplr/incentives/getRewardInfo';
import { getLpTokenPriceUsd, getTvlUsd } from '@/utils/pricing/lpTokenPricing';
import { useCallback, useEffect, useState } from 'react';

export interface RewardEstimate {
  dailyRewards: number;
  weeklyRewards: number;
  monthlyRewards: number;
  annualRewards: number;
}

export interface PoolStakingData {
  totalLocked: string;
  totalLockedFormatted: number;
  tvlUsd?: number;
  lpTokenPrice?: number;
  dailyPoolRewards: number;
  isLoading: boolean;
  error: string | null;
}

export interface UseRewardEstimatesReturn {
  poolData: PoolStakingData;
  estimateRewardsForAmount: (amount: string) => RewardEstimate;
  getCurrentStakeRewards: (stakedAmount: string) => RewardEstimate;
  getUserSharePercentage: (userStaked: string) => number;
  refreshPoolData: () => Promise<void>;
}

/**
 * Hook to provide comprehensive reward estimates for staking
 */
export function useRewardEstimates(lpTokenAddress: string): UseRewardEstimatesReturn {
  const { secretjs } = useKeplrConnection();
  const [poolData, setPoolData] = useState<PoolStakingData>({
    totalLocked: '0',
    totalLockedFormatted: 0,
    dailyPoolRewards: 0,
    isLoading: true,
    error: null,
  });

  // Calculate daily pool rewards from configuration
  const dailyPoolRewards = calculateDailyRewards();

  // Fetch pool data
  const refreshPoolData = useCallback(async () => {
    if (!secretjs) return;

    try {
      setPoolData((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get reward info which includes total locked
      const rewardInfo = await getRewardInfo({ secretjs, lpToken: lpTokenAddress });
      const totalLocked = rewardInfo.totalLocked;
      // Convert using LP token decimals from tokens.ts (default to 6)
      const lpDecimals = LP_TOKENS.find((t) => t.address === lpTokenAddress)?.decimals ?? 6;
      const denomFactor = Math.pow(10, lpDecimals);
      const totalLockedFormatted = parseFloat(totalLocked) / denomFactor;

      // Get LP token price and TVL
      const lpTokenPrice = await getLpTokenPriceUsd(secretjs, lpTokenAddress);
      const tvlUsd = await getTvlUsd(secretjs, lpTokenAddress, totalLocked);

      setPoolData({
        totalLocked,
        totalLockedFormatted,
        tvlUsd,
        lpTokenPrice,
        dailyPoolRewards,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching pool data:', error);
      setPoolData((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [secretjs, lpTokenAddress, dailyPoolRewards]);

  // Initial data fetch
  useEffect(() => {
    void refreshPoolData();
  }, [refreshPoolData]);

  // Estimate rewards for a potential staking amount
  const estimateRewardsForAmount = useCallback(
    (amount: string): RewardEstimate => {
      const amountNum = parseFloat(amount) || 0;

      if (amountNum === 0 || poolData.totalLockedFormatted === 0) {
        return {
          dailyRewards: 0,
          weeklyRewards: 0,
          monthlyRewards: 0,
          annualRewards: 0,
        };
      }

      // Calculate user's share if they stake this amount
      const newTotalStaked = poolData.totalLockedFormatted + amountNum;
      const userShare = amountNum / newTotalStaked;

      // Calculate reward amounts
      const dailyRewards = userShare * dailyPoolRewards;
      const weeklyRewards = dailyRewards * 7;
      const monthlyRewards = dailyRewards * 30;
      const annualRewards = dailyRewards * 365;

      return {
        dailyRewards,
        weeklyRewards,
        monthlyRewards,
        annualRewards,
      };
    },
    [poolData.totalLockedFormatted, dailyPoolRewards]
  );

  // Get rewards for current stake
  const getCurrentStakeRewards = useCallback(
    (stakedAmount: string): RewardEstimate => {
      // console.log('🔍 getCurrentStakeRewards called with:', {
      //   stakedAmount,
      //   stakedAmountType: typeof stakedAmount,
      //   poolDataTotalLockedFormatted: poolData.totalLockedFormatted,
      // });

      // stakedAmount is already in display format, no need to convert
      const stakedAmountNum = parseFloat(stakedAmount) || 0;

      // console.log('🔍 After conversion:', {
      //   stakedAmountNum,
      //   totalLockedFormatted: poolData.totalLockedFormatted,
      //   userShare: stakedAmountNum / poolData.totalLockedFormatted,
      //   dailyPoolRewards,
      // });

      if (stakedAmountNum === 0 || poolData.totalLockedFormatted === 0) {
        return {
          dailyRewards: 0,
          weeklyRewards: 0,
          monthlyRewards: 0,
          annualRewards: 0,
        };
      }

      // Calculate user's current share
      const userShare = stakedAmountNum / poolData.totalLockedFormatted;

      // Calculate reward amounts
      const dailyRewards = userShare * dailyPoolRewards;
      const weeklyRewards = dailyRewards * 7;
      const monthlyRewards = dailyRewards * 30;
      const annualRewards = dailyRewards * 365;

      // console.log('🔍 Final calculation:', {
      //   userShare,
      //   dailyRewards,
      //   weeklyRewards,
      //   monthlyRewards,
      // });

      return {
        dailyRewards,
        weeklyRewards,
        monthlyRewards,
        annualRewards,
      };
    },
    [poolData.totalLockedFormatted, dailyPoolRewards]
  );

  // Get user's share percentage of total stake
  const getUserSharePercentage = useCallback(
    (userStaked: string): number => {
      // userStaked is already in display format, no need to convert
      const userStakedNum = parseFloat(userStaked) || 0;

      if (userStakedNum === 0 || poolData.totalLockedFormatted === 0) {
        return 0;
      }

      return (userStakedNum / poolData.totalLockedFormatted) * 100;
    },
    [poolData.totalLockedFormatted]
  );

  return {
    poolData,
    estimateRewardsForAmount,
    getCurrentStakeRewards,
    getUserSharePercentage,
    refreshPoolData,
  };
}
