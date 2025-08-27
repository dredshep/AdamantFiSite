import { ConfigToken } from '@/config/tokens';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckIcon, CopyIcon, Cross2Icon } from '@radix-ui/react-icons';
import React, { useState } from 'react';

interface FixViewingKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: ConfigToken;
  onRetry: () => void;
}

const FixViewingKeyModal: React.FC<FixViewingKeyModalProps> = ({
  isOpen,
  onClose,
  token,
  onRetry,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleRetryAndClose = () => {
    onRetry();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-lg p-6 w-[90vw] max-w-md max-h-[90vh] overflow-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-white">
              Fix Viewing Key
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Cross2Icon className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            {/* Token Info */}
            <div className="bg-gray-800 p-3 rounded border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-white">{token.symbol}</span>
                <span className="text-gray-400">({token.name})</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Address:</span>
                <code className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded flex-1">
                  {`${token.address.slice(0, 16)}...${token.address.slice(-8)}`}
                </code>
                <button
                  onClick={copyAddress}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <CheckIcon className="w-4 h-4 text-green-400" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Problem Explanation */}
            <div className="text-sm text-gray-300">
              <h3 className="font-medium text-white mb-2">⚠️ Viewing Key Issue</h3>
              <p className="mb-3">
                Your viewing key for this token is invalid or corrupted. This prevents us from
                accessing your balance.
              </p>
            </div>

            {/* Fix Instructions */}
            <div className="bg-blue-900/20 border border-blue-700/50 p-4 rounded">
              <h3 className="font-medium text-blue-300 mb-3">🔧 How to Fix:</h3>
              <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                <li>
                  <strong>Open Keplr Extension</strong> - Click the Keplr icon in your browser
                </li>
                <li>
                  <strong>Find the Token</strong> - Look for {token.symbol} in your token list
                </li>
                <li>
                  <strong>Remove the Token</strong> - Click the settings/gear icon next to the token
                  and remove it
                </li>
                <li>
                  <strong>Re-add the Token</strong> - Use the token address above to add it again
                </li>
                <li>
                  <strong>Set New Viewing Key</strong> - Keplr will prompt you to create a new
                  viewing key
                </li>
              </ol>
            </div>

            {/* Alternative Method */}
            <div className="bg-green-900/20 border border-green-700/50 p-4 rounded">
              <h3 className="font-medium text-green-300 mb-2">💡 Alternative:</h3>
              <p className="text-sm text-gray-300 mb-3">
                You can also create a new viewing key directly from this interface:
              </p>
              <button
                onClick={handleRetryAndClose}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors"
              >
                Create New Viewing Key
              </button>
            </div>

            {/* Support Note */}
            <div className="text-xs text-gray-400 bg-gray-800/50 p-3 rounded">
              <p>
                <strong>Need help?</strong> If you continue to have issues, try refreshing the page
                after updating your viewing key, or contact support.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={copyAddress}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors flex items-center justify-center gap-2"
              >
                {copiedAddress ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4" />
                    Copy Address
                  </>
                )}
              </button>
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">
                  Close
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FixViewingKeyModal;
