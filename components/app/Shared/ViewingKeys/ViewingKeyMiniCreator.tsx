import { ConfigToken } from '@/config/tokens';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { Cross2Icon } from '@radix-ui/react-icons';
import React, { useState } from 'react';
import { BroadcastMode, TxResultCode } from 'secretjs';

interface ViewingKeyMiniCreatorProps {
  token: ConfigToken;
  onSuccess: () => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

const ViewingKeyMiniCreator: React.FC<ViewingKeyMiniCreatorProps> = ({
  token,
  onSuccess,
  onError,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const { secretjs } = useSecretNetwork();

  const generateRandomKey = () => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const createViewingKey = async () => {
    if (!secretjs) {
      onError(new Error('Wallet not connected'));
      return;
    }

    try {
      setIsCreating(true);

      const keyToUse = generateRandomKey();

      const setViewingKeyMsg = {
        set_viewing_key: {
          key: keyToUse,
        },
      };

      console.log(`Creating viewing key for token ${token.symbol}`);

      const result = await secretjs.tx.compute.executeContract(
        {
          sender: secretjs.address,
          contract_address: token.address,
          code_hash: token.codeHash,
          msg: setViewingKeyMsg,
          sent_funds: [],
        },
        {
          gasLimit: 150_000,
          broadcastCheckIntervalMs: 1000,
          broadcastTimeoutMs: 60_000,
          broadcastMode: BroadcastMode.Sync,
        }
      );

      if (result.code === TxResultCode.Success) {
        console.log('Viewing key created successfully');

        // Refresh Keplr connection to pick up the new key
        try {
          if (window.keplr) {
            console.log('Refreshing Keplr connection...');
            await window.keplr.disable('secret-4');
            await window.keplr.enable('secret-4');

            // Re-suggest the token
            await window.keplr.suggestToken('secret-4', token.address, token.codeHash);
          }
        } catch (keplrError) {
          console.warn('Keplr refresh error:', keplrError);
        }

        onSuccess();
      } else {
        const errorLog =
          'rawLog' in result && typeof result.rawLog === 'string' ? result.rawLog : 'Unknown error';
        throw new Error(`Failed to set viewing key: ${errorLog}`);
      }
    } catch (error) {
      console.error('Error creating viewing key:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium text-sm">Create Viewing Key</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          disabled={isCreating}
        >
          <Cross2Icon className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">{token.symbol}</span>
            <span className="text-gray-400">({token.name})</span>
          </div>
          <p className="text-xs text-gray-400">
            A viewing key is required to see your token balance. This will create a secure key for
            this token.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void createViewingKey()}
            disabled={isCreating}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded text-sm transition-colors"
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Key'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
        </div>

        <div className="text-xs text-amber-300 bg-amber-900/20 p-2 rounded">
          💡 After creating, you may need to refresh the page or wait a moment for the balance to
          appear.
        </div>
      </div>
    </div>
  );
};

export default ViewingKeyMiniCreator;
