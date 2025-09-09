import { ContractInfo } from '@/lib/keplr/common/types';
import {
  claimRewards,
  getRewards,
  getStakedBalance,
  stakeLP,
  unstakeLP,
} from '@/lib/keplr/incentives';
import { useTxStore } from '@/store/txStore';
import { useViewingKeyStore } from '@/store/viewingKeyStore';
import isNotNullish from '@/utils/isNotNullish';
import { toastManager } from '@/utils/toast/toastManager';
import { useCallback, useEffect, useRef, useState } from 'react';
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

// Global rate limiter to prevent excessive API calls
const globalLastCallTimestamps = new Map<string, number>(); // Key: contract-wallet-operation
const RATE_LIMIT_WINDOW_MS = 5000; // 5 seconds minimum between calls for the same resource

// Global coordination to prevent multiple simultaneous fetches
const globalFetchState = new Map<string, { isActive: boolean; lastFetch: number }>();
const FETCH_COORDINATION_WINDOW_MS = 10000; // Increased to 10 seconds to better prevent 429 errors

/**
 * Checks if an API call can proceed based on rate limiting rules.
 * @param stakingContractAddress The address of the staking contract.
 * @param walletAddr The user's wallet address.
 * @param operationName A unique name for the operation (e.g., 'fetchBalance').
 * @returns True if the call can proceed, false if it should be skipped.
 */
function canCallApi(
  stakingContractAddress: string | undefined,
  walletAddr: string | undefined,
  operationName: string
): boolean {
  if (!stakingContractAddress || !walletAddr) {
    // console.warn(`Rate limiter: Missing contractAddress or walletAddress for ${operationName}. Allowing call by default.`);
    return true; // Allow if critical identifiers are missing, to avoid blocking valid calls due to unforeseen state issues.
  }

  const key = `${stakingContractAddress}-${walletAddr}-${operationName}`;
  const now = Date.now();
  const lastCallTime = globalLastCallTimestamps.get(key) || 0;

  if (now - lastCallTime < RATE_LIMIT_WINDOW_MS) {
    // console.log(`Rate limiter: Skipped ${operationName} for ${stakingContractAddress} / ${walletAddr}. Last call at ${new Date(lastCallTime).toISOString()}, Now: ${new Date(now).toISOString()}`);
    return false; // Skip call
  }

  // Record the attempt time before the call is made
  globalLastCallTimestamps.set(key, now);
  return true;
}

