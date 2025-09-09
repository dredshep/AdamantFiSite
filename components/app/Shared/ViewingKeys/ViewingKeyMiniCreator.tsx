import { ConfigToken } from '@/config/tokens';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { forceCreateViewingKey } from '@/utils/viewingKeys';
import { validateAndImportViewingKey } from '@/utils/viewingKeys/integrationHelpers';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon, EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { Download, Key, Loader2, Plus, Settings } from 'lucide-react';
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
  const [mode, setMode] = useState<'create' | 'import'>('create');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [showImportKey, setShowImportKey] = useState(false);
  const { secretjs } = useSecretNetwork();

  const createViewingKey = async () => {
    if (!secretjs) {
      onError(new Error('Wallet not connected'));
      return;
    }

    try {
      setIsProcessing(true);

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
      setIsProcessing(false);
    }
  };

  const importViewingKey = async () => {
    try {
      setIsProcessing(true);

      if (!importKey.trim()) {
        throw new Error('Import key cannot be empty');
      }

      if (importKey.length < 8) {
        throw new Error('Viewing key must be at least 8 characters');
      }

      console.log(`Importing viewing key for token ${token.symbol}`);

      const result = await validateAndImportViewingKey(
        token.address,
        token.codeHash,
        importKey.trim()
      );

      if (result.success) {
        console.log('Viewing key imported successfully');
        onSuccess();
      } else {
        throw new Error(result.error || 'Failed to import viewing key');
      }
    } catch (error) {
      console.error('Error importing viewing key:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = async () => {
    if (mode === 'create') {
      await createViewingKey();
    } else {
      await importViewingKey();
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
              {mode === 'create' ? (
                <Key className="w-4 h-4 text-adamant-gradientBright" />
              ) : (
                <Download className="w-4 h-4 text-adamant-gradientBright" />
              )}
              <Dialog.Title className="text-adamant-text-box-main font-medium text-sm">
                {mode === 'create' ? 'Create Viewing Key' : 'Import Viewing Key'}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
                disabled={isProcessing}
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
              </p>
            </div>

            {/* Mode Selection */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-medium transition-colors ${
                  mode === 'create'
                    ? 'bg-adamant-gradientBright text-adamant-text-button-form-main'
                    : 'bg-adamant-box-regular border border-adamant-box-border text-adamant-text-box-secondary hover:text-adamant-text-box-main'
                }`}
                disabled={isProcessing}
              >
                <Plus className="w-3 h-3" />
                Create New
              </button>
              <button
                onClick={() => setMode('import')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-medium transition-colors ${
                  mode === 'import'
                    ? 'bg-adamant-gradientBright text-adamant-text-button-form-main'
                    : 'bg-adamant-box-regular border border-adamant-box-border text-adamant-text-box-secondary hover:text-adamant-text-box-main'
                }`}
                disabled={isProcessing}
              >
                <Download className="w-3 h-3" />
                Import Existing
              </button>
            </div>

            <div className="text-xs text-adamant-text-box-secondary">
              {mode === 'create'
                ? useCustomKey
                  ? 'Provide your own key or switch to auto-generation.'
                  : "We'll generate a secure key for you."
                : 'Import an existing viewing key that already works with the contract.'}
            </div>

            {/* Import Key Input (shown when import mode is selected) */}
            {mode === 'import' && (
              <div className="space-y-2">
                <label className="text-xs text-adamant-text-box-secondary">
                  Existing Viewing Key:
                </label>
                <div className="relative">
                  <input
                    type={showImportKey ? 'text' : 'password'}
                    value={importKey}
                    onChange={(e) => setImportKey(e.target.value)}
                    placeholder="Paste your viewing key here (min 8 characters)..."
                    className="w-full text-xs bg-adamant-box-dark border border-adamant-box-border rounded px-3 py-2 pr-8 text-adamant-text-box-main placeholder-adamant-text-box-secondary focus:outline-none focus:border-adamant-gradientBright"
                    disabled={isProcessing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowImportKey(!showImportKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
                    title={showImportKey ? 'Hide key' : 'Show key'}
                  >
                    {showImportKey ? (
                      <EyeClosedIcon className="w-3 h-3" />
                    ) : (
                      <EyeOpenIcon className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-adamant-text-box-secondary">
                  We'll validate this key against the contract before importing it to Keplr
                </p>
              </div>
            )}

            {/* Advanced Options Toggle (only for create mode) */}
            {mode === 'create' && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
                  disabled={isProcessing}
                >
                  <Settings className="w-3 h-3" />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </button>
              </div>
            )}

            {/* Advanced Options (only for create mode) */}
            {mode === 'create' && showAdvanced && (
              <div className="bg-adamant-box-regular border border-adamant-box-border p-3 rounded space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomKey"
                    checked={useCustomKey}
                    onChange={(e) => setUseCustomKey(e.target.checked)}
                    className="rounded border-adamant-box-border"
                    disabled={isProcessing}
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
                        disabled={isProcessing}
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
                {mode === 'create' ? (
                  <Key className="w-4 h-4 text-adamant-gradientBright mt-0.5 flex-shrink-0" />
                ) : (
                  <Download className="w-4 h-4 text-adamant-gradientBright mt-0.5 flex-shrink-0" />
                )}
                <div className="text-xs text-adamant-text-box-secondary">
                  <p>
                    {mode === 'create'
                      ? 'After creating, the key will be stored in Keplr and your balance should appear shortly.'
                      : 'After importing, the key will be validated and stored in Keplr without any on-chain transaction fees.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 p-4 border-t border-adamant-box-border">
            <button
              onClick={() => void handleAction()}
              disabled={
                isProcessing ||
                (mode === 'create' &&
                  useCustomKey &&
                  (!customKey.trim() || customKey.length < 8)) ||
                (mode === 'import' && (!importKey.trim() || importKey.length < 8))
              }
              className="flex-1 bg-adamant-gradientBright hover:bg-adamant-gradientDark disabled:bg-adamant-app-buttonDisabled disabled:cursor-not-allowed text-adamant-text-button-form-main font-medium py-2 px-3 rounded text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Importing...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? (
                    <Key className="w-3 h-3" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  {mode === 'create'
                    ? useCustomKey
                      ? 'Use Custom Key'
                      : 'Generate Key'
                    : 'Import Key'}
                </>
              )}
            </button>
            <Dialog.Close asChild>
              <button
                disabled={isProcessing}
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
