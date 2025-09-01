import { ConfigToken } from '@/config/tokens';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Key, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { BroadcastMode, TxResultCode } from 'secretjs';

interface ViewingKeyMiniCreatorProps {
  token: ConfigToken;
  onSuccess: () => void;
  onError: (error: Error) => void;
  onClose: () => void;
  isOpen: boolean;
}

const ViewingKeyMiniCreator: React.FC<ViewingKeyMiniCreatorProps> = ({
  token,
  onSuccess,
  onError,
  onClose,
  isOpen,
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
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-adamant-box-dark border border-adamant-box-border rounded-lg w-[90vw] max-w-md z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-adamant-box-border">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-adamant-gradientBright" />
              <Dialog.Title className="text-adamant-text-box-main font-medium text-sm">
                Create Viewing Key
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
                disabled={isCreating}
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-adamant-text-box-main">{token.symbol}</span>
                <span className="text-adamant-text-box-secondary">({token.name})</span>
              </div>
              <p className="text-xs text-adamant-text-box-secondary">
                A viewing key is required to see your token balance. This will create a secure key
                for this token.
              </p>
            </div>

            <div className="bg-adamant-box-regular border border-adamant-box-border p-3 rounded">
              <div className="flex items-start gap-2">
                <Key className="w-4 h-4 text-adamant-gradientBright mt-0.5 flex-shrink-0" />
                <div className="text-xs text-adamant-text-box-secondary">
                  <p>
                    After creating, you may need to refresh the page or wait a moment for the
                    balance to appear.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 p-4 border-t border-adamant-box-border">
            <button
              onClick={() => void createViewingKey()}
              disabled={isCreating}
              className="flex-1 bg-adamant-gradientBright hover:bg-adamant-gradientDark disabled:bg-adamant-app-buttonDisabled disabled:cursor-not-allowed text-adamant-text-button-form-main font-medium py-2 px-3 rounded text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Key className="w-3 h-3" />
                  Create Key
                </>
              )}
            </button>
            <Dialog.Close asChild>
              <button
                disabled={isCreating}
                className="px-3 py-2 text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ViewingKeyMiniCreator;