export function useStaking({ secretjs, walletAddress, stakingInfo }: UseStakingParams) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [stakedBalance, setStakedBalance] = useState<string | null>(null);
  const [pendingRewards, setPendingRewards] = useState<string | null>(null);
  const [viewingKey, setViewingKey] = useState<string | null>(null);
  const getStoreViewingKey = useViewingKeyStore((state) => state.getViewingKey);
  const { setPending, setResult } = useTxStore();
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingRef = useRef<Record<string, boolean>>({});
  const isPollingActiveRef = useRef<boolean>(false);

  // Helper function to set loading state for operations
  const setLoadingState = useCallback((operation: string, isLoading: boolean) => {
    loadingRef.current = { ...loadingRef.current, [operation]: isLoading };
    setLoading((prev) => ({ ...prev, [operation]: isLoading }));
  }, []);

  // Check if an operation is currently loading
  const isOperationLoading = useCallback((operation: string) => {
    return Boolean(loadingRef.current[operation]);
  }, []);

  // Fetch staked balance
  const fetchStakedBalance = useCallback(async () => {
    if (!secretjs || !isNotNullish(walletAddress) || !stakingInfo) {
      return null;
    }

    // Global coordination check - prevent multiple components from fetching simultaneously
    const coordinationKey = `${stakingInfo.stakingAddress}-${walletAddress}`;
    const now = Date.now();
    const existingState = globalFetchState.get(coordinationKey);

    if (existingState) {
      // If another component is already fetching, skip
      if (existingState.isActive) {
        const activeTime = now - existingState.lastFetch;
        console.log(
          `🔄 Skipping fetchStakedBalance - another component is already fetching (${activeTime}ms active)`
        );
        return null;
      }
      // If fetched recently, skip
      if (now - existingState.lastFetch < FETCH_COORDINATION_WINDOW_MS) {
        const timeSinceFetch = now - existingState.lastFetch;
        console.log(
          `🔄 Skipping fetchStakedBalance - fetched recently by another component (${timeSinceFetch}ms ago)`
        );
        return null;
      }
    }

    // Mark as active
    globalFetchState.set(coordinationKey, { isActive: true, lastFetch: now });

    // Use LP token viewing key for staking operations (proven to work in tests)
    const keyToUse = getStoreViewingKey(stakingInfo.lpTokenAddress) || viewingKey;

    console.log('🔧 Using LP token VK for staking:');
    console.log('  - LP Token Address:', stakingInfo.lpTokenAddress);
    console.log('  - LP Store key:', getStoreViewingKey(stakingInfo.lpTokenAddress));
    console.log('  - Local key fallback:', viewingKey);
    console.log('  - Final keyToUse:', keyToUse);
    console.log('  - All keys in store:', useViewingKeyStore.getState().viewingKeys);

    if (!isNotNullish(keyToUse)) {
      // Mark as no longer active
      globalFetchState.set(coordinationKey, { isActive: false, lastFetch: now });
      return null;
    }

    if (loadingRef.current.fetchBalance) {
      // Mark as no longer active
      globalFetchState.set(coordinationKey, { isActive: false, lastFetch: now });
      return null;
    }

    if (!canCallApi(stakingInfo?.stakingAddress, walletAddress, 'fetchStakedBalance')) {
      // Mark as no longer active
      globalFetchState.set(coordinationKey, { isActive: false, lastFetch: now });
      return null;
    }

    setLoadingState('fetchBalance', true);
    try {
      const balance = await getStakedBalance({
        secretjs,
        lpToken: stakingInfo.lpTokenAddress,
        address: walletAddress,
        viewingKey: keyToUse,
        stakingContractAddress: stakingInfo.stakingAddress,
        stakingContractCodeHash: stakingInfo.stakingCodeHash,
      });
      setStakedBalance(balance);
      return balance;
    } catch (error) {
      console.error('Error fetching staked balance:', error);
      return null;
    } finally {
      setLoadingState('fetchBalance', false);
      // Mark as no longer active
      globalFetchState.set(coordinationKey, { isActive: false, lastFetch: now });
    }
  }, [secretjs, walletAddress, stakingInfo, viewingKey, getStoreViewingKey]);

  // Fetch pending rewards
  const fetchPendingRewards = useCallback(async () => {
    if (!secretjs || !isNotNullish(walletAddress) || !stakingInfo) {
      return null;
    }

    // Use LP token viewing key for staking operations (proven to work in tests)
    const keyToUse = getStoreViewingKey(stakingInfo.lpTokenAddress) || viewingKey;

    if (!isNotNullish(keyToUse)) {
      return null;
    }

    if (loadingRef.current.fetchRewards) {
      return null;
    }

    if (!canCallApi(stakingInfo?.stakingAddress, walletAddress, 'fetchPendingRewards')) {
      return null;
    }

    setLoadingState('fetchRewards', true);
    try {
      const rewards = await getRewards({
        secretjs,
        lpToken: stakingInfo.lpTokenAddress,
        address: walletAddress,
        viewingKey: keyToUse,
        stakingContractAddress: stakingInfo.stakingAddress,
        stakingContractCodeHash: stakingInfo.stakingCodeHash,
      });
      // console.log('rewards', rewards); // Keep this log for now as it seems useful for user
      setPendingRewards(rewards);
      return rewards;
    } catch (error) {
      console.error('Error fetching pending rewards:', error);
      return null;
    } finally {
      setLoadingState('fetchRewards', false);
    }
  }, [secretjs, walletAddress, stakingInfo, viewingKey, getStoreViewingKey]);

  // Stake LP tokens
  const stakeLpTokens = useCallback(
    async (amount: string) => {
      console.log('🎯 STAKING HOOK: stakeLpTokens called with amount:', amount);
      console.log('🎯 STAKING HOOK: Current state:', {
        hasSecretjs: !!secretjs,
        hasStakingInfo: !!stakingInfo,
        stakingInfo: stakingInfo
          ? {
              lpTokenAddress: stakingInfo.lpTokenAddress,
              stakingAddress: stakingInfo.stakingAddress,
              rewardTokenSymbol: stakingInfo.rewardTokenSymbol,
            }
          : null,
      });

      if (!secretjs || !stakingInfo) {
        console.log('🎯 STAKING HOOK: Missing dependencies, returning false');
        return false;
      }

      console.log('🎯 STAKING HOOK: Setting loading state and pending...');
      setLoadingState('stake', true);
      setPending(true);

      try {
        const lpTokenContract: ContractInfo = {
          address: stakingInfo.lpTokenAddress,
          code_hash: stakingInfo.lpTokenCodeHash,
        };

        console.log('🎯 STAKING HOOK: Created LP token contract info:', lpTokenContract);

        // const stakingContract: ContractInfo = {
        //   address: stakingInfo.stakingAddress,
        //   code_hash: stakingInfo.stakingCodeHash,
        // };

        console.log('🎯 STAKING HOOK: Calling stakeLP function...');
        const result = await stakeLP({
          secretjs,
          lpToken: lpTokenContract.address,
          amount,
        });

        console.log('🎯 STAKING HOOK: stakeLP result:', result);

        setResult(result);

        console.log('🎯 STAKING HOOK: Refreshing balances...');
        // Refresh balances after staking
        await Promise.all([fetchStakedBalance(), fetchPendingRewards()]);

        console.log('🎯 STAKING HOOK: Staking completed successfully');
        return true;
      } catch (error) {
        console.error('🎯 STAKING HOOK: Error staking LP tokens:', error);
        console.error('🎯 STAKING HOOK: Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        toast.error('Failed to stake LP tokens');
        return false;
      } finally {
        console.log('🎯 STAKING HOOK: Clearing loading state and pending...');
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

  // Auto-poll pending rewards every 10 seconds
  useEffect(() => {
    if (!secretjs || !walletAddress || !stakingInfo || !viewingKey) {
      // Clear any existing interval if dependencies are not met
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        isPollingActiveRef.current = false;
      }
      return;
    }

    // Don't set up polling if it's already active with the same dependencies
    if (isPollingActiveRef.current) {
      return;
    }

    // Clear any existing interval before setting up a new one
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Debounce the setup to prevent rapid re-initialization
    const setupTimeout = setTimeout(() => {
      isPollingActiveRef.current = true;

      // Initial fetch of both balance and rewards
      void fetchStakedBalance();
      void fetchPendingRewards();

      // Set up polling interval for both
      pollingIntervalRef.current = setInterval(() => {
        void fetchStakedBalance();
        void fetchPendingRewards();
      }, 30000); // 30 seconds to reduce API load and prevent 429 errors
    }, 100); // 100ms debounce

    return () => {
      clearTimeout(setupTimeout);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        isPollingActiveRef.current = false;
      }
    };
  }, [secretjs, walletAddress, stakingInfo, viewingKey]);

  const setupViewingKey = useCallback(async () => {
    if (!secretjs || !stakingInfo || !isNotNullish(walletAddress)) return false;

    try {
      const keplr = window.keplr;
      if (!keplr) {
        toastManager.keplrNotInstalled();
        return false;
      }

      // Try to get existing viewing key for the LP TOKEN (required for staking operations)
      try {
        const key = await keplr.getSecret20ViewingKey('secret-4', stakingInfo.lpTokenAddress);
        if (key) {
          setViewingKey(key);
          return true;
        }
      } catch (e) {
        console.log('No existing viewing key found for LP token, will try to create one', e);
      }

      // Suggest the LP TOKEN to Keplr (required for staking operations) with dual setup fallback
      const { enhanceSuggestTokenWithDualSetup } = await import(
        '@/utils/viewingKeys/integrationHelpers'
      );
      await enhanceSuggestTokenWithDualSetup(stakingInfo.lpTokenAddress, async () => {
        await keplr.suggestToken(
          'secret-4',
          stakingInfo.lpTokenAddress,
          stakingInfo.lpTokenCodeHash
        );
      });

      // Need to wait a bit for Keplr to register the token
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to get viewing key again for the LP TOKEN
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
