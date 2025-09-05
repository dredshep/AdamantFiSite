import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import {
  isBalanceResponse,
  isQueryErrorResponse,
  LPStakingQueryAnswer,
} from '@/types/secretswap/lp-staking';
import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';
import { useEffect, useState } from 'react';

interface VKState {
  isValid: boolean;
  hasKey: boolean;
  balance: string | null;
  error: string | null;
  isLoading: boolean;
  rawResponse?: LPStakingQueryAnswer | ViewingKeyErrorResponse; // For debugging
}

interface ViewingKeyErrorResponse {
  viewing_key_error: {
    msg: string;
  };
}

interface UseLpAndStakingVKResult {
  lpToken: VKState;
  stakingContract: VKState;
  sharedKey: string | null;
  refresh: () => void;
}

export function useLpAndStakingVK(
  lpTokenAddress: string,
  stakingContractAddress: string
): UseLpAndStakingVKResult {
  const { secretjs } = useKeplrConnection();

  const [lpToken, setLpToken] = useState<VKState>({
    isValid: false,
    hasKey: false,
    balance: null,
    error: null,
    isLoading: false,
  });

  const [stakingContract, setStakingContract] = useState<VKState>({
    isValid: false,
    hasKey: false,
    balance: null,
    error: null,
    isLoading: false,
  });

  const [sharedKey, setSharedKey] = useState<string | null>(null);

  const checkViewingKeys = async () => {
    if (!window.keplr || !lpTokenAddress || !stakingContractAddress || !secretjs) {
      return;
    }

    // Reset states
    setLpToken((prev) => ({ ...prev, isLoading: true, error: null }));
    setStakingContract((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const stakingInfo = getStakingContractInfo(lpTokenAddress);

      if (!stakingInfo) {
        const error = 'Staking contract info not found';
        setLpToken((prev) => ({ ...prev, isLoading: false, error }));
        setStakingContract((prev) => ({ ...prev, isLoading: false, error }));
        return;
      }

      // Check LP token viewing key
      let lpKey: string | null = null;
      const lpState: VKState = {
        isValid: false,
        hasKey: false,
        balance: null,
        error: null,
        isLoading: false,
      };

      try {
        lpKey = await window.keplr.getSecret20ViewingKey('secret-4', lpTokenAddress);
        lpState.hasKey = Boolean(lpKey);

        if (lpKey) {
          // Test if the LP key works by querying balance
          try {
            const result = await secretjs.query.compute.queryContract({
              contract_address: lpTokenAddress,
              code_hash: stakingInfo.lpTokenCodeHash,
              query: { balance: { address: secretjs.address, key: lpKey } },
            });

            const typedResult = result as LPStakingQueryAnswer;
            lpState.rawResponse = result as LPStakingQueryAnswer | ViewingKeyErrorResponse; // For debugging

            // Check for query_error format (staking contract style)
            if (isQueryErrorResponse(typedResult)) {
              lpState.isValid = false;
              lpState.error = typedResult.query_error.msg;
            }
            // Check for viewing_key_error format (LP token style)
            else if ('viewing_key_error' in (result as Record<string, unknown>)) {
              const errorResult = result as ViewingKeyErrorResponse;
              lpState.isValid = false;
              lpState.error = errorResult.viewing_key_error.msg;
            }
            // Check for valid balance response
            else if (isBalanceResponse(typedResult)) {
              lpState.isValid = true;
              lpState.balance = typedResult.balance.amount;
            } else {
              lpState.isValid = false;
              lpState.error = 'Unknown response format';
            }
          } catch (queryError) {
            lpState.isValid = false;
            lpState.error = queryError instanceof Error ? queryError.message : 'Query failed';
          }
        }
      } catch (keplrError) {
        lpState.error = keplrError instanceof Error ? keplrError.message : 'Keplr error';
      }

      setLpToken(lpState);

      // Check staking contract viewing key
      let stakingKey: string | null = null;
      const stakingState: VKState = {
        isValid: false,
        hasKey: false,
        balance: null,
        error: null,
        isLoading: false,
      };

      try {
        stakingKey = await window.keplr.getSecret20ViewingKey('secret-4', stakingContractAddress);
        stakingState.hasKey = Boolean(stakingKey);

        if (stakingKey) {
          // Test if the staking key works by querying balance
          try {
            const result = await secretjs.query.compute.queryContract({
              contract_address: stakingContractAddress,
              code_hash: stakingInfo.stakingCodeHash,
              query: { balance: { address: secretjs.address, key: stakingKey } },
            });

            const typedResult = result as LPStakingQueryAnswer;
            stakingState.rawResponse = result as LPStakingQueryAnswer | ViewingKeyErrorResponse; // For debugging

            if (isQueryErrorResponse(typedResult)) {
              stakingState.isValid = false;
              stakingState.error = typedResult.query_error.msg;
            } else if (isBalanceResponse(typedResult)) {
              stakingState.isValid = true;
              stakingState.balance = typedResult.balance.amount;
            } else {
              stakingState.isValid = false;
              stakingState.error = 'Unknown response format';
            }
          } catch (queryError) {
            stakingState.isValid = false;
            stakingState.error = queryError instanceof Error ? queryError.message : 'Query failed';
          }
        }
      } catch (keplrError) {
        stakingState.error = keplrError instanceof Error ? keplrError.message : 'Keplr error';
      }

      setStakingContract(stakingState);

      // Determine shared key (use LP key if both exist and match)
      if (lpKey && stakingKey && lpKey === stakingKey) {
        setSharedKey(lpKey);
      } else if (lpKey) {
        setSharedKey(lpKey);
      } else {
        setSharedKey(null);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLpToken((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
      setStakingContract((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
    }
  };

  const refresh = () => {
    void checkViewingKeys();
  };

  useEffect(() => {
    void checkViewingKeys();
  }, [lpTokenAddress, stakingContractAddress, secretjs]);

  return {
    lpToken,
    stakingContract,
    sharedKey,
    refresh,
  };
}
