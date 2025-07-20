import TokenInput from '@/components/app/Shared/Forms/Input/TokenInput';
import { TOKENS } from '@/config/tokens';
import { usePoolStore } from '@/store/forms/poolStore';
import { PoolTokenInputs } from '@/types';
import {
  PoolReserves,
  calculateProportionalAmount,
  convertPoolReservesToFormat,
} from '@/utils/pool/ratioCalculation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface RatioAwareTokenInputProps {
  inputIdentifier: keyof PoolTokenInputs;
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

const RatioAwareTokenInput: React.FC<RatioAwareTokenInputProps> = ({
  inputIdentifier,
  poolData,
}) => {
  const { selectedPool, tokenInputs, setTokenInputAmount } = usePoolStore();
  const [poolReserves, setPoolReserves] = useState<PoolReserves | null>(null);
  const isUpdatingRef = useRef(false);
  const lastUpdateRef = useRef<{ identifier: string; amount: string } | null>(null);

  const token0 = selectedPool ? TOKENS.find((t) => t.symbol === selectedPool.token0) : undefined;
  const token1 = selectedPool ? TOKENS.find((t) => t.symbol === selectedPool.token1) : undefined;

  // Update pool reserves when pool data changes
  useEffect(() => {
    if (!poolData || !token0 || !token1) {
      console.log('🏦 Pool reserves cleared - missing data:', {
        hasPoolData: !!poolData,
        hasToken0: !!token0,
        hasToken1: !!token1,
      });
      setPoolReserves(null);
      return;
    }

    const reserves = convertPoolReservesToFormat(poolData, token0.address, token1.address);

    console.log('🏦 Pool reserves updated:', {
      poolData: poolData.assets,
      token0Address: token0.address,
      token1Address: token1.address,
      reserves,
    });

    setPoolReserves(reserves);
  }, [poolData, selectedPool, token0, token1]);

  // Function to update the proportional amount
  const updateProportionalAmount = useCallback(
    (changedInputIdentifier: 'pool.deposit.tokenA' | 'pool.deposit.tokenB', newAmount: string) => {
      if (!poolReserves || !token0 || !token1 || isUpdatingRef.current) {
        return;
      }

      // Prevent infinite loops
      isUpdatingRef.current = true;

      try {
        const isTokenAChanged = changedInputIdentifier === 'pool.deposit.tokenA';
        const inputTokenAddress = isTokenAChanged ? token0.address : token1.address;
        const targetInputIdentifier = isTokenAChanged
          ? 'pool.deposit.tokenB'
          : 'pool.deposit.tokenA';

        // Calculate proportional amount
        const result = calculateProportionalAmount(newAmount, inputTokenAddress, poolReserves);

        console.log('🔄 Ratio calculation:', {
          changedInput: changedInputIdentifier,
          newAmount,
          inputTokenAddress,
          targetInput: targetInputIdentifier,
          result,
        });

        if (result.isValid && result.amount !== undefined) {
          // Only update if the calculated amount is different from current amount
          const currentTargetAmount = tokenInputs[targetInputIdentifier]?.amount || '';
          if (currentTargetAmount !== result.amount) {
            console.log('✅ Updating target amount:', {
              target: targetInputIdentifier,
              from: currentTargetAmount,
              to: result.amount,
            });
            lastUpdateRef.current = { identifier: targetInputIdentifier, amount: result.amount };
            setTokenInputAmount(targetInputIdentifier, result.amount);
          }
        } else if (result.error) {
          console.warn('❌ Ratio calculation error:', result.error);
          // Clear the target field if there's an error
          if (tokenInputs[targetInputIdentifier]?.amount) {
            lastUpdateRef.current = { identifier: targetInputIdentifier, amount: '' };
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
    [poolReserves, selectedPool, tokenInputs, setTokenInputAmount, token0, token1]
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

    // Check if this update was caused by our own ratio calculation
    const lastUpdate = lastUpdateRef.current;
    if (lastUpdate) {
      const currentAmount =
        tokenInputs[lastUpdate.identifier as keyof PoolTokenInputs]?.amount || '';
      if (currentAmount === lastUpdate.amount) {
        // This update was caused by our ratio calculation, ignore it
        console.log('🔄 Ignoring self-update:', lastUpdate);
        lastUpdateRef.current = null;
        return;
      }
      lastUpdateRef.current = null;
    }

    // If both fields are empty, do nothing
    if (!tokenAAmount && !tokenBAmount) {
      console.log('⏸️ Both fields empty, skipping calculation');
      return;
    }

    // If only one field has a value, calculate the other
    if (tokenAAmount && !tokenBAmount) {
      console.log('➡️ Calculating tokenB from tokenA:', tokenAAmount);
      updateProportionalAmount('pool.deposit.tokenA', tokenAAmount);
    } else if (tokenBAmount && !tokenAAmount) {
      console.log('⬅️ Calculating tokenA from tokenB:', tokenBAmount);
      updateProportionalAmount('pool.deposit.tokenB', tokenBAmount);
    } else if (tokenAAmount && tokenBAmount) {
      console.log('⚠️ Both fields have values, skipping auto-calculation');
    }
  }, [tokenInputs, updateProportionalAmount, poolReserves]);

  return <TokenInput inputIdentifier={inputIdentifier} formType="pool" />;
};

export default RatioAwareTokenInput;
