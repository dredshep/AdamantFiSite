import { ViewingKeyManager } from '@/components/staking/ViewingKeyManager';
import { useLpAndStakingVK } from '@/hooks/useLpAndStakingVK';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings } from 'lucide-react';
import React, { useState } from 'react';

interface ViewingKeyFixButtonProps {
  lpTokenAddress: string;
  stakingContractAddress: string;
  onSyncSuccess?: () => void;
}

export const ViewingKeyFixButton: React.FC<ViewingKeyFixButtonProps> = ({
  lpTokenAddress,
  stakingContractAddress,
  onSyncSuccess,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get viewing key states for the modal
  const viewingKeys = useLpAndStakingVK(lpTokenAddress, stakingContractAddress);

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap">
          <Settings className="h-4 w-4 flex-shrink-0" />
          Fix Keys
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-adamant-app-box border border-adamant-box-border rounded-xl w-[90vw] max-w-lg max-h-[85vh] overflow-y-auto z-50 shadow-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold text-white">
                Fix Viewing Keys
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </Dialog.Close>
            </div>

            <div className="text-sm text-gray-300 mb-6 leading-relaxed">
              Set up viewing keys to access your staking features. This allows you to see your LP
              token balance and staking rewards.
            </div>

            <ViewingKeyManager
              lpKeyState={{
                isValid: viewingKeys.lpToken.isValid,
                hasKey: viewingKeys.lpToken.hasKey,
                balance: viewingKeys.lpToken.balance,
                error: viewingKeys.lpToken.error,
                isLoading: viewingKeys.lpToken.isLoading,
              }}
              stakingKeyState={{
                isValid: viewingKeys.stakingContract.isValid,
                hasKey: viewingKeys.stakingContract.hasKey,
                balance: viewingKeys.stakingContract.balance,
                error: viewingKeys.stakingContract.error,
                isLoading: viewingKeys.stakingContract.isLoading,
              }}
              lpTokenAddress={lpTokenAddress}
              stakingContractAddress={stakingContractAddress}
              onSyncSuccess={() => {
                viewingKeys.refresh(); // Refresh the viewing keys
                onSyncSuccess?.();
                setIsModalOpen(false); // Close modal on success
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
