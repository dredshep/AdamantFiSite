import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { useLpTokenBalance } from '@/hooks/useLpTokenBalance';
import { usePoolForm } from '@/hooks/usePoolForm/usePoolForm';
import { usePoolStore } from '@/store/forms/poolStore';
import { PoolTokenInputs } from '@/types';
import React from 'react';

interface PoolMaxButtonProps {
  poolInputIdentifier: keyof PoolTokenInputs;
}

const PoolMaxButton: React.FC<PoolMaxButtonProps> = ({ poolInputIdentifier: inputIdentifier }) => {
  const { selectedPool, setTokenInputAmount } = usePoolStore();
  const { setMax } = usePoolForm(selectedPool?.pairContract);

  // For LP token inputs, we need to get the LP token address
  const getLpTokenAddress = () => {
    if (inputIdentifier === 'pool.withdraw.lpToken' && selectedPool?.lpToken) {
      return selectedPool.lpToken;
    }
    return undefined;
  };

  const lpTokenAddress = getLpTokenAddress();
  const isLpToken =
    lpTokenAddress && LIQUIDITY_PAIRS.some((pair) => pair.lpToken === lpTokenAddress);

  // Use LP token balance hook for LP tokens
  const lpTokenData = useLpTokenBalance(isLpToken ? lpTokenAddress : undefined);

  const handleMax = () => {
    if (isLpToken && lpTokenData.amount !== null) {
      // Validate the amount before setting it
      const amount = lpTokenData.amount;
      if (amount && parseFloat(amount) > 0) {
        setTokenInputAmount(inputIdentifier, amount);
      } else {
        console.error('❌ Invalid LP token amount:', amount);
      }
    } else {
      // For regular tokens, use the existing setMax function
      setMax(inputIdentifier);
    }
  };

  return (
    <button
      className="font-medium text-base flex items-center justify-center bg-white opacity-80 hover:opacity-100 text-black rounded-md px-2"
      onClick={handleMax}
    >
      max
    </button>
  );
};

export default PoolMaxButton;
