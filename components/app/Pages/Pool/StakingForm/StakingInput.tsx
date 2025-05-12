import { useStakingStore } from '@/store/staking/stakingStore';
import { amountExceedsBalance } from '@/utils/staking/convertStakingAmount';
import React from 'react';

interface StakingInputProps {
  inputIdentifier: 'stakeAmount' | 'unstakeAmount';
  operation: 'stake' | 'unstake';
  balance: string;
  balanceLabel?: string;
  isLoading?: boolean;
}

const StakingInput: React.FC<StakingInputProps> = ({
  inputIdentifier,
  operation,
  balance,
  balanceLabel = 'Balance',
  isLoading = false,
}) => {
  const { stakingInputs, setStakingInputAmount } = useStakingStore();

  const operationLabel = operation === 'stake' ? 'Stake' : 'Unstake';
  const amount = stakingInputs[inputIdentifier].amount;
  const isInvalid = amountExceedsBalance(amount, balance);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setStakingInputAmount(inputIdentifier, value);
    }
  };

  const handleMaxClick = () => {
    setStakingInputAmount(inputIdentifier, balance);
  };

  return (
    <div className="bg-adamant-box-dark hover:bg-adamant-box-light transition-all duration-200 rounded-xl p-4 border border-adamant-gradientBright/20">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={`staking-${inputIdentifier}`} className="text-adamant-accentText text-sm">
          {operationLabel} Amount
        </label>
        <div className="text-xs text-gray-400">
          {balanceLabel}: <span className="text-white">{balance}</span>
          <button
            onClick={handleMaxClick}
            className="ml-2 bg-adamant-gradientBright/20 hover:bg-adamant-gradientBright/30 text-adamant-gradientBright text-xs font-medium px-2 py-0.5 rounded transition-colors"
            disabled={isLoading || balance === '0'}
          >
            MAX
          </button>
        </div>
      </div>

      <div className="relative mt-2">
        <input
          id={`staking-${inputIdentifier}`}
          type="text"
          className={`w-full bg-adamant-box-darker text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${
            isInvalid
              ? 'focus:ring-red-500 border border-red-500'
              : 'focus:ring-adamant-gradientBright/50 border border-transparent'
          }`}
          placeholder="0.0"
          value={amount}
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {isInvalid && (
          <div className="text-red-500 text-xs mt-1">Amount exceeds available balance</div>
        )}
      </div>
    </div>
  );
};

export default StakingInput;
