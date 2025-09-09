import DualTokenIcon from '@/components/app/Shared/DualTokenIcon';
import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { ViewingKeyFixButton } from '@/components/staking/ViewingKeyFixButton';
import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { usePoolStaking } from '@/hooks/usePoolStaking';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { usePoolStore } from '@/store/forms/poolStore';
import { useStakingStore } from '@/store/staking/stakingStore';
import { ViewingKeyStatus } from '@/types/staking';
// import { getCodeHashByAddress } from '@/utils/secretjs/tokens/getCodeHashByAddress';
import React, { useEffect, useState } from 'react';
import StakingActions from './StakingActions';
import StakingInput from './StakingInput';
import StakingOverview from './StakingOverview';
import StakingPoolSelector from './StakingPoolSelector';

interface StakingFormProps {
  initialStakingAmount?: string;
}

const StakingForm: React.FC<StakingFormProps> = ({ initialStakingAmount }) => {
  const { selectedPool } = usePoolStore();
  const { setStakingInputAmount } = useStakingStore();

  // Track initial loading state separately from background refreshes
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Set initial staking amount from query parameters
  useEffect(() => {
    if (initialStakingAmount) {
      setStakingInputAmount('stakeAmount', initialStakingAmount);
    }
  }, [initialStakingAmount, setStakingInputAmount]);

  // Get LP token address for this pool
  const pairInfo = selectedPool?.pairContract
    ? LIQUIDITY_PAIRS.find((pair) => pair.pairContract === selectedPool.pairContract)
    : null;

  // Use centralized balance fetcher for LP token
  const lpTokenBalance = useTokenBalance(
    pairInfo?.lpToken,
    `StakingForm:${pairInfo?.symbol ?? 'unknown'}`,
    true
  );

  // Get poolStaking hook
  const poolStaking = usePoolStaking(selectedPool?.pairContract ?? null);

  const {
    hasStakingRewards,
    staking,
    stakingInfo,
    viewingKeyStatus,
    setupViewingKey,
    stakeLpTokens,
    unstakeLpTokens,
    claimRewards,
    refreshBalances,
    loadBalanceConfig,
  } = poolStaking;

  // Setup is complete, display the staking UI
  const rawStakedBalance = staking?.stakedBalance ?? null;
  const rawPendingRewards = staking?.pendingRewards ?? null;

  // Convert staked balance from raw amount to display amount (6 decimals for LP tokens)
  // Only convert if we have actual data - never show '0' when we don't know
  const stakedBalance =
    rawStakedBalance !== null ? (parseInt(rawStakedBalance) / 1_000_000).toString() : null;

  // Convert pending rewards from raw amount to display amount (6 decimals for bADMT)
  // Only convert if we have actual data - never show '0' when we don't know
  const pendingRewards =
    rawPendingRewards !== null ? (parseInt(rawPendingRewards) / 1_000_000).toString() : null;

  // Check if we have any data loaded (indicating we've completed initial load)
  const hasAnyData =
    rawStakedBalance !== null || rawPendingRewards !== null || lpTokenBalance.balance !== '-';

  // Track when we've initially loaded data
  useEffect(() => {
    if (hasAnyData && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
  }, [hasAnyData, hasInitiallyLoaded]);

  // Reset initial loading state when pool changes
  useEffect(() => {
    setHasInitiallyLoaded(false);
  }, [selectedPool?.pairContract]);

  // An "initial load" is when we have no data for a value AND it's currently being fetched.
  const isInitiallyLoadingStaked =
    rawStakedBalance === null && (staking?.isOperationLoading('fetchBalance') ?? false);
  const isInitiallyLoadingRewards =
    rawPendingRewards === null && (staking?.isOperationLoading('fetchRewards') ?? false);
  const isInitiallyLoadingLpToken = lpTokenBalance.balance === '-' && lpTokenBalance.loading;

  // The entire form is in an "initial loading" state if any key data point is loading for the first time.
  const isInitialLoading =
    isInitiallyLoadingStaked || isInitiallyLoadingRewards || isInitiallyLoadingLpToken;

  // A "background refresh" is when we ALREADY have data, but are fetching a new version.
  const isBackgroundRefreshingStaked =
    rawStakedBalance !== null && (staking?.isOperationLoading('fetchBalance') ?? false);
  const isBackgroundRefreshingRewards =
    rawPendingRewards !== null && (staking?.isOperationLoading('fetchRewards') ?? false);
  const isBackgroundRefreshingLpToken = lpTokenBalance.balance !== '-' && lpTokenBalance.loading;

  // Show a discrete refresh indicator if any data is updating in the background.
  const isBackgroundRefreshing =
    isBackgroundRefreshingStaked || isBackgroundRefreshingRewards || isBackgroundRefreshingLpToken;

  // Only check for user action loading states (not background polling)
  const isUserActionLoading =
    (staking?.isOperationLoading('stake') ?? false) ||
    (staking?.isOperationLoading('unstake') ?? false) ||
    (staking?.isOperationLoading('claim') ?? false);

  // Check if stakingInputs has a valid amount
  const hasStakeAmount = poolStaking.stakingInputs.stakeAmount.amount !== '';
  const hasUnstakeAmount = poolStaking.stakingInputs.unstakeAmount.amount !== '';

  // Helper functions to check actual values vs unknown states
  const hasActualStakedBalance = rawStakedBalance !== null && rawStakedBalance !== '0';
  const hasActualPendingRewards = rawPendingRewards !== null && rawPendingRewards !== '0';
  const isStakedBalanceKnown = rawStakedBalance !== null;

  // Updated conditional checks - only disable for initial loading or user actions, not background refreshes
  // Also properly handle unknown vs zero states
  const isStakeDisabled = isInitialLoading || isUserActionLoading || !hasStakeAmount;
  const isUnstakeDisabled =
    isInitialLoading || isUserActionLoading || !hasUnstakeAmount || !hasActualStakedBalance; // Only disable if we know there's no staked balance
  const isClaimDisabled = isInitialLoading || isUserActionLoading || !hasActualPendingRewards; // Only disable if we know there are no pending rewards

  const handleStake = async () => {
    const success = await stakeLpTokens();

    // Refresh LP token balance after successful staking
    if (success) {
      lpTokenBalance.refetch();
    }
  };

  const handleUnstake = async () => {
    const success = await unstakeLpTokens();

    // Refresh LP token balance after successful unstaking
    if (success) {
      lpTokenBalance.refetch();
    }
  };

  const handleClaim = () => {
    void claimRewards();
  };

  // If staking is not available for this pool
  if (!selectedPool || !hasStakingRewards || stakingInfo === null) {
    return <StakingPoolSelector />;
  }

  // Get readable token symbols
  // const token0Symbol = selectedPool.token0 ? getApiTokenSymbol(selectedPool.token0) : '';
  // const token1Symbol = selectedPool.token1 ? getApiTokenSymbol(selectedPool.token1) : '';
  const token0 = selectedPool ? TOKENS.find((t) => t.symbol === selectedPool.token0) : undefined;
  const token1 = selectedPool ? TOKENS.find((t) => t.symbol === selectedPool.token1) : undefined;
  const lpPairName = `${token0?.symbol}/${token1?.symbol}`;

  // If we need a viewing key to proceed
  if (viewingKeyStatus !== ViewingKeyStatus.CREATED) {
    return (
      <div className="flex flex-col gap-6 py-2.5 px-2.5 flex-1">
        <div className="mb-4">
          <h3 className="text-white font-medium mb-2">Staking {lpPairName} LP</h3>
          <p className="text-gray-400 text-sm">
            Stake your liquidity provider tokens to earn {stakingInfo.rewardTokenSymbol} rewards.
          </p>
        </div>

        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-amber-400 font-semibold mb-2 text-lg">Viewing Key Required</h3>
              <p className="text-amber-300/80 text-sm leading-relaxed">
                Set up viewing keys to access your staking balance and rewards. This is required to
                see your LP token balance and staking position.
              </p>
            </div>
            <div className="flex-shrink-0">
              <ViewingKeyFixButton
                lpTokenAddress={pairInfo?.lpToken || ''}
                stakingContractAddress={stakingInfo.stakingAddress}
                onSyncSuccess={() => {
                  // Refresh balances after successful sync
                  void refreshBalances();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-6 flex-1">
      {/* Header Section - Compact */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {token0 && token1 ? (
            <DualTokenIcon
              token0Address={token0.address}
              token1Address={token1.address}
              token0Symbol={token0.symbol}
              token1Symbol={token1.symbol}
              size={24}
            />
          ) : (
            <TokenImageWithFallback
              tokenAddress={stakingInfo?.stakingAddress}
              size={24}
              alt={`${lpPairName} staking pool`}
            />
          )}
          <h2 className="text-xl font-semibold text-adamant-text-box-main">
            Staking {lpPairName} LP
          </h2>
        </div>
        <p className="text-adamant-text-box-secondary text-sm">
          Stake your LP tokens to earn{' '}
          <span className="font-medium text-adamant-accentText">
            {stakingInfo.rewardTokenSymbol}
          </span>{' '}
          rewards
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <StakingOverview
          stakedBalance={stakedBalance}
          pendingRewards={pendingRewards}
          rewardSymbol={stakingInfo.rewardTokenSymbol}
          isLoading={isInitialLoading}
          showRefreshButton={loadBalanceConfig.shouldShowFetchButton}
          onRefresh={refreshBalances}
          isRefreshing={isBackgroundRefreshing}
          stakingContractAddress={stakingInfo?.stakingAddress}
          pairSymbol={lpPairName}
          lpTokenAddress={stakingInfo?.lpTokenAddress}
        />

        {/* Staking Input Section */}
        <StakingInput
          inputIdentifier="stakeAmount"
          operation="stake"
          balance={lpTokenBalance.balance}
          balanceLabel="Available LP Balance"
          tokenSymbol={lpPairName}
          stakingContractAddress={stakingInfo?.stakingAddress}
          isLoading={isInitialLoading || (staking?.isOperationLoading('stake') ?? false)}
        />

        {/* Unstaking Section - Show if we have staked tokens OR if we're still loading and don't know yet */}
        {(hasActualStakedBalance || !isStakedBalanceKnown) && (
          <StakingInput
            inputIdentifier="unstakeAmount"
            operation="unstake"
            balance={stakedBalance ?? '-'} // Show '-' when unknown, not '0'
            balanceLabel="Staked LP Balance"
            tokenSymbol={lpPairName}
            stakingContractAddress={stakingInfo?.stakingAddress}
            isLoading={
              isInitiallyLoadingStaked || (staking?.isOperationLoading('unstake') ?? false)
            }
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-6">
        <StakingActions
          onStake={() => void handleStake()}
          onUnstake={() => void handleUnstake()}
          onClaim={handleClaim}
          isStakeDisabled={isStakeDisabled}
          isUnstakeDisabled={isUnstakeDisabled}
          isClaimDisabled={isClaimDisabled}
          isStakeLoading={staking?.isOperationLoading('stake') ?? false}
          isUnstakeLoading={staking?.isOperationLoading('unstake') ?? false}
          isClaimLoading={staking?.isOperationLoading('claim') ?? false}
        />
      </div>
    </div>
  );
};

export default StakingForm;
