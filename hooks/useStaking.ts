import { useState, useCallback } from 'react';
import { SecretNetworkClient } from 'secretjs';
import { toast } from 'react-toastify';
import {
  getStakedBalance,
  getRewards,
  stakeLP,
  unstakeLP,
  claimRewards,
} from '@/lib/keplr/incentives';
import { ContractInfo } from '@/lib/keplr/common/types';
import { useTxStore } from '@/store/txStore';
import isNotNullish from '@/utils/isNotNullish';

export interface StakingContractInfo {
  lpTokenAddress: string;
  lpTokenCodeHash: string;
  stakingAddress: string;
  stakingCodeHash: string;
  rewardTokenSymbol: string;
}

export interface UseStakingParams {
  secretjs: SecretNetworkClient | null;
  walletAddress: string | null;
  stakingInfo: StakingContractInfo | null;
}

export function useStaking({ secretjs, walletAddress, stakingInfo }: UseStakingParams) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [stakedBalance, setStakedBalance] = useState<string | null>(null);
  const [pendingRewards, setPendingRewards] = useState<string | null>(null);
  const [viewingKey, setViewingKey] = useState<string | null>(null);
  const { setPending, setResult } = useTxStore();

  // Helper function to set loading state for operations
  const setLoadingState = useCallback((operation: string, isLoading: boolean) => {
    setLoading((prev) => ({ ...prev, [operation]: isLoading }));
  }, []);

  // Check if an operation is currently loading
  const isOperationLoading = useCallback(
    (operation: string) => {
      return Boolean(loading[operation]);
    },
    [loading]
  );

  // Fetch staked balance
  const fetchStakedBalance = useCallback(async () => {
    if (!secretjs || !isNotNullish(walletAddress) || !stakingInfo || !isNotNullish(viewingKey))
      return null;

    setLoadingState('fetchBalance', true);

    try {
      const balance = await getStakedBalance({
        secretjs,
        lpToken: stakingInfo.lpTokenAddress,
        address: walletAddress,
        viewingKey,
      });

      setStakedBalance(balance);
      return balance;
    } catch (error) {
      console.error('Error fetching staked balance:', error);
      toast.error('Failed to fetch staked balance');
      return null;
    } finally {
      setLoadingState('fetchBalance', false);
    }
  }, [secretjs, walletAddress, stakingInfo, viewingKey, setLoadingState]);

  // Fetch pending rewards
  const fetchPendingRewards = useCallback(async () => {
    if (!secretjs || !isNotNullish(walletAddress) || !stakingInfo || !isNotNullish(viewingKey))
      return null;

    setLoadingState('fetchRewards', true);

    try {
      const rewards = await getRewards({
        secretjs,
        lpStakingContract: {
          address: stakingInfo.stakingAddress,
          code_hash: stakingInfo.stakingCodeHash,
        },
        address: walletAddress,
        viewingKey,
      });

      setPendingRewards(rewards);
      return rewards;
    } catch (error) {
      console.error('Error fetching pending rewards:', error);
      toast.error('Failed to fetch pending rewards');
      return null;
    } finally {
      setLoadingState('fetchRewards', false);
    }
  }, [secretjs, walletAddress, stakingInfo, viewingKey, setLoadingState]);

  // Stake LP tokens
  const stakeLpTokens = useCallback(
    async (amount: string) => {
      if (!secretjs || !stakingInfo) return false;

      setLoadingState('stake', true);
      setPending(true);

      try {
        const lpTokenContract: ContractInfo = {
          address: stakingInfo.lpTokenAddress,
          code_hash: stakingInfo.lpTokenCodeHash,
        };

        const stakingContract: ContractInfo = {
          address: stakingInfo.stakingAddress,
          code_hash: stakingInfo.stakingCodeHash,
        };

        const result = await stakeLP({
          secretjs,
          lpStakingContract: stakingContract,
          lpTokenContract: lpTokenContract,
          amount,
        });

        setResult(result);

        // Refresh balances after staking
        await Promise.all([fetchStakedBalance(), fetchPendingRewards()]);

        return true;
      } catch (error) {
        console.error('Error staking LP tokens:', error);
        toast.error('Failed to stake LP tokens');
        return false;
      } finally {
        setLoadingState('stake', false);
        setPending(false);
      }
    },
    [
      secretjs,
      stakingInfo,
      setPending,
      setResult,
      fetchStakedBalance,
      fetchPendingRewards,
      setLoadingState,
    ]
  );

  // Unstake LP tokens
  const unstakeLpTokens = useCallback(
    async (amount: string) => {
      if (!secretjs || !stakingInfo) return false;

      setLoadingState('unstake', true);
      setPending(true);

      try {
        const stakingContract: ContractInfo = {
          address: stakingInfo.stakingAddress,
          code_hash: stakingInfo.stakingCodeHash,
        };

        const result = await unstakeLP({
          secretjs,
          lpStakingContract: stakingContract,
          amount,
        });

        setResult(result);

        // Refresh balances after unstaking
        await Promise.all([fetchStakedBalance(), fetchPendingRewards()]);

        return true;
      } catch (error) {
        console.error('Error unstaking LP tokens:', error);
        toast.error('Failed to unstake LP tokens');
        return false;
      } finally {
        setLoadingState('unstake', false);
        setPending(false);
      }
    },
    [
      secretjs,
      stakingInfo,
      setPending,
      setResult,
      fetchStakedBalance,
      fetchPendingRewards,
      setLoadingState,
    ]
  );

  // Claim rewards
  const claimStakingRewards = useCallback(async () => {
    if (!secretjs || !stakingInfo) return false;

    setLoadingState('claim', true);
    setPending(true);

    try {
      const stakingContract: ContractInfo = {
        address: stakingInfo.stakingAddress,
        code_hash: stakingInfo.stakingCodeHash,
      };

      const result = await claimRewards({
        secretjs,
        lpStakingContract: stakingContract,
        // FIXME: use an actual amount here, but from where?
        amount: '0',
      });

      setResult(result);

      // Update pending rewards after claiming
      await fetchPendingRewards();

      return true;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      toast.error('Failed to claim rewards');
      return false;
    } finally {
      setLoadingState('claim', false);
      setPending(false);
    }
  }, [secretjs, stakingInfo, setPending, setResult, fetchPendingRewards, setLoadingState]);

  const setupViewingKey = useCallback(async () => {
    if (!secretjs || !stakingInfo || !isNotNullish(walletAddress)) return false;

    try {
      const keplr = window.keplr;
      if (!keplr) {
        toast.error('Keplr wallet not found');
        return false;
      }

      // Try to get existing viewing key
      try {
        const key = await keplr.getSecret20ViewingKey('secret-4', stakingInfo.lpTokenAddress);
        if (key) {
          setViewingKey(key);
          return true;
        }
      } catch (e) {
        console.log('No existing viewing key found, will try to create one', e);
      }

      // Suggest token to Keplr
      await keplr.suggestToken('secret-4', stakingInfo.lpTokenAddress);

      // Need to wait a bit for Keplr to register the token
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to get viewing key again
      const key = await keplr.getSecret20ViewingKey('secret-4', stakingInfo.lpTokenAddress);
      if (key) {
        setViewingKey(key);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error setting up viewing key:', error);
      toast.error('Failed to set up viewing key');
      return false;
    }
  }, [secretjs, stakingInfo, walletAddress]);

  // Initialize - set up viewing key and fetch initial data
  const initialize = useCallback(async () => {
    const hasViewingKey = await setupViewingKey();
    if (hasViewingKey) {
      await Promise.all([fetchStakedBalance(), fetchPendingRewards()]);
    }
  }, [setupViewingKey, fetchStakedBalance, fetchPendingRewards]);

  return {
    // State
    stakedBalance,
    pendingRewards,
    loading,
    isOperationLoading,
    hasViewingKey: viewingKey,

    // Actions
    initialize,
    setupViewingKey,
    fetchStakedBalance,
    fetchPendingRewards,
    stakeLpTokens,
    unstakeLpTokens,
    claimStakingRewards,
  };
}
