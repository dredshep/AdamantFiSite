import { LIQUIDITY_PAIRS, STAKING_CONTRACTS } from '@/config/tokens';
import { usePoolStore } from '@/store/forms/poolStore';
import { SecretString } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross1Icon } from '@radix-ui/react-icons';
import React, { useState } from 'react';
import StakingPoolSelectionItem from './StakingPoolSelectionItem';
import StakingPoolSelectionSearchBar from './StakingPoolSelectionSearchBar';

interface StakingPoolSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StakingPoolOption {
  pairSymbol: string;
  pairContract: SecretString;
  stakingContract: SecretString;
  rewardTokenSymbol: string;
  lpTokenAddress: SecretString;
}

const StakingPoolSelectionModal: React.FC<StakingPoolSelectionModalProps> = ({ onClose }) => {
  const { setSelectedPool } = usePoolStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Get available staking pools by combining STAKING_CONTRACTS with LIQUIDITY_PAIRS
  const availableStakingPools: StakingPoolOption[] = STAKING_CONTRACTS.map((stakingContract) => {
    const liquidityPair = LIQUIDITY_PAIRS.find(
      (pair) => pair.symbol === stakingContract.pairSymbol
    );

    if (!liquidityPair) {
      console.warn(`No liquidity pair found for staking contract: ${stakingContract.pairSymbol}`);
      return null;
    }

    return {
      pairSymbol: stakingContract.pairSymbol,
      pairContract: liquidityPair.pairContract,
      stakingContract: stakingContract.stakingContract,
      rewardTokenSymbol: stakingContract.rewardTokenSymbol,
      lpTokenAddress: liquidityPair.lpToken,
    };
  }).filter(Boolean) as StakingPoolOption[];

  const handlePoolSelect = (selectedPool: StakingPoolOption) => {
    // Find the full liquidity pair info
    const liquidityPair = LIQUIDITY_PAIRS.find(
      (pair) => pair.pairContract === selectedPool.pairContract
    );

    if (!liquidityPair) {
      console.error('Could not find liquidity pair for selected pool');
      return;
    }

    // Set the selected pool in the store
    setSelectedPool(liquidityPair);

    onClose();
  };

  // Filter pools based on search term
  const filteredPools = availableStakingPools.filter(
    (pool) =>
      pool.pairSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.rewardTokenSymbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-adamant-app-box rounded-xl w-full max-w-md min-w-[400px] py-6 outline-none z-50 text-base font-medium normal-case shadow-2xl border border-adamant-box-border animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 pb-4 border-b border-adamant-box-border">
          <div>
            <Dialog.Title className="text-xl font-bold text-adamant-text-box-main">
              Select Staking Pool
            </Dialog.Title>
            <p className="text-sm text-adamant-text-box-secondary mt-1">
              Choose a pool to stake your LP tokens
            </p>
          </div>
          <Dialog.Close asChild>
            <button className="outline-none p-2 hover:bg-adamant-app-input rounded-lg transition-colors">
              <Cross1Icon className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </Dialog.Close>
        </div>

        <div className="px-6 py-4">
          <StakingPoolSelectionSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>

        <div className="px-6">
          <div className="text-adamant-text-box-secondary font-medium text-xs uppercase tracking-wide mb-3">
            Available Staking Pools ({filteredPools.length})
          </div>
        </div>

        <div
          className="flex flex-col gap-1 overflow-y-auto max-h-80 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredPools.length > 0 ? (
            filteredPools.map((pool, index) => (
              <StakingPoolSelectionItem
                pool={pool}
                key={index}
                handlePoolSelect={handlePoolSelect}
              />
            ))
          ) : (
            <div className="text-center py-8 px-6">
              <div className="text-adamant-text-box-secondary">
                {searchTerm ? 'No pools match your search.' : 'No staking pools available.'}
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-adamant-accentText hover:text-adamant-accentText/80 text-sm mt-2 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </Dialog.Content>
    </>
  );
};

export default StakingPoolSelectionModal;
