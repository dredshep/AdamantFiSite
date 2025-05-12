import ViewingKeyStatusComponent from '@/components/common/ViewingKeyStatus';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { usePoolStaking } from '@/hooks/usePoolStaking';
import { usePoolStore } from '@/store/forms/poolStore';
import { ViewingKeyStatus } from '@/types/staking';
import { getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import { getCodeHashByAddress } from '@/utils/secretjs/tokens/getCodeHashByAddress';
import { Window } from '@keplr-wallet/types';
import React, { useEffect, useState } from 'react';
import StakingActions from './StakingActions';
import StakingInput from './StakingInput';
import StakingOverview from './StakingOverview';

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
  } = poolStaking;

  // Refresh staking balances when the component is mounted
  useEffect(() => {
    if (viewingKeyStatus === ViewingKeyStatus.CREATED && staking !== null) {
      void refreshBalances();
    }
  }, [viewingKeyStatus, staking, refreshBalances]);

  // Fetch LP token balance when viewing key is created
  useEffect(() => {
    if (
      viewingKeyStatus === ViewingKeyStatus.CREATED &&
      selectedPool?.pairInfo?.liquidity_token !== undefined &&
      typeof selectedPool?.pairInfo?.liquidity_token === 'string' &&
      secretjs !== null &&
      secretjs !== undefined
    ) {
      const fetchLpBalance = async () => {
        try {
          setIsLpBalanceLoading(true);
          const keplr = (window as unknown as Window).keplr;
          if (!keplr) return;

          const lpTokenAddress = selectedPool.pairInfo.liquidity_token;

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

          // Get LP token balance
          const codeHash = getCodeHashByAddress(lpTokenAddress);
          const balance = await secretjs.query.snip20.getBalance({
            contract: {
              address: lpTokenAddress,
              code_hash: codeHash,
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
    return (
      <div className="flex flex-col gap-6 py-2.5 px-2.5 flex-1 justify-center items-center">
        <p className="text-gray-400">Staking is not available for this pool.</p>
      </div>
    );
  }

  // Get readable token symbols
  const token0Symbol = selectedPool.token0 ? getApiTokenSymbol(selectedPool.token0) : '';
  const token1Symbol = selectedPool.token1 ? getApiTokenSymbol(selectedPool.token1) : '';
  const lpPairName = `${token0Symbol}/${token1Symbol}`;

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
          contractAddress={stakingInfo.lpTokenAddress}
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
    <div className="flex flex-col gap-6 py-2.5 px-2.5 flex-1 justify-between">
      <div className="flex flex-col gap-6">
        <div className="mb-1">
          <h3 className="text-white font-medium mb-2">Staking {lpPairName} LP</h3>
          <p className="text-gray-400 text-sm">
            Stake your liquidity provider tokens to earn {stakingInfo.rewardTokenSymbol} rewards.
          </p>
        </div>

        <StakingOverview
          stakedBalance={stakedBalance}
          pendingRewards={pendingRewards}
          rewardSymbol={stakingInfo.rewardTokenSymbol}
          isLoading={isBalanceLoading}
        />

        <StakingInput
          inputIdentifier="stakeAmount"
          operation="stake"
          balance={lpTokenBalance}
          balanceLabel="Available LP Balance"
          isLoading={(staking?.isOperationLoading('stake') ?? false) || isLpBalanceLoading}
        />

        {stakedBalance !== '0' && stakedBalance !== null && (
          <StakingInput
            inputIdentifier="unstakeAmount"
            operation="unstake"
            balance={stakedBalance}
            balanceLabel="Staked LP Balance"
            isLoading={staking?.isOperationLoading('unstake') ?? false}
          />
        )}
      </div>

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
  );
};

export default StakingForm;
