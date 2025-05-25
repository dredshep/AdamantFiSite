import { usePoolStore } from '@/store/forms/poolStore';
import {
  PoolReserves,
  calculateProportionalAmount,
  convertPoolReservesToFormat,
} from '@/utils/pool/ratioCalculation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UsePoolRatioProps {
  poolData?: {
    assets: Array<{
      info: {
        token: {
          contract_addr: string;
        };
      };
      amount: string;
    }>;
  };
}

export function usePoolRatio({ poolData }: UsePoolRatioProps) {
  const { selectedPool, tokenInputs, setTokenInputAmount } = usePoolStore();
  const [poolReserves, setPoolReserves] = useState<PoolReserves | null>(null);
  const isUpdatingRef = useRef(false);

  // Update pool reserves when pool data changes
  useEffect(() => {
    if (!poolData || !selectedPool?.token0 || !selectedPool?.token1) {
      setPoolReserves(null);
      return;
    }

    const reserves = convertPoolReservesToFormat(
      poolData,
      selectedPool.token0.address,
      selectedPool.token1.address
    );

    setPoolReserves(reserves);
  }, [poolData, selectedPool]);

  // Function to update the proportional amount
  const updateProportionalAmount = useCallback(
    (changedInputIdentifier: 'pool.deposit.tokenA' | 'pool.deposit.tokenB', newAmount: string) => {
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
        const isTokenAChanged = changedInputIdentifier === 'pool.deposit.tokenA';
        const inputTokenAddress = isTokenAChanged
          ? selectedPool.token0.address
          : selectedPool.token1.address;
        const targetInputIdentifier = isTokenAChanged
          ? 'pool.deposit.tokenB'
          : 'pool.deposit.tokenA';

        // Calculate proportional amount
        const result = calculateProportionalAmount(newAmount, inputTokenAddress, poolReserves);

        if (result.isValid && result.amount !== undefined) {
          // Only update if the calculated amount is different from current amount
          const currentTargetAmount = tokenInputs[targetInputIdentifier]?.amount || '';
          if (currentTargetAmount !== result.amount) {
            setTokenInputAmount(targetInputIdentifier, result.amount);
          }
        } else if (result.error) {
          console.warn('Ratio calculation error:', result.error);
          // Clear the target field if there's an error
          setTokenInputAmount(targetInputIdentifier, '');
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

    // If both fields are empty, do nothing
    if (!tokenAAmount && !tokenBAmount) {
      return;
    }

    // If only one field has a value, calculate the other
    if (tokenAAmount && !tokenBAmount) {
      updateProportionalAmount('pool.deposit.tokenA', tokenAAmount);
    } else if (tokenBAmount && !tokenAAmount) {
      updateProportionalAmount('pool.deposit.tokenB', tokenBAmount);
    }
  }, [tokenInputs, updateProportionalAmount, poolReserves]);

  return {
    poolReserves,
    updateProportionalAmount,
    hasValidReserves: poolReserves !== null,
  };
}
