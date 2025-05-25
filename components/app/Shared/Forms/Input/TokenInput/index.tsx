import TokenInputBase from '@/components/app/Shared/Forms/Input/TokenInputBase';
import { usePoolForm } from '@/hooks/usePoolForm/usePoolForm';
import { usePoolStore } from '@/store/forms/poolStore';
import { useSwapStore } from '@/store/swapStore';
import { useTokenStore } from '@/store/tokenStore';
import { PoolTokenInputs, SwapTokenInputs } from '@/types';
import React from 'react';

type FormType = 'swap' | 'pool';
interface TokenInputProps {
  inputIdentifier: keyof SwapTokenInputs | keyof PoolTokenInputs;
  formType: FormType;
  value?: string;
  isLoading?: boolean;
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

const TokenInput: React.FC<TokenInputProps> = ({
  inputIdentifier,
  formType,
  value,
  isLoading = false,
}) => {
  const { swapTokenInputs, setTokenInputProperty } = useSwapStore();

  // Only use pool-related hooks when formType is 'pool'
  const { selectedPool } = formType === 'pool' ? usePoolStore() : { selectedPool: undefined };
  const poolForm = formType === 'pool' ? usePoolForm(selectedPool?.address) : null;
  const poolTokenInputs = poolForm?.tokenInputs;
  const setTokenInputAmount = poolForm?.setTokenInputAmount;

  // Get typed token data
  const getTokenData = (): TokenData => {
    // console.log('Getting token data for:', inputIdentifier);

    if (formType === 'swap' && isSwapInput(inputIdentifier)) {
      const data = swapTokenInputs[inputIdentifier];
      // console.log('Swap input data:', data);

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

  // console.log('Token lookup:', {
  //   tokenAddress: tokenData.tokenAddress,
  //   foundToken: tokens?.[tokenData.tokenAddress],
  // });

  const token = tokens?.[tokenData.tokenAddress];

  const handleInputChange = (value: string) => {
    if (formType === 'swap' && isSwapInput(inputIdentifier)) {
      setTokenInputProperty(inputIdentifier, 'amount', value);
    } else if (setTokenInputAmount) {
      setTokenInputAmount(inputIdentifier as keyof PoolTokenInputs, value);
    }
  };

  if (token === undefined || token === null) {
    // console.log('Token not found, returning null');
    return null;
  }

  const isSwap = formType === 'swap';
  const isPool = formType === 'pool';
  const isSell = inputIdentifier.startsWith('swap.pay');
  function getLabel() {
    if (isSwap) {
      return isSell ? 'Sell' : 'Buy';
    }
    return isPool ? 'Pool' : 'Token';
  }

  // console.log('Rendering TokenInputBase with:', {
  //   inputValue: value ?? tokenData.amount,
  //   tokenSymbol: getApiTokenSymbol(token),
  //   tokenAddress: getApiTokenAddress(token),
  // });

  return (
    <TokenInputBase
      inputIdentifier={inputIdentifier}
      inputValue={value ?? tokenData.amount}
      onInputChange={handleInputChange}
      tokenSymbol={token.symbol}
      tokenAddress={token.address}
      showEstimatedPrice={false}
      estimatedPrice={''}
      label={getLabel()}
      hasMax={true}
      isLoading={isLoading}
    />
  );
};

export default TokenInput;
