import DualTokenIcon from '@/components/app/Shared/DualTokenIcon';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LIQUIDITY_PAIRS } from '@/config/tokens';
import { usePoolsAndTokens } from '@/hooks/usePoolsAndTokens';
import { usePoolStore } from '@/store/forms/poolStore';
import * as Dialog from '@radix-ui/react-dialog';
import React, { useState } from 'react';
import TokenSelectionSearchBar from '../TokenSelectionModal/TokenSelectionSearchBar';

const PoolSelectionModal: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { pools, loading, error } = usePoolsAndTokens();
  const { setSelectedPool } = usePoolStore();

  const filteredPools = pools.filter((pool) => {
    const token0Symbol = pool.token0.symbol;
    const token1Symbol = pool.token1.symbol;
    const searchLower = searchTerm.toLowerCase();

    return (
      token0Symbol.toLowerCase().includes(searchLower) ||
      token1Symbol.toLowerCase().includes(searchLower)
    );
  });

  const handlePoolSelect = (pool: (typeof pools)[0]) => {
    const selectedPair = LIQUIDITY_PAIRS.find((p) => p.pairContract === pool.pair.contract_addr);
    if (selectedPair) {
      setSelectedPool(selectedPair);
    }
    // Dialog will close automatically when Dialog.Close is clicked
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#202033] bg-opacity-95 rounded-lg w-1/3 py-6 max-w-md min-h-[300px] text-white">
        <div className="flex justify-between items-center px-6">
          <Dialog.Title className="text-lg leading-[21px]">Select a pool</Dialog.Title>
          <Dialog.Close asChild>
            <button className="text-gray-400 hover:text-white">Close</button>
          </Dialog.Close>
        </div>

        <TokenSelectionSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <div className="text-gray-500 font-medium text-sm mt-4 px-6">AVAILABLE POOLS</div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <LoadingSpinner size={40} />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-4">Error loading pools: {error.message}</div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto max-h-96 mt-4 px-6">
            {filteredPools.map((pool, index) => (
              <Dialog.Close key={index} asChild>
                <button
                  className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors"
                  onClick={() => handlePoolSelect(pool)}
                >
                  <div className="flex items-center gap-3">
                    <DualTokenIcon
                      token0Address={pool.token0.address}
                      token1Address={pool.token1.address}
                      token0Symbol={pool.token0.symbol}
                      token1Symbol={pool.token1.symbol}
                      size={40}
                    />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {pool.token0.symbol} / {pool.token1.symbol}
                      </span>
                      <span className="text-sm text-gray-400">
                        {pool.pair.contract_addr.slice(0, 8)}...
                        {pool.pair.contract_addr.slice(-8)}
                      </span>
                    </div>
                  </div>
                </button>
              </Dialog.Close>
            ))}
          </div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
};

export default PoolSelectionModal;
