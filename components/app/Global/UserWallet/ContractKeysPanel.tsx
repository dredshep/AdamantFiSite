import { useViewingKeyStore } from '@/store/viewingKeyStore';
import { getAllStakingPools } from '@/utils/staking/stakingRegistry';
import { showToastOnce } from '@/utils/toast/toastManager';
import React, { useState } from 'react';
import { RiAddLine, RiDeleteBinLine, RiFileCopyLine } from 'react-icons/ri';

interface ContractKeysPanelProps {
  onClose: () => void;
}

export const ContractKeysPanel: React.FC<ContractKeysPanelProps> = ({ onClose }) => {
  const { viewingKeys, setViewingKey, removeViewingKey } = useViewingKeyStore();
  const stakingPools = getAllStakingPools();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContractAddress, setNewContractAddress] = useState('');
  const [newViewingKey, setNewViewingKey] = useState('');

  const handleCopyKey = (key: string) => {
    navigator.clipboard
      .writeText(key)
      .then(() => {
        showToastOnce('key-copied', 'Viewing key copied to clipboard!', 'success');
      })
      .catch((err) => {
        console.error('Failed to copy key:', err);
        showToastOnce('copy-error', 'Failed to copy key.', 'error');
      });
  };

  const handleDeleteKey = (address: string) => {
    removeViewingKey(address);
    showToastOnce('key-deleted', 'Viewing key deleted successfully!', 'success');
  };

  const handleAddKey = () => {
    if (!newContractAddress.trim() || !newViewingKey.trim()) {
      showToastOnce(
        'add-key-error',
        'Please enter both contract address and viewing key.',
        'error'
      );
      return;
    }

    if (!newContractAddress.startsWith('secret')) {
      showToastOnce('add-key-error', 'Contract address must start with "secret".', 'error');
      return;
    }

    setViewingKey(newContractAddress.trim(), newViewingKey.trim());
    showToastOnce('key-added', 'Viewing key added successfully!', 'success');

    // Reset form
    setNewContractAddress('');
    setNewViewingKey('');
    setShowAddForm(false);
  };

  const keys = Object.entries(viewingKeys);

  const getNameForContract = (address: string) => {
    const pool = stakingPools.find((p) => p.stakingInfo.stakingAddress === address);
    return pool ? `${pool.pairSymbol} Staking` : `Unknown Contract`;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2">
        {/* Add Key Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-adamant-gradientBright text-black font-bold rounded-xl hover:bg-adamant-gradientDim transition-colors"
          >
            <RiAddLine className="w-5 h-5" />
            Add Viewing Key
          </button>
        </div>

        {/* Add Key Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-adamant-box-dark rounded-lg border border-adamant-box-border">
            <h3 className="text-white font-bold mb-3">Add New Viewing Key</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-adamant-text-box-secondary mb-1">
                  Contract Address
                </label>
                <input
                  type="text"
                  value={newContractAddress}
                  onChange={(e) => setNewContractAddress(e.target.value)}
                  placeholder="secret1..."
                  className="w-full bg-adamant-box-regular text-white border border-adamant-box-border rounded p-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm text-adamant-text-box-secondary mb-1">
                  Viewing Key
                </label>
                <input
                  type="text"
                  value={newViewingKey}
                  onChange={(e) => setNewViewingKey(e.target.value)}
                  placeholder="Enter viewing key..."
                  className="w-full bg-adamant-box-regular text-white border border-adamant-box-border rounded p-2 text-sm font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddKey}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition-colors"
                >
                  Add Key
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Keys */}
        {keys.length === 0 ? (
          <div className="text-center text-adamant-text-box-secondary">
            You have no saved contract viewing keys.
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map(([address, key]) => {
              const name = getNameForContract(address);

              return (
                <div
                  key={address}
                  className="bg-adamant-box-dark p-4 rounded-lg border border-adamant-box-border"
                >
                  <div className="font-bold text-white mb-2">{name}</div>
                  <div className="font-mono text-xs text-adamant-text-box-secondary mb-3 break-all">
                    {address}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-adamant-text-box-main break-all flex-1 mr-4">
                      {key}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyKey(key)}
                        className="p-2 text-adamant-text-box-secondary hover:text-white transition-colors"
                        title="Copy key"
                      >
                        <RiFileCopyLine />
                      </button>
                      <button
                        onClick={() => handleDeleteKey(address)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete key"
                      >
                        <RiDeleteBinLine />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
