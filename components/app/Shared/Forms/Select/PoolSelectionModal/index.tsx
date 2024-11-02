import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { usePoolsAndTokens } from '@/hooks/usePoolsAndTokens';
import { usePoolStore } from '@/store/forms/poolStore';
import { ApiToken, getApiTokenSymbol } from '@/utils/apis/getSwappableTokens';
import * as Dialog from '@radix-ui/react-dialog';
import React, { useState } from 'react';
import TokenSelectionSearchBar from '../TokenSelectionModal/TokenSelectionSearchBar';

const PoolSelectionModal: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { pools, loading, error } = usePoolsAndTokens();
  const { setSelectedPool } = usePoolStore();

  const getDisplaySymbol = (token?: ApiToken, address?: string) => {
    if (token) return getApiTokenSymbol(token);
    if (address !== undefined) return `${address.slice(-6)}`;
    return 'Unknown';
  };

  const filteredPools = pools.filter((pool) => {
    const token0Symbol = getDisplaySymbol(
      pool.token0,
      pool.pair.asset_infos[0]!.token?.contract_addr
    );
    const token1Symbol = getDisplaySymbol(
      pool.token1,
      pool.pair.asset_infos[1]!.token?.contract_addr
    );
    const searchLower = searchTerm.toLowerCase();

    return (
      token0Symbol.toLowerCase().includes(searchLower) ||
      token1Symbol.toLowerCase().includes(searchLower)
    );
  });

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
              <button
                key={index}
                className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors"
                onClick={() => {
                  setSelectedPool({
                    address: pool.pair.contract_addr,
                    token0: pool.token0!,
                    token1: pool.token1!,
                    pairInfo: pool.pair,
                  });
                  const close = document.querySelector(
                    '[data-radix-collection-item]'
                  ) as HTMLElement;
                  close?.click();
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {getDisplaySymbol(
                        pool.token0,
                        pool.pair.asset_infos[0]!.token?.contract_addr
                      )}{' '}
                      /{' '}
                      {getDisplaySymbol(
                        pool.token1,
                        pool.pair.asset_infos[1]!.token?.contract_addr
                      )}
                    </span>
                    <span className="text-sm text-gray-400">
                      {pool.pair.contract_addr.slice(0, 8)}...
                      {pool.pair.contract_addr.slice(-8)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
};

export default PoolSelectionModal;
