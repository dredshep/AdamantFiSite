import { ConfigToken } from '@/config/tokens';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { showToastOnce } from '@/utils/toast/toastManager';
import { forceCreateViewingKey } from '@/utils/viewingKeys';
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { Key, Loader2, Shuffle, User } from 'lucide-react';
import React, { useState } from 'react';

interface QuickKeyActionsProps {
  token: ConfigToken;
  onSuccess?: (viewingKey: string) => void;
  onError?: (error: Error) => void;
  compact?: boolean;
  className?: string;
}

/**
 * Compact dual-action component for quick viewing key creation
 * Provides both auto-generate and custom key options in a minimal interface
 */
const QuickKeyActions: React.FC<QuickKeyActionsProps> = ({
  token,
  onSuccess,
  onError,
  compact = false,
  className = '',
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const { secretjs } = useSecretNetwork();

  const handleAutoGenerate = async () => {
    await createKey();
  };

  const handleCustomKey = async () => {
    if (!customKey.trim()) {
      setShowCustomInput(true);
      return;
    }
    await createKey(customKey.trim());
  };

  const createKey = async (customKeyValue?: string) => {
    if (!secretjs) {
      const error = new Error('Wallet not connected');
      onError?.(error);
      showToastOnce('wallet-not-connected', 'Wallet Not Connected', 'error', {
        message: 'Please connect your wallet to create viewing keys',
        autoClose: 3000,
      });
      return;
    }

    try {
      setIsCreating(true);

      console.log(
        `Creating viewing key for ${token.symbol} (${customKeyValue ? 'custom' : 'auto-generated'})`
      );

      const result = await forceCreateViewingKey({
        secretjs,
        contractAddress: token.address,
        codeHash: token.codeHash,
        customKey: customKeyValue,
        onProgress: (message) => {
          console.log('Quick Key Creation:', message);
        },
      });

      if (result.success) {
        showToastOnce(`key-created-${token.address}`, 'Viewing Key Created', 'success', {
          message: `Successfully created viewing key for ${token.symbol}`,
          autoClose: 3000,
        });

        onSuccess?.(result.viewingKey!);

        // Reset custom input
        setCustomKey('');
        setShowCustomInput(false);
      } else {
        throw new Error(result.error || 'Failed to create viewing key');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error creating viewing key:', error);

      onError?.(error instanceof Error ? error : new Error(errorMessage));

      showToastOnce(`key-failed-${token.address}`, 'Key Creation Failed', 'error', {
        message: `Failed to create viewing key for ${token.symbol}: ${errorMessage}`,
        autoClose: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const isValidCustomKey = customKey.trim().length >= 8;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {!showCustomInput ? (
          <>
            {/* Auto Generate Button */}
            <button
              onClick={handleAutoGenerate}
              disabled={isCreating}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-adamant-gradientBright hover:bg-adamant-gradientDark disabled:bg-adamant-app-buttonDisabled text-white rounded transition-colors"
              title="Auto-generate secure viewing key"
            >
              {isCreating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Shuffle className="w-3 h-3" />
              )}
              {!isCreating && 'Generate'}
            </button>

            {/* Custom Key Button */}
            <button
              onClick={() => setShowCustomInput(true)}
              disabled={isCreating}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-adamant-box-regular hover:bg-adamant-box-border disabled:opacity-50 text-adamant-text-box-main border border-adamant-box-border rounded transition-colors"
              title="Use your own viewing key"
            >
              <User className="w-3 h-3" />
              Custom
            </button>
          </>
        ) : (
          <>
            {/* Custom Key Input */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="Your key..."
                  className="w-24 text-xs bg-adamant-box-dark border border-adamant-box-border rounded px-2 py-1 pr-6 text-adamant-text-box-main placeholder-adamant-text-box-secondary focus:outline-none focus:border-adamant-gradientBright"
                  disabled={isCreating}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-adamant-text-box-secondary hover:text-adamant-text-box-main"
                  title={showKey ? 'Hide key' : 'Show key'}
                  type="button"
                >
                  {showKey ? (
                    <EyeClosedIcon className="w-2 h-2" />
                  ) : (
                    <EyeOpenIcon className="w-2 h-2" />
                  )}
                </button>
              </div>

              <button
                onClick={handleCustomKey}
                disabled={isCreating || !isValidCustomKey}
                className="px-2 py-1 text-xs bg-adamant-gradientBright hover:bg-adamant-gradientDark disabled:bg-adamant-app-buttonDisabled text-white rounded transition-colors"
                title="Use custom viewing key"
              >
                {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Use'}
              </button>

              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomKey('');
                }}
                disabled={isCreating}
                className="px-1 py-1 text-xs text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
                title="Cancel custom key"
              >
                ✕
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full size version
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleAutoGenerate}
          disabled={isCreating}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-adamant-gradientBright hover:bg-adamant-gradientDark disabled:bg-adamant-app-buttonDisabled text-white rounded-lg transition-colors"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Shuffle className="w-4 h-4" />
              Auto-Generate
            </>
          )}
        </button>

        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          disabled={isCreating}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-adamant-box-regular hover:bg-adamant-box-border disabled:opacity-50 text-adamant-text-box-main border border-adamant-box-border rounded-lg transition-colors"
        >
          <User className="w-4 h-4" />
          Custom Key
        </button>
      </div>

      {/* Custom Key Input Section */}
      {showCustomInput && (
        <div className="space-y-2 p-3 bg-adamant-box-regular border border-adamant-box-border rounded-lg">
          <label className="text-xs text-adamant-text-box-secondary">Your Viewing Key:</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="Enter your viewing key (min 8 characters)..."
              className="w-full text-sm bg-adamant-box-dark border border-adamant-box-border rounded px-3 py-2 pr-8 text-adamant-text-box-main placeholder-adamant-text-box-secondary focus:outline-none focus:border-adamant-gradientBright"
              disabled={isCreating}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
              title={showKey ? 'Hide key' : 'Show key'}
              type="button"
            >
              {showKey ? (
                <EyeClosedIcon className="w-4 h-4" />
              ) : (
                <EyeOpenIcon className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCustomKey}
              disabled={isCreating || !isValidCustomKey}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-adamant-gradientBright hover:bg-adamant-gradientDark disabled:bg-adamant-app-buttonDisabled text-white rounded transition-colors text-sm"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Key className="w-3 h-3" />
                  Use Custom Key
                </>
              )}
            </button>

            <button
              onClick={() => {
                setShowCustomInput(false);
                setCustomKey('');
              }}
              disabled={isCreating}
              className="px-3 py-2 text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors text-sm"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-adamant-text-box-secondary">
            Perfect for reusing the same key across multiple dApps
          </p>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-adamant-text-box-secondary bg-adamant-box-dark/20 p-2 rounded">
        Auto-generate creates a secure 64-character key. Custom keys allow you to reuse keys across
        dApps.
      </div>
    </div>
  );
};

export default QuickKeyActions;
