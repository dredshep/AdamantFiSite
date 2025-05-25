import { useStakingStore } from '@/store/staking/stakingStore';
import { AlertTriangle, Check } from 'lucide-react';
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
    <div className="space-y-3">
      {/* Main checkbox option */}
      <div className="flex items-center px-4 py-3 bg-adamant-app-box rounded-xl border border-adamant-box-border hover:border-adamant-accentText/30 transition-all duration-200">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="autoStake"
            checked={autoStake}
            onChange={handleToggleAutoStake}
            disabled={disabled}
            className="sr-only"
          />
          <label
            htmlFor="autoStake"
            className={`relative flex items-center justify-center w-5 h-5 rounded border-2 transition-all duration-200 cursor-pointer ${
              disabled
                ? 'border-adamant-app-buttonDisabled bg-adamant-app-buttonDisabled/20'
                : autoStake
                ? 'border-adamant-accentText bg-adamant-accentText'
                : 'border-adamant-text-form-secondary bg-adamant-app-input hover:border-adamant-accentText/50'
            }`}
          >
            {autoStake && !disabled && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </label>
        </div>
        <div className="ml-3 flex-1">
          <label
            htmlFor="autoStake"
            className={`text-sm font-medium cursor-pointer ${
              disabled ? 'text-adamant-app-buttonDisabled' : 'text-adamant-text-form-main'
            }`}
          >
            Auto-stake LP tokens to earn rewards
          </label>
        </div>
      </div>

      {/* Transaction flow warning */}
      {autoStake && !disabled && (
        <div className="flex items-start gap-3 px-4 py-3 bg-adamant-accentText/10 border border-adamant-accentText/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-adamant-accentText mt-0.5 flex-shrink-0" />
          <div className="text-xs text-adamant-text-form-secondary leading-relaxed">
            <span className="font-medium text-adamant-accentText">Two transactions required:</span>
            <br />
            1. Provide liquidity (approve and wait for confirmation)
            <br />
            2. Auto-stake LP tokens (approve second transaction)
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoStakeOption;
