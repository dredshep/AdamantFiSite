import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import ViewingKeyStatusComponent from '@/components/common/ViewingKeyStatus';
import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { usePoolStaking } from '@/hooks/usePoolStaking';
import { usePoolStore } from '@/store/forms/poolStore';
import { ViewingKeyStatus } from '@/types/staking';
// import { getCodeHashByAddress } from '@/utils/secretjs/tokens/getCodeHashByAddress';
import { Window } from '@keplr-wallet/types';
import React, { useEffect, useState } from 'react';
import StakingActions from './StakingActions';
import StakingInput from './StakingInput';
import StakingOverview from './StakingOverview';
import StakingPoolSelector from './StakingPoolSelector';

const StakingForm: React.FC = () => {
  const { selectedPool } = usePoolStore();
  const { secretjs } = useKeplrConnection();
  const poolStaking = usePoolStaking(selectedPool?.address ?? null);
  const [lpTokenBalance, setLpTokenBalance] = useState<string>('0');
  const [isLpBalanceLoading, setIsLpBalanceLoading] = useState<boolean>(false);

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

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [StakingForm Debug]');
    console.log('Selected pool:', selectedPool?.address);
    console.log('Has staking rewards:', hasStakingRewards);
    console.log('Staking info:', stakingInfo);
    console.log('Staking state:', staking);
    console.log('Load balance config:', loadBalanceConfig);
  }

  // Fetch LP token balance when viewing key is created
  useEffect(() => {
    if (
      viewingKeyStatus === ViewingKeyStatus.CREATED &&
      selectedPool?.address &&
      secretjs !== null &&
      secretjs !== undefined
    ) {
      const fetchLpBalance = async () => {
        try {
          setIsLpBalanceLoading(true);
          const keplr = (window as unknown as Window).keplr;
          if (!keplr) return;

          // Get the LP token address from LIQUIDITY_PAIRS config instead of pairInfo
          const pairInfo = LIQUIDITY_PAIRS.find(
            (pair) => pair.pairContract === selectedPool.address
          );
          if (!pairInfo) {
            console.error('Could not find LP token info for pool:', selectedPool.address);
            return;
          }

          const lpTokenAddress = pairInfo.lpToken;

          // Get viewing key for LP token
          let viewingKey = await keplr
            .getSecret20ViewingKey('secret-4', lpTokenAddress)
            .catch(() => null);

          // If no viewing key, suggest the token first
          if (viewingKey === null) {
            try {
              await keplr.suggestToken('secret-4', lpTokenAddress);
              // Try getting the key again after suggesting
              viewingKey = await keplr
                .getSecret20ViewingKey('secret-4', lpTokenAddress)
                .catch(() => null);
            } catch (error) {
              console.error('Error suggesting LP token:', error);
              return;
            }
          }

          if (viewingKey === null) {
            console.error('No viewing key available for LP token');
            return;
          }

          // Get LP token balance using the code hash from LIQUIDITY_PAIRS
          const balance = await secretjs.query.snip20.getBalance({
            contract: {
              address: lpTokenAddress,
              code_hash: pairInfo.lpTokenCodeHash,
            },
            address: secretjs.address,
            auth: { key: viewingKey },
          });

          if (
            balance !== undefined &&
            balance !== null &&
            typeof balance === 'object' &&
            'balance' in balance &&
            balance.balance !== undefined &&
            balance.balance !== null &&
            typeof balance.balance === 'object' &&
            'amount' in balance.balance &&
            typeof balance.balance.amount === 'string'
          ) {
            // Convert from raw amount (1000000) to display amount (1.0)
            const rawAmount = parseInt(balance.balance.amount);
            const displayAmount = (rawAmount / 1_000_000).toString();
            setLpTokenBalance(displayAmount);
          }
        } catch (error) {
          console.error('Error fetching LP token balance:', error);
        } finally {
          setIsLpBalanceLoading(false);
        }
      };

      void fetchLpBalance();
    }
  }, [viewingKeyStatus, selectedPool, secretjs]);

  // If staking is not available for this pool
  if (!selectedPool || !hasStakingRewards || stakingInfo === null) {
    return <StakingPoolSelector />;
  }

  // Get readable token symbols
  // const token0Symbol = selectedPool.token0 ? getApiTokenSymbol(selectedPool.token0) : '';
  // const token1Symbol = selectedPool.token1 ? getApiTokenSymbol(selectedPool.token1) : '';

  const lpPairName = `${selectedPool.token0?.symbol}/${selectedPool.token1?.symbol}`;

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

        <ViewingKeyStatusComponent
          status={viewingKeyStatus}
          contractAddress={stakingInfo.stakingAddress}
          onSetupViewingKey={setupViewingKey}
          isLoading={staking?.isOperationLoading('setupViewingKey') ?? false}
        />
      </div>
    );
  }

  // Setup is complete, display the staking UI
  const stakedBalance = staking?.stakedBalance ?? null;
  const pendingRewards = staking?.pendingRewards ?? null;
  const isBalanceLoading =
    (staking?.isOperationLoading('fetchBalance') ?? false) ||
    (staking?.isOperationLoading('fetchRewards') ?? false) ||
    isLpBalanceLoading;

  // Check if stakingInputs has a valid amount
  const hasStakeAmount = poolStaking.stakingInputs.stakeAmount.amount !== '';
  const hasUnstakeAmount = poolStaking.stakingInputs.unstakeAmount.amount !== '';

  // Fixed conditional checks to avoid object truthiness checks
  const isStakeDisabled = isBalanceLoading || !hasStakeAmount;
  const isUnstakeDisabled = isBalanceLoading || !hasUnstakeAmount || stakedBalance === '0';
  const isClaimDisabled = isBalanceLoading || pendingRewards === '0' || pendingRewards === null;

  const handleStake = () => {
    void stakeLpTokens();
  };

  const handleUnstake = () => {
    void unstakeLpTokens();
  };

  const handleClaim = () => {
    void claimRewards();
  };

  return (
    <div className="flex flex-col gap-6 py-6 px-6 flex-1">
      {/* Header Section - Compact */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <TokenImageWithFallback
            tokenAddress={stakingInfo?.stakingAddress}
            size={24}
            alt={`${lpPairName} staking pool`}
          />
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
          isLoading={isBalanceLoading}
          showRefreshButton={loadBalanceConfig.shouldShowFetchButton}
          onRefresh={refreshBalances}
          isRefreshing={isBalanceLoading}
          stakingContractAddress={stakingInfo?.stakingAddress}
          pairSymbol={lpPairName}
        />

        {/* Staking Input Section */}
        <StakingInput
          inputIdentifier="stakeAmount"
          operation="stake"
          balance={lpTokenBalance}
          balanceLabel="Available LP Balance"
          tokenSymbol={lpPairName}
          stakingContractAddress={stakingInfo?.stakingAddress}
          isLoading={(staking?.isOperationLoading('stake') ?? false) || isLpBalanceLoading}
        />

        {/* Unstaking Section - Only show if user has staked tokens */}
        {stakedBalance !== '0' && stakedBalance !== null && (
          <StakingInput
            inputIdentifier="unstakeAmount"
            operation="unstake"
            balance={stakedBalance}
            balanceLabel="Staked LP Balance"
            tokenSymbol={lpPairName}
            stakingContractAddress={stakingInfo?.stakingAddress}
            isLoading={staking?.isOperationLoading('unstake') ?? false}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-6">
        <StakingActions
          onStake={handleStake}
          onUnstake={handleUnstake}
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
