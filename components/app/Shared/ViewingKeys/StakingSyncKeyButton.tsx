import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { getStakingContractInfo } from '@/utils/staking/stakingRegistry';
import { showToastOnce } from '@/utils/toast/toastManager';
import { Key } from 'lucide-react';
import React, { useState } from 'react';
import { TxResultCode } from 'secretjs';

interface StakingSyncKeyButtonProps {
  /** Only show the button when this is true */
  isVisible: boolean;
  /** Staking contract address to sync the viewing key to */
  stakingContractAddress: string;
  /** LP token address to copy the viewing key from */
  lpTokenAddress: string;
  /** Optional callback when sync completes successfully */
  onSyncSuccess?: () => void;
  /** Optional callback when sync fails */
  onSyncError?: (error: Error) => void;
}

/**
 * Button that syncs viewing key from LP token to staking contract
 * Only visible when LP key is valid and staking key is invalid
 */
const StakingSyncKeyButton: React.FC<StakingSyncKeyButtonProps> = ({
  isVisible,
  stakingContractAddress,
  lpTokenAddress,
  onSyncSuccess,
  onSyncError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { secretjs } = useKeplrConnection();

  if (!isVisible) {
    return null;
  }

  const handleSyncViewingKey = async () => {
    if (!window.keplr || !secretjs) {
      const error = new Error('Keplr wallet not connected');
      onSyncError?.(error);
      return;
    }

    setIsLoading(true);

    try {
      // Get LP token viewing key from Keplr
      const lpKey = await window.keplr.getSecret20ViewingKey('secret-4', lpTokenAddress);

      if (!lpKey) {
        throw new Error('Failed to retrieve LP token viewing key from Keplr');
      }

      // Get staking contract info
      const stakingInfo = getStakingContractInfo(lpTokenAddress);
      if (!stakingInfo) {
        throw new Error('Staking contract information not found');
      }

      // Set the same key on staking contract
      const setViewingKeyMsg = {
        set_viewing_key: {
          key: lpKey,
        },
      };

      const result = await secretjs.tx.compute.executeContract(
        {
          sender: secretjs.address,
          contract_address: stakingContractAddress,
          code_hash: stakingInfo.stakingCodeHash,
          msg: setViewingKeyMsg,
          sent_funds: [],
        },
        { gasLimit: 150_000 }
      );

      if (result.code === TxResultCode.Success) {
        showToastOnce('sync-success', 'Viewing key synced!', 'success', {
          message:
            'Your LP token viewing key has been successfully synced to the staking contract.',
          autoClose: 5000,
        });
        onSyncSuccess?.();
      } else {
        throw new Error(`Transaction failed with code: ${result.code}`);
      }
    } catch (error) {
      console.error('Viewing key sync failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      showToastOnce('sync-failed', 'Sync failed', 'error', {
        message: `Failed to sync viewing key: ${errorMessage}`,
        autoClose: 6000,
      });

      onSyncError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSyncViewingKey}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg
                 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30
                 text-blue-400 transition-all duration-200 disabled:opacity-50
                 hover:scale-105 active:scale-95 disabled:hover:scale-100"
      title="Copy your LP token viewing key to the staking contract so you can view your staked balance and rewards"
    >
      {isLoading ? (
        <>
          <Key className="h-3 w-3 animate-pulse" />
          Syncing...
        </>
      ) : (
        <>
          <Key className="h-3 w-3" />
          Sync Key
        </>
      )}
    </button>
  );
};

export default StakingSyncKeyButton;
