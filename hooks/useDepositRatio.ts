import { usePoolStore } from '@/store/forms/poolStore';
import {
  PoolReserves,
  calculateProportionalAmount,
  convertPoolReservesToFormat,
} from '@/utils/pool/ratioCalculation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDepositRatioProps {
  poolData?:
    | {
        assets: Array<{
          info: {
            token: {
              contract_addr: string;
              token_code_hash?: string;
              viewing_key?: string;
            };
          };
          amount: string;
        }>;
        total_share?: string;
      }
    | undefined;
}

export function useDepositRatio({ poolData }: UseDepositRatioProps) {
  const { selectedPool, tokenInputs, setTokenInputAmount } = usePoolStore();
  const [poolReserves, setPoolReserves] = useState<PoolReserves | null>(null);
  const isUpdatingRef = useRef(false);
  const lastInputRef = useRef<{
    field: 'tokenA' | 'tokenB';
    amount: string;
    timestamp: number;
  } | null>(null);

  // Update pool reserves when pool data changes
  useEffect(() => {
    if (!poolData || !selectedPool?.token0 || !selectedPool?.token1) {
      console.log('🏦 Pool reserves cleared - missing data:', {
        hasPoolData: !!poolData,
        hasToken0: !!selectedPool?.token0,
        hasToken1: !!selectedPool?.token1,
      });
      setPoolReserves(null);
      return;
    }

    const reserves = convertPoolReservesToFormat(
      poolData,
      selectedPool.token0.address,
      selectedPool.token1.address
    );

    console.log('🏦 Pool reserves updated:', {
      poolData: poolData.assets,
      token0Address: selectedPool.token0.address,
      token1Address: selectedPool.token1.address,
      reserves,
    });

    setPoolReserves(reserves);
  }, [poolData, selectedPool]);

  // Function to update the proportional amount
  const updateProportionalAmount = useCallback(
    (sourceField: 'tokenA' | 'tokenB', newAmount: string) => {
      if (
        !poolReserves ||
        !selectedPool?.token0 ||
        !selectedPool?.token1 ||
        isUpdatingRef.current
      ) {
        return;
      }

      // Prevent infinite loops
      isUpdatingRef.current = true;

      try {
        const isTokenASource = sourceField === 'tokenA';
        const inputTokenAddress = isTokenASource
          ? selectedPool.token0.address
          : selectedPool.token1.address;
        const targetField = isTokenASource ? 'tokenB' : 'tokenA';
        const targetInputIdentifier = isTokenASource
          ? 'pool.deposit.tokenB'
          : 'pool.deposit.tokenA';

        // Calculate proportional amount
        const result = calculateProportionalAmount(newAmount, inputTokenAddress, poolReserves);

        console.log('🔄 Ratio calculation:', {
          sourceField,
          newAmount,
          inputTokenAddress,
          targetField,
          result,
        });

        if (result.isValid && result.amount !== undefined) {
          // Only update if the calculated amount is different from current amount
          const currentTargetAmount = tokenInputs[targetInputIdentifier]?.amount || '';
          if (currentTargetAmount !== result.amount) {
            console.log('✅ Updating target amount:', {
              target: targetField,
              from: currentTargetAmount,
              to: result.amount,
            });
            setTokenInputAmount(targetInputIdentifier, result.amount);
          }
        } else if (result.error) {
          console.warn('❌ Ratio calculation error:', result.error);
          // Clear the target field if there's an error
          if (tokenInputs[targetInputIdentifier]?.amount) {
            setTokenInputAmount(targetInputIdentifier, '');
          }
        }
      } catch (error) {
        console.error('Error in updateProportionalAmount:', error);
      } finally {
        // Reset the flag after a short delay to allow the state update to complete
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    },
    [poolReserves, selectedPool, tokenInputs, setTokenInputAmount]
  );

  // Monitor token input changes and update proportional amounts
  useEffect(() => {
    if (!poolReserves || isUpdatingRef.current) {
      return;
    }

    const tokenAAmount = tokenInputs['pool.deposit.tokenA']?.amount || '';
    const tokenBAmount = tokenInputs['pool.deposit.tokenB']?.amount || '';

    console.log('👀 Token inputs changed:', {
      tokenAAmount,
      tokenBAmount,
      isUpdating: isUpdatingRef.current,
      hasPoolReserves: !!poolReserves,
    });

    // Track which field was last modified
    const now = Date.now();
    const lastInput = lastInputRef.current;

    // Determine which field changed
    let changedField: 'tokenA' | 'tokenB' | null = null;

    if (lastInput) {
      // Check if either field changed since last update
      if (lastInput.field === 'tokenA' && tokenAAmount !== lastInput.amount) {
        changedField = 'tokenA';
      } else if (lastInput.field === 'tokenB' && tokenBAmount !== lastInput.amount) {
        changedField = 'tokenB';
      } else if (lastInput.field === 'tokenA' && tokenBAmount && !lastInput.amount) {
        changedField = 'tokenB';
      } else if (lastInput.field === 'tokenB' && tokenAAmount && !lastInput.amount) {
        changedField = 'tokenA';
      }
    } else {
      // First time - determine which field has a value
      if (tokenAAmount && !tokenBAmount) {
        changedField = 'tokenA';
      } else if (tokenBAmount && !tokenAAmount) {
        changedField = 'tokenB';
      }
    }

    // Update the last input reference
    if (tokenAAmount) {
      lastInputRef.current = { field: 'tokenA', amount: tokenAAmount, timestamp: now };
    } else if (tokenBAmount) {
      lastInputRef.current = { field: 'tokenB', amount: tokenBAmount, timestamp: now };
    } else {
      lastInputRef.current = null;
    }

    // If both fields are empty, do nothing
    if (!tokenAAmount && !tokenBAmount) {
      console.log('⏸️ Both fields empty, skipping calculation');
      return;
    }

    // Calculate proportional amount based on which field changed
    if (changedField === 'tokenA' && tokenAAmount && !tokenBAmount) {
      console.log('➡️ Calculating tokenB from tokenA:', tokenAAmount);
      updateProportionalAmount('tokenA', tokenAAmount);
    } else if (changedField === 'tokenB' && tokenBAmount && !tokenAAmount) {
      console.log('⬅️ Calculating tokenA from tokenB:', tokenBAmount);
      updateProportionalAmount('tokenB', tokenBAmount);
    } else if (tokenAAmount && tokenBAmount) {
      console.log('⚠️ Both fields have values, skipping auto-calculation');
    }
  }, [tokenInputs, updateProportionalAmount, poolReserves]);

  return {
    poolReserves,
    hasValidReserves: poolReserves !== null,
  };
}
