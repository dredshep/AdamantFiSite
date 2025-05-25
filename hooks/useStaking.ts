import { ContractInfo } from '@/lib/keplr/common/types';
import {
  claimRewards,
  getRewards,
  getStakedBalance,
  stakeLP,
  unstakeLP,
} from '@/lib/keplr/incentives';
import { useTxStore } from '@/store/txStore';
import isNotNullish from '@/utils/isNotNullish';
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { SecretNetworkClient } from 'secretjs';

interface StakingContractInfo {
  lpTokenAddress: string;
  lpTokenCodeHash: string;
  stakingAddress: string;
  stakingCodeHash: string;
  rewardTokenSymbol: string;
}

interface UseStakingParams {
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
        stakingContractAddress: stakingInfo.stakingAddress,
        stakingContractCodeHash: stakingInfo.stakingCodeHash,
      });

      setStakedBalance(balance);
      return balance;
    } catch (error) {
      console.error('Error fetching staked balance:', error);
      // Don't show individual toast - let the calling function handle it
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
        lpToken: stakingInfo.lpTokenAddress,
        address: walletAddress,
        viewingKey,
        stakingContractAddress: stakingInfo.stakingAddress,
        stakingContractCodeHash: stakingInfo.stakingCodeHash,
      });

      setPendingRewards(rewards);
      return rewards;
    } catch (error) {
      console.error('Error fetching pending rewards:', error);
      // Don't show individual toast - let the calling function handle it
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

        // const stakingContract: ContractInfo = {
        //   address: stakingInfo.stakingAddress,
        //   code_hash: stakingInfo.stakingCodeHash,
        // };

        const result = await stakeLP({
          secretjs,
          lpToken: lpTokenContract.address,
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
        // const stakingContract: ContractInfo = {
        //   address: stakingInfo.stakingAddress,
        //   code_hash: stakingInfo.stakingCodeHash,
        // };

        const result = await unstakeLP({
          secretjs,
          lpToken: stakingInfo.lpTokenAddress,
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
        // amount: '0',
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

      // Try to get existing viewing key for the STAKING CONTRACT (not LP token)
      try {
        const key = await keplr.getSecret20ViewingKey('secret-4', stakingInfo.stakingAddress);
        if (key) {
          setViewingKey(key);
          return true;
        }
      } catch (e) {
        console.log(
          'No existing viewing key found for staking contract, will try to create one',
          e
        );
      }

      // Suggest the STAKING CONTRACT to Keplr (not LP token)
      await keplr.suggestToken('secret-4', stakingInfo.stakingAddress, stakingInfo.stakingCodeHash);

      // Need to wait a bit for Keplr to register the token
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to get viewing key again for the STAKING CONTRACT
      const key = await keplr.getSecret20ViewingKey('secret-4', stakingInfo.stakingAddress);
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

  // Initialize - set up viewing key but don't auto-fetch balances (prevent infinite loops)
  const initialize = useCallback(async () => {
    const hasViewingKey = await setupViewingKey();
    // Don't auto-fetch balances here - let the calling component decide based on load preferences
    return hasViewingKey;
  }, [setupViewingKey]);

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
