import DualTokenIcon from '@/components/app/Shared/DualTokenIcon';
import { InfoContainer } from '@/components/app/Shared/Forms/Input/InputWrappers';
import { LoadingPlaceholder } from '@/components/app/Shared/LoadingPlaceholder';
import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { SecretString } from '@/types';
import { amountExceedsBalance } from '@/utils/staking/convertStakingAmount';
import React, { useEffect, useState } from 'react';

interface StaticStakingInputProps {
  inputIdentifier: 'stakeAmount' | 'unstakeAmount';
  operation: 'stake' | 'unstake';
  balance: string;
  balanceLabel?: string;
  isLoading?: boolean;
  tokenSymbol?: string;
  stakingContractAddress?: string;
  lpTokenAddress: string;
  onAmountChange?: (amount: string) => void;
  initialAmount?: string;
}

export const StaticStakingInput: React.FC<StaticStakingInputProps> = ({
  inputIdentifier,
  operation,
  balance,
  balanceLabel = 'Balance',
  isLoading = false,
  tokenSymbol = 'LP',
  stakingContractAddress,
  lpTokenAddress,
  onAmountChange,
  initialAmount = '',
}) => {
  console.log('🎯 STAKING INPUT: Received initialAmount:', initialAmount);
  const [amount, setAmount] = useState(initialAmount);

  // Update amount when initialAmount changes (for when already on the page)
  useEffect(() => {
    if (initialAmount !== undefined && initialAmount !== '' && initialAmount !== amount) {
      console.log('🎯 STAKING INPUT: Updating amount due to initialAmount change:', initialAmount);
      setAmount(initialAmount);
      onAmountChange?.(initialAmount);
    }
  }, [initialAmount]); // Remove amount and onAmountChange from deps to avoid loops

  const operationLabel = operation === 'stake' ? 'Stake' : 'Unstake';

  // Properly handle balance states: '-' means unknown, actual numbers are known values
  const isBalanceKnown = balance !== '-';
  const balanceNumber = isBalanceKnown ? parseFloat(balance) : null;
  const isInvalid = isBalanceKnown && amountExceedsBalance(amount, balance);

  // Get LP token information for proper dual icon display
  const lpTokenInfo = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === lpTokenAddress);
  const token0 = lpTokenInfo ? TOKENS.find((t) => t.symbol === lpTokenInfo.token0) : undefined;
  const token1 = lpTokenInfo ? TOKENS.find((t) => t.symbol === lpTokenInfo.token1) : undefined;

  const handleInputChange = (value: string) => {
    // Allow only numbers and decimal point - reusing validation pattern from TokenInputBase
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      onAmountChange?.(value);
    }
  };

  const handleMaxClick = () => {
    if (isBalanceKnown) {
      setAmount(balance);
      onAmountChange?.(balance);
    }
  };

  return (
    <InfoContainer className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-adamant-text-box-main">{operationLabel}</h3>
        <div className="flex gap-3 items-center">
          <div className="text-sm text-adamant-text-box-secondary">{balanceLabel}</div>
          <div className="flex items-center gap-2">
            {isLoading || !isBalanceKnown ? (
              <LoadingPlaceholder size="medium" className="h-5 w-20" />
            ) : (
              <>
                <span className="text-sm font-medium text-adamant-text-box-main">
                  {balanceNumber?.toLocaleString('en-US', { maximumFractionDigits: 6 }) ?? '0'}
                </span>
                {isBalanceKnown && (
                  <button
                    className="font-medium text-base flex items-center justify-center bg-white opacity-80 hover:opacity-100 text-black rounded-md px-2"
                    onClick={handleMaxClick}
                  >
                    max
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            className={`w-full bg-transparent text-2xl font-light outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-500/50 ${
              isInvalid ? 'text-red-400' : ''
            }`}
            value={amount}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="0.0"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center">
              <LoadingPlaceholder size="large" className="h-8 w-32" />
            </div>
          )}
        </div>

        {/* Token display section - non-interactive for static version */}
        <div className="flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 bg-adamant-app-selectTrigger min-w-max">
          {token0 && token1 ? (
            <DualTokenIcon
              token0Address={token0.address}
              token1Address={token1.address}
              token0Symbol={token0.symbol}
              token1Symbol={token1.symbol}
              size={24}
            />
          ) : (
            <TokenImageWithFallback
              tokenAddress={stakingContractAddress as SecretString}
              size={24}
              alt={tokenSymbol}
            />
          )}
          {tokenSymbol}
        </div>
      </div>

      {/* Error message */}
      {isInvalid && <div className="text-red-500 text-xs">Amount exceeds available balance</div>}

      {/* Static reward estimates placeholder for stake operations */}
      {operation === 'stake' && amount && parseFloat(amount) > 0 && !isInvalid && (
        <div className="bg-adamant-accentText/5 backdrop-blur-sm rounded-lg p-3 border border-adamant-accentText/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-adamant-accentText">Estimated bADMT Rewards</h4>
          </div>
          <div className="text-center text-adamant-text-box-secondary text-xs">
            Reward estimates will be calculated based on current pool data
          </div>
        </div>
      )}
    </InfoContainer>
  );
};
