import { LoadingPlaceholder } from '@/components/app/Shared/LoadingPlaceholder';
import { TOKENS } from '@/config/tokens';
import { useKeplrConnection } from '@/hooks/useKeplrConnection';
import { getStakingContractInfoByAddress } from '@/utils/staking/stakingRegistry';
import { showToastOnce } from '@/utils/toast/toastManager';
import { forceCreateViewingKey } from '@/utils/viewingKeys/forceCreateViewingKey';
import { AlertCircle, CheckCircle, Copy, Key, XCircle } from 'lucide-react';
import React, { useState } from 'react';

interface ViewingKeyState {
  isValid: boolean;
  hasKey: boolean;
  balance: string | null;
  error: string | null;
  isLoading: boolean;
}

interface ViewingKeyManagerProps {
  lpKeyState: ViewingKeyState;
  stakingKeyState: ViewingKeyState;
  lpTokenAddress: string;
  stakingContractAddress: string;
  onSyncSuccess?: () => void;
}

interface ViewingKeyAction {
  action: 'create_lp' | 'fix_lp' | 'sync_to_staking' | 'none';
  message: string;
  canSync: boolean;
}

export const ViewingKeyManager: React.FC<ViewingKeyManagerProps> = ({
  lpKeyState,
  stakingKeyState,
  lpTokenAddress,
  stakingContractAddress,
  onSyncSuccess,
}) => {
  const { secretjs } = useKeplrConnection();
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get token info for display
  const lpTokenInfo = TOKENS.find((t) => t.address === lpTokenAddress);
  const stakingInfo = getStakingContractInfoByAddress(stakingContractAddress);

  // Determine what actions are needed based on viewing key states
  const getViewingKeyActions = (
    lpState: ViewingKeyState,
    stakingState: ViewingKeyState
  ): ViewingKeyAction => {
    // LP key doesn't exist at all
    if (!lpState.hasKey) {
      return {
        action: 'create_lp',
        message: 'Create LP viewing key first to access staking functionality',
        canSync: false,
      };
    }

    // LP key exists but is invalid
    if (!lpState.isValid) {
      return {
        action: 'fix_lp',
        message: 'LP viewing key is invalid and needs to be recreated',
        canSync: false,
      };
    }

    // LP key is valid, but staking key is missing or invalid
    if (!stakingState.hasKey || !stakingState.isValid) {
      return {
        action: 'sync_to_staking',
        message: 'Copy LP viewing key to staking contract',
        canSync: true,
      };
    }

    // Both keys are valid
    return {
      action: 'none',
      message: 'All viewing keys are valid and working',
      canSync: false,
    };
  };

  const actions = getViewingKeyActions(lpKeyState, stakingKeyState);

  // Force create LP viewing key
  const handleCreateLpKey = async () => {
    if (!secretjs || !stakingInfo) return;

    setIsCreatingKey(true);

    try {
      const result = await forceCreateViewingKey({
        secretjs,
        contractAddress: lpTokenAddress,
        codeHash: stakingInfo.lpTokenCodeHash,
        onProgress: (message) => {
          console.log('LP Key Creation:', message);
        },
      });

      if (result.success) {
        showToastOnce('lp-key-created', 'LP Viewing Key Created', 'success', {
          message: `Successfully created viewing key for ${lpTokenInfo?.symbol || 'LP Token'}`,
          autoClose: 3000,
        });
        onSyncSuccess?.();
      } else {
        showToastOnce('lp-key-create-failed', 'Failed to Create LP Key', 'error', {
          message: result.error || 'Unknown error occurred',
          autoClose: 5000,
        });
      }
    } catch (error) {
      showToastOnce('lp-key-create-error', 'Error Creating LP Key', 'error', {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        autoClose: 5000,
      });
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Sync LP key to staking contract
  const handleSyncToStaking = async () => {
    if (!secretjs || !stakingInfo || !window.keplr) return;

    setIsSyncing(true);

    try {
      // Get the LP viewing key from Keplr
      const lpKey = await window.keplr.getSecret20ViewingKey('secret-4', lpTokenAddress);

      if (!lpKey) {
        throw new Error('No LP viewing key found in Keplr');
      }

      // Use forceCreateViewingKey to set the same key on staking contract
      const result = await forceCreateViewingKey({
        secretjs,
        contractAddress: stakingContractAddress,
        codeHash: stakingInfo.stakingCodeHash,
        customKey: lpKey, // Use the same key from LP token
        onProgress: (message) => {
          console.log('Staking Key Sync:', message);
        },
      });

      if (result.success) {
        showToastOnce('staking-key-synced', 'Viewing Key Synced', 'success', {
          message: 'Successfully copied LP viewing key to staking contract',
          autoClose: 3000,
        });
        onSyncSuccess?.();
      } else {
        showToastOnce('staking-key-sync-failed', 'Failed to Sync Key', 'error', {
          message: result.error || 'Unknown error occurred',
          autoClose: 5000,
        });
      }
    } catch (error) {
      showToastOnce('staking-key-sync-error', 'Error Syncing Key', 'error', {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        autoClose: 5000,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy token address to clipboard
  const copyAddress = (address: string, label: string) => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        showToastOnce(`address-copied-${label}`, 'Address Copied', 'success', {
          message: `${label} address copied to clipboard`,
          autoClose: 2000,
        });
      })
      .catch(() => {
        showToastOnce('copy-failed', 'Copy Failed', 'error', {
          message: 'Failed to copy address to clipboard',
          autoClose: 3000,
        });
      });
  };

  const renderKeyStatus = (state: ViewingKeyState, label: string, address: string) => {
    let icon;
    let statusColor;
    let statusText;

    if (state.isLoading) {
      icon = <LoadingPlaceholder size="small" />;
      statusColor = 'text-adamant-text-box-secondary';
      statusText = 'Checking...';
    } else if (!state.hasKey) {
      icon = <XCircle className="h-4 w-4" />;
      statusColor = 'text-red-400';
      statusText = 'No key found';
    } else if (!state.isValid) {
      icon = <AlertCircle className="h-4 w-4" />;
      statusColor = 'text-yellow-400';
      statusText = 'Invalid key';
    } else {
      icon = <CheckCircle className="h-4 w-4" />;
      statusColor = 'text-green-400';
      statusText = 'Valid';
    }

    return (
      <div className="flex items-center justify-between p-3 bg-adamant-box-dark/20 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={statusColor}>{icon}</div>
          <div>
            <p className="text-sm font-medium text-adamant-text-box-main">{label}</p>
            <p className="text-xs text-adamant-text-box-secondary">
              {address.slice(0, 12)}...{address.slice(-8)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs ${statusColor}`}>{statusText}</span>
          <button
            onClick={() => copyAddress(address, label)}
            className="p-1 text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
            title="Copy address"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-adamant-box-dark/30 backdrop-blur-sm rounded-xl p-6 border border-adamant-box-border">
      <div className="flex items-center gap-2 mb-4">
        <Key className="h-5 w-5 text-adamant-gradientBright" />
        <h3 className="text-lg font-semibold text-adamant-text-box-main">Fix Viewing Keys</h3>
      </div>

      {/* Explanation */}
      <div className="bg-adamant-box-regular border border-adamant-box-border p-4 rounded-lg mb-4">
        <p className="text-sm text-adamant-text-box-secondary">
          <strong className="text-adamant-text-box-main">Viewing keys are required</strong> to
          access your LP token balance and staking information. For staking to work properly, both
          your LP token and staking contract need valid viewing keys, and they must be synchronized.
        </p>
      </div>

      {/* Status Message */}
      <div
        className={`p-4 rounded-lg mb-4 ${
          actions.action === 'none'
            ? 'bg-green-500/10 border border-green-500/20'
            : 'bg-yellow-500/10 border border-yellow-500/20'
        }`}
      >
        <p
          className={`text-sm ${actions.action === 'none' ? 'text-green-400' : 'text-yellow-400'}`}
        >
          {actions.message}
        </p>
      </div>

      {/* Key Status Display */}
      <div className="space-y-3 mb-6">
        {renderKeyStatus(lpKeyState, lpTokenInfo?.symbol || 'LP Token', lpTokenAddress)}
        {renderKeyStatus(stakingKeyState, 'Staking Contract', stakingContractAddress)}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Create LP Key Button */}
        {actions.action === 'create_lp' && (
          <button
            onClick={() => void handleCreateLpKey()}
            disabled={isCreatingKey}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-adamant-accentText text-white rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50"
            title="Create a new viewing key for your LP token to access your balance"
          >
            <Key className="h-4 w-4" />
            {isCreatingKey ? 'Creating LP Key...' : '🔑 Create LP Viewing Key'}
          </button>
        )}

        {/* Fix LP Key Button */}
        {actions.action === 'fix_lp' && (
          <button
            onClick={() => void handleCreateLpKey()}
            disabled={isCreatingKey}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50"
            title="Replace the invalid LP viewing key with a new one"
          >
            <AlertCircle className="h-4 w-4" />
            {isCreatingKey ? 'Fixing LP Key...' : '🔧 Fix Invalid LP Key'}
          </button>
        )}

        {/* Sync to Staking Button */}
        {actions.action === 'sync_to_staking' && actions.canSync && (
          <button
            onClick={() => void handleSyncToStaking()}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50"
            title="Copy your LP viewing key to the staking contract so you can access staking features"
          >
            <Copy className="h-4 w-4" />
            {isSyncing ? 'Syncing Key...' : '🔄 Sync LP Key to Staking'}
          </button>
        )}
      </div>

      {/* Critical Issue Warning */}
      {actions.action === 'sync_to_staking' && !actions.canSync && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">
            ⚠️ Cannot sync invalid LP key to staking contract. Create a valid LP key first.
          </p>
        </div>
      )}
    </div>
  );
};
