import TokenInputBase from '@/components/app/Shared/Forms/Input/TokenInputBase';
import { usePoolForm } from '@/hooks/usePoolForm';
import { usePoolStore } from '@/store/forms/poolStore';
import { useSwapStore } from '@/store/swapStore';
import { useTokenStore } from '@/store/tokenStore';
import { PoolTokenInputs, SwapTokenInputs } from '@/types';
import { getApiTokenAddress, getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import React from 'react';

type FormType = 'swap' | 'pool';
interface TokenInputProps {
  inputIdentifier: keyof SwapTokenInputs | keyof PoolTokenInputs;
  formType: FormType;
}

type TokenData = {
  tokenAddress: string;
  amount: string;
  balance: string;
};

// Type guard functions
const isSwapInput = (
  id: keyof SwapTokenInputs | keyof PoolTokenInputs
): id is keyof SwapTokenInputs => {
  return id.startsWith('swap.');
};

const isPoolInput = (
  id: keyof SwapTokenInputs | keyof PoolTokenInputs
): id is keyof PoolTokenInputs => {
  return id.startsWith('pool.');
};

const TokenInput: React.FC<TokenInputProps> = ({ inputIdentifier, formType }) => {
  const { swapTokenInputs, setTokenInputProperty } = useSwapStore();
  
  // Only use pool-related hooks when formType is 'pool'
  const { selectedPool } = formType === 'pool' ? usePoolStore() : { selectedPool: undefined };
  const poolForm = formType === 'pool' ? usePoolForm(selectedPool?.address) : null;
  const poolTokenInputs = poolForm?.tokenInputs;
  const setTokenInputAmount = poolForm?.setTokenInputAmount;

  // Get typed token data
  const getTokenData = (): TokenData => {
    if (formType === 'swap' && isSwapInput(inputIdentifier)) {
      const data = swapTokenInputs[inputIdentifier];
      if (data === undefined) throw new Error('Invalid swap input data');
      return {
        tokenAddress: data.tokenAddress,
        amount: data.amount,
        balance: String(data.balance || '0'),
      };
    } else if (formType === 'pool' && isPoolInput(inputIdentifier)) {
      if (!poolTokenInputs) throw new Error('Pool inputs not available');
      const data = poolTokenInputs[inputIdentifier];
      if (data === undefined) throw new Error('Invalid pool input data');
      
      // For pool inputs, use the token address from the selected pool
      const isTokenA = inputIdentifier.endsWith('tokenA');
      return {
        tokenAddress: isTokenA
          ? selectedPool?.token0?.address ?? ''
          : selectedPool?.token1?.address ?? '',
        amount: data.amount,
        balance: String(data.balance || '0'),
      };
    }
    throw new Error('Invalid input identifier');
  };

  const tokenData = getTokenData();
  const { tokens } = useTokenStore();
  const token = tokens?.[tokenData.tokenAddress];

  const handleInputChange = (value: string) => {
    if (formType === 'swap' && isSwapInput(inputIdentifier)) {
      setTokenInputProperty(inputIdentifier, 'amount', value);
    } else if (setTokenInputAmount) {
      setTokenInputAmount(inputIdentifier as keyof PoolTokenInputs, value);
    }
  };

  if (token === undefined || token === null) {
    return null;
  }
  const price = token.price;

  const estimatedPrice = `$${(
    parseFloat(tokenData.amount || '0') * parseFloat(price ?? '0')
  ).toFixed(2)}`;

  const isSwap = formType === 'swap';
  const isPool = formType === 'pool';
  const isSell = inputIdentifier.startsWith('swap.pay');
  function getLabel() {
    if (isSwap) {
      return isSell ? 'Sell' : 'Buy';
    }
    return isPool ? 'Pool' : 'Token';
  }

  return (
    <TokenInputBase
      inputIdentifier={inputIdentifier}
      inputValue={tokenData.amount}
      onInputChange={handleInputChange}
      tokenSymbol={getApiTokenSymbol(token)}
      tokenAddress={getApiTokenAddress(token)}
      showEstimatedPrice={true}
      estimatedPrice={estimatedPrice}
      label={getLabel()}
      hasMax={true}
    />
  );
};

export default TokenInput;
