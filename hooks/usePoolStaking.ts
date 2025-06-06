import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { useLoadBalancePreference } from '@/hooks/useLoadBalancePreference';
import { useStaking } from '@/hooks/useStaking';
import { useStakingStore } from '@/store/staking/stakingStore';
import { SecretString } from '@/types';
import { ViewingKeyStatus } from '@/types/staking';
import isNotNullish from '@/utils/isNotNullish';
import { convertToRawAmount } from '@/utils/staking/convertStakingAmount';
import {
  getStakingContractInfoForPool,
  hasStakingContractForPool,
} from '@/utils/staking/stakingRegistry';

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
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get load balance preferences
  const loadBalanceConfig = useLoadBalancePreference();

  // Memoize staking contract checks to prevent repeated calls
  const hasStaking = useMemo(() => {
    return isNotNullish(poolAddress) ? hasStakingContractForPool(poolAddress) : false;
  }, [poolAddress]);

  const stakingInfo = useMemo(() => {
    return isNotNullish(poolAddress) && hasStaking
      ? getStakingContractInfoForPool(poolAddress)
      : null;
  }, [poolAddress, hasStaking]);

  // Use the base staking hook
  const staking = useStaking({
    secretjs,
    walletAddress,
    stakingInfo,
  });

  // Initialize staking when component loads - but only once and respecting preferences
  useEffect(() => {
    if (hasStaking && staking !== null && !hasInitialized) {
      setHasInitialized(true);
      void initializeStaking();
    }
  }, [hasStaking, staking, poolAddress, hasInitialized]);

  // Check for existing viewing key when staking info changes
  useEffect(() => {
    if (stakingInfo && staking) {
      // Check if we already have a viewing key
      if (staking.hasViewingKey) {
        setViewingKeyStatus(ViewingKeyStatus.CREATED);
      } else {
        // Try to get existing viewing key from Keplr without prompting user
        const checkExistingViewingKey = async () => {
          try {
            const keplr = window.keplr;
            if (!keplr) return;

            const existingKey = await keplr.getSecret20ViewingKey(
              'secret-4',
              stakingInfo.stakingAddress
            );
            if (existingKey) {
              setViewingKeyStatus(ViewingKeyStatus.CREATED);
              // Initialize the staking hook with the existing key
              await staking.initialize();
            } else {
              setViewingKeyStatus(ViewingKeyStatus.NONE);
            }
          } catch (_error) {
            // No existing key found, that's fine
            setViewingKeyStatus(ViewingKeyStatus.NONE);
          }
        };

        void checkExistingViewingKey();
      }
    }
  }, [stakingInfo, staking]);

  /**
   * Initialize the staking functionality and set up viewing key
   */
  const initializeStaking = async () => {
    if (staking === null) return;

    // Don't reinitialize if we already have a viewing key
    if (viewingKeyStatus === ViewingKeyStatus.CREATED) {
      return;
    }

    setViewingKeyStatus(ViewingKeyStatus.PENDING);

    try {
      await staking.initialize();

      if (staking.hasViewingKey !== null && staking.hasViewingKey !== '') {
        setViewingKeyStatus(ViewingKeyStatus.CREATED);

        // Only auto-refresh balances if load preference allows it
        if (loadBalanceConfig.shouldAutoLoad) {
          refreshBalances();
        }
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

        // Only auto-refresh balances if load preference allows it
        if (loadBalanceConfig.shouldAutoLoad) {
          refreshBalances();
        }

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
   * Refresh staking balances - can be called manually
   */
  const refreshBalances = () => {
    if (staking === null) return;

    try {
      // Only manually refresh if we're not already polling automatically
      // The useStaking hook already handles automatic polling when a viewing key is available
      if (!staking.hasViewingKey) {
        toast.info('Please set up viewing key first to view balances');
        return;
      }

      // Since useStaking already handles automatic polling, we don't need to manually call these
      // Just show a message that balances are being refreshed automatically
      toast.info('Balances are automatically refreshed every 10 seconds');
    } catch (error) {
      console.error('Error refreshing balances:', error);
      toast.error('Failed to refresh staking balances');
    }
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

      // The amount from transaction logs is already in raw format (with decimals applied)
      // so we don't need to convert it again
      return await staking.stakeLpTokens(amount);
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
    loadBalanceConfig,

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
