import { ConfigToken } from '@/config/tokens';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { forceCreateViewingKey } from '@/utils/viewingKeys';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon, EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { Key, Loader2, Settings } from 'lucide-react';
import React, { useState } from 'react';

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [useCustomKey, setUseCustomKey] = useState(false);
  const { secretjs } = useSecretNetwork();

  const createViewingKey = async () => {
    if (!secretjs) {
      onError(new Error('Wallet not connected'));
      return;
    }

    try {
      setIsCreating(true);

      // Validate custom key if being used
      if (useCustomKey) {
        if (!customKey.trim()) {
          throw new Error('Custom viewing key cannot be empty');
        }
        if (customKey.length < 8) {
          throw new Error('Custom viewing key must be at least 8 characters');
        }
      }

      console.log(
        `Creating viewing key for token ${token.symbol} (${
          useCustomKey ? 'custom' : 'auto-generated'
        })`
      );

      const result = await forceCreateViewingKey({
        secretjs,
        contractAddress: token.address,
        codeHash: token.codeHash,
        ...(useCustomKey && customKey.trim() && { customKey: customKey.trim() }),
        onProgress: (message) => {
          console.log('Key Creation Progress:', message);
        },
      });

      if (result.success) {
        console.log('Viewing key created successfully');
        onSuccess();
      } else {
        throw new Error(result.error || 'Failed to create viewing key');
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
                A viewing key is required to see your token balance.
                {useCustomKey
                  ? ' Provide your own key or switch to auto-generation.'
                  : " We'll generate a secure key for you."}
              </p>
            </div>

            {/* Advanced Options Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
                disabled={isCreating}
              >
                <Settings className="w-3 h-3" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="bg-adamant-box-regular border border-adamant-box-border p-3 rounded space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomKey"
                    checked={useCustomKey}
                    onChange={(e) => setUseCustomKey(e.target.checked)}
                    className="rounded border-adamant-box-border"
                    disabled={isCreating}
                  />
                  <label htmlFor="useCustomKey" className="text-xs text-adamant-text-box-main">
                    Use custom viewing key
                  </label>
                </div>

                {useCustomKey && (
                  <div className="space-y-2">
                    <label className="text-xs text-adamant-text-box-secondary">
                      Your Viewing Key:
                    </label>
                    <div className="relative">
                      <input
                        type={showCustomKey ? 'text' : 'password'}
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        placeholder="Enter your viewing key (min 8 characters)..."
                        className="w-full text-xs bg-adamant-box-dark border border-adamant-box-border rounded px-3 py-2 pr-8 text-adamant-text-box-main placeholder-adamant-text-box-secondary focus:outline-none focus:border-adamant-gradientBright"
                        disabled={isCreating}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustomKey(!showCustomKey)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
                        title={showCustomKey ? 'Hide key' : 'Show key'}
                      >
                        {showCustomKey ? (
                          <EyeClosedIcon className="w-3 h-3" />
                        ) : (
                          <EyeOpenIcon className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-adamant-text-box-secondary">
                      Perfect for reusing the same key across multiple dApps
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-adamant-box-regular border border-adamant-box-border p-3 rounded">
              <div className="flex items-start gap-2">
                <Key className="w-4 h-4 text-adamant-gradientBright mt-0.5 flex-shrink-0" />
                <div className="text-xs text-adamant-text-box-secondary">
                  <p>
                    After creating, the key will be stored in Keplr and your balance should appear
                    shortly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 p-4 border-t border-adamant-box-border">
            <button
              onClick={() => void createViewingKey()}
              disabled={isCreating || (useCustomKey && (!customKey.trim() || customKey.length < 8))}
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
                  {useCustomKey ? 'Use Custom Key' : 'Generate Key'}
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
