import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { useStaking } from '@/hooks/useStaking';
import { useStakingStore } from '@/store/staking/stakingStore';
import { SecretString } from '@/types';
import { ViewingKeyStatus } from '@/types/staking';
import isNotNullish from '@/utils/isNotNullish';
import { convertToRawAmount } from '@/utils/staking/convertStakingAmount';
import { getStakingContractInfo, hasStakingContract } from '@/utils/staking/stakingRegistry';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

/**
 * A hook that provides staking functionality specific to liquidity pools
 *
 * @param poolAddress The address of the liquidity pool
 * @returns Staking operations and state
 */
export function usePoolStaking(poolAddress: SecretString | null) {
  const { secretjs, walletAddress } = useKeplrConnection();
  const { autoStake, setAutoStake, stakingInputs, setStakingInputAmount } = useStakingStore();
  const [viewingKeyStatus, setViewingKeyStatus] = useState<ViewingKeyStatus>(ViewingKeyStatus.NONE);

  // Check if the pool has a staking contract
  const hasStaking = isNotNullish(poolAddress) ? hasStakingContract(poolAddress) : false;
  const stakingInfo =
    isNotNullish(poolAddress) && hasStaking ? getStakingContractInfo(poolAddress) : null;

  // Use the base staking hook
  const staking = useStaking({
    secretjs,
    walletAddress,
    stakingInfo,
  });

  // Initialize staking when component loads
  useEffect(() => {
    if (hasStaking && staking !== null) {
      void initializeStaking();
    }
  }, [hasStaking, staking, poolAddress]);

  /**
   * Initialize the staking functionality and set up viewing key
   */
  const initializeStaking = async () => {
    if (staking === null) return;

    setViewingKeyStatus(ViewingKeyStatus.PENDING);

    try {
      await staking.initialize();

      if (staking.hasViewingKey !== null && staking.hasViewingKey !== '') {
        setViewingKeyStatus(ViewingKeyStatus.CREATED);
        void refreshBalances();
      } else {
        setViewingKeyStatus(ViewingKeyStatus.NONE);
      }
    } catch (error) {
      console.error('Error initializing staking:', error);
      setViewingKeyStatus(ViewingKeyStatus.ERROR);
    }
  };

  /**
   * Set up viewing key for the staking contract
   */
  const setupViewingKey = async () => {
    if (staking === null) return;

    setViewingKeyStatus(ViewingKeyStatus.PENDING);

    try {
      const success = await staking.setupViewingKey();

      if (success) {
        setViewingKeyStatus(ViewingKeyStatus.CREATED);
        void refreshBalances();
        toast.success('Viewing key set up successfully');
      } else {
        setViewingKeyStatus(ViewingKeyStatus.ERROR);
        toast.error('Failed to set up viewing key');
      }
    } catch (error) {
      console.error('Error setting up viewing key:', error);
      setViewingKeyStatus(ViewingKeyStatus.ERROR);
      toast.error('Error setting up viewing key');
    }
  };

  /**
   * Refresh staking balances
   */
  const refreshBalances = async () => {
    if (staking === null) return;

    await Promise.all([staking.fetchStakedBalance(), staking.fetchPendingRewards()]);
  };

  /**
   * Stake LP tokens
   */
  const stakeLpTokens = async (): Promise<boolean> => {
    if (staking === null) return false;

    const amount = stakingInputs.stakeAmount.amount;
    if (!amount || amount === '') {
      toast.error('Please enter an amount to stake');
      return false;
    }

    // Convert display amount to raw amount for the contract
    // LP tokens typically have 6 decimals
    const rawAmount = convertToRawAmount(amount, 6);

    const success = await staking.stakeLpTokens(rawAmount);

    if (success) {
      // Reset input after successful stake
      setStakingInputAmount('stakeAmount', '');
      toast.success(`Successfully staked ${amount} LP tokens`);
    }

    return success;
  };

  /**
   * Unstake LP tokens
   */
  const unstakeLpTokens = async (): Promise<boolean> => {
    if (staking === null) return false;

    const amount = stakingInputs.unstakeAmount.amount;
    if (!amount || amount === '') {
      toast.error('Please enter an amount to unstake');
      return false;
    }

    // Convert display amount to raw amount for the contract
    // LP tokens typically have 6 decimals
    const rawAmount = convertToRawAmount(amount, 6);

    const success = await staking.unstakeLpTokens(rawAmount);

    if (success) {
      // Reset input after successful unstake
      setStakingInputAmount('unstakeAmount', '');
      toast.success(`Successfully unstaked ${amount} LP tokens`);
    }

    return success;
  };

  /**
   * Claim staking rewards
   */
  const claimRewards = async (): Promise<boolean> => {
    if (staking === null) return false;

    // Check if there are rewards to claim
    if (staking.pendingRewards === null || staking.pendingRewards === '0') {
      toast.info('No rewards to claim');
      return false;
    }

    const success = await staking.claimStakingRewards();

    if (success) {
      toast.success('Successfully claimed rewards');
    }

    return success;
  };

  /**
   * Auto-stake LP tokens after providing liquidity
   */
  const autoStakeLpTokens = useCallback(
    async (amount: string): Promise<boolean> => {
      if (staking === null || !autoStake) return false;

      // Convert display amount to raw amount for the contract
      // LP tokens typically have 6 decimals
      const rawAmount = convertToRawAmount(amount, 6);

      return await staking.stakeLpTokens(rawAmount);
    },
    [staking, autoStake]
  );

  // Return the pool staking interface
  return {
    // State
    hasStakingRewards: hasStaking,
    stakingInfo,
    staking,
    autoStake,
    setAutoStake,
    viewingKeyStatus,
    stakingInputs,

    // Actions
    setStakingInputAmount,
    setupViewingKey,
    stakeLpTokens,
    unstakeLpTokens,
    claimRewards,
    autoStakeLpTokens,
    refreshBalances,
  };
}
