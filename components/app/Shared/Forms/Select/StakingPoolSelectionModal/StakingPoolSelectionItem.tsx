import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { SecretString } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import React from 'react';

interface StakingPoolOption {
  pairSymbol: string;
  pairContract: SecretString;
  stakingContract: SecretString;
  rewardTokenSymbol: string;
  lpTokenAddress: SecretString;
}

interface StakingPoolSelectionItemProps {
  pool: StakingPoolOption;
  handlePoolSelect: (pool: StakingPoolOption) => void;
}

const StakingPoolSelectionItem: React.FC<StakingPoolSelectionItemProps> = ({
  pool,
  handlePoolSelect,
}) => {
  return (
    <Dialog.Close onClick={() => handlePoolSelect(pool)} asChild>
      <div className="flex items-center justify-between cursor-pointer hover:bg-adamant-app-input/40 py-3 px-4 rounded-lg mx-2 transition-all duration-200 group border border-transparent hover:border-adamant-accentText/20">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <TokenImageWithFallback
              tokenAddress={pool.stakingContract}
              size={48}
              alt={`${pool.pairSymbol} staking pool`}
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-adamant-accentText rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex-1">
            <div className="font-bold text-adamant-text-box-main text-base group-hover:text-white transition-colors">
              {pool.pairSymbol}
            </div>
            <div className="text-adamant-text-box-secondary text-sm">
              Earn{' '}
              <span className="text-adamant-accentText font-medium">{pool.rewardTokenSymbol}</span>{' '}
              rewards
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-semibold text-adamant-accentText">
              {pool.rewardTokenSymbol}
            </div>
            <div className="text-xs text-adamant-text-box-secondary">Rewards</div>
          </div>
          <div className="w-5 h-5 text-gray-400 group-hover:text-adamant-accentText transition-colors">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Dialog.Close>
  );
};

export default StakingPoolSelectionItem;
