import { useStakingStore } from '@/store/staking/stakingStore';
import React from 'react';

interface AutoStakeOptionProps {
  disabled?: boolean;
}

const AutoStakeOption: React.FC<AutoStakeOptionProps> = ({ disabled = false }) => {
  const { autoStake, setAutoStake } = useStakingStore();

  const handleToggleAutoStake = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoStake(e.target.checked);
  };

  return (
    <div className="flex items-center px-3 py-2 bg-adamant-box-darker rounded-lg">
      <input
        type="checkbox"
        id="autoStake"
        checked={autoStake}
        onChange={handleToggleAutoStake}
        disabled={disabled}
        className="form-checkbox h-4 w-4 text-adamant-gradientBright rounded border-gray-600 bg-gray-800 focus:ring-adamant-gradientBright focus:ring-opacity-25"
      />
      <label
        htmlFor="autoStake"
        className={`ml-2 text-sm ${disabled ? 'text-gray-500' : 'text-white'}`}
      >
        Auto-stake LP tokens to earn rewards
      </label>
    </div>
  );
};

export default AutoStakeOption;
