import { ConfigToken } from '@/config/tokens';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckIcon, CopyIcon, Cross2Icon } from '@radix-ui/react-icons';
import { AlertTriangle, HelpCircle, Lightbulb, Settings, Wrench } from 'lucide-react';
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
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-adamant-box-dark border border-adamant-box-border rounded-lg w-[90vw] max-w-lg max-h-[80vh] z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-adamant-box-border">
            <Dialog.Title className="text-lg font-semibold text-adamant-text-box-main">
              Fix Viewing Key
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors">
                <Cross2Icon className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Token Info */}
            <div className="bg-adamant-box-regular p-4 rounded border border-adamant-box-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-medium text-adamant-text-box-main">{token.symbol}</span>
                <span className="text-adamant-text-box-secondary">({token.name})</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-adamant-text-box-secondary">Address:</span>
                <code className="text-xs text-adamant-text-box-main bg-adamant-box-dark px-2 py-1 rounded flex-1 font-mono">
                  {`${token.address.slice(0, 16)}...${token.address.slice(-8)}`}
                </code>
                <button
                  onClick={() => void copyAddress()}
                  className="text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors p-1"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <CheckIcon className="w-4 h-4 text-adamant-gradientBright" />
                  ) : (
                    <CopyIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Problem Explanation */}
            <div className="text-sm text-adamant-text-box-secondary">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="font-medium text-adamant-text-box-main">Viewing Key Issue</h3>
              </div>
              <p className="mb-3">
                Your viewing key for this token is invalid or corrupted. This prevents us from
                accessing your balance.
              </p>
            </div>

            {/* Fix Instructions */}
            <div className="bg-adamant-box-regular border border-adamant-box-border p-4 rounded">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-adamant-gradientBright" />
                <h3 className="font-medium text-adamant-text-box-main">How to Fix:</h3>
              </div>
              <ol className="text-sm text-adamant-text-box-secondary space-y-2 list-decimal list-inside">
                <li>
                  <strong className="text-adamant-text-box-main">Open Keplr Extension</strong> -
                  Click the Keplr icon in your browser
                </li>
                <li>
                  <strong className="text-adamant-text-box-main">Find the Token</strong> - Look for{' '}
                  {token.symbol} in your token list
                </li>
                <li className="flex items-start gap-2">
                  <span>3.</span>
                  <div>
                    <strong className="text-adamant-text-box-main">Remove the Token</strong> - Click
                    the
                    <Settings className="w-3 h-3 inline mx-1" />
                    settings icon next to the token and remove it
                  </div>
                </li>
                <li>
                  <strong className="text-adamant-text-box-main">Re-add the Token</strong> - Use the
                  token address above to add it again
                </li>
                <li>
                  <strong className="text-adamant-text-box-main">Set New Viewing Key</strong> -
                  Keplr will prompt you to create a new viewing key
                </li>
              </ol>
            </div>

            {/* Alternative Method */}
            <div className="bg-adamant-box-regular border border-adamant-box-border p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-adamant-gradientBright" />
                <h3 className="font-medium text-adamant-text-box-main">Alternative:</h3>
              </div>
              <p className="text-sm text-adamant-text-box-secondary mb-3">
                You can also create a new viewing key directly from this interface:
              </p>
              <button
                onClick={handleRetryAndClose}
                className="bg-adamant-gradientBright hover:bg-adamant-gradientDark text-adamant-text-button-form-main font-medium py-2 px-4 rounded text-sm transition-colors"
              >
                Create New Viewing Key
              </button>
            </div>

            {/* Support Note */}
            <div className="bg-adamant-box-dark border border-adamant-box-border p-3 rounded">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-adamant-text-box-secondary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-adamant-text-box-secondary">
                  <p>
                    <strong className="text-adamant-text-box-main">Need help?</strong> If you
                    continue to have issues, try refreshing the page after updating your viewing
                    key, or contact support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 p-6 border-t border-adamant-box-border">
            <button
              onClick={() => void copyAddress()}
              className="flex-1 bg-adamant-gradientBright hover:bg-adamant-gradientDark text-adamant-text-button-form-main font-medium py-2 px-4 rounded text-sm transition-colors flex items-center justify-center gap-2"
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
              <button className="px-4 py-2 text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors text-sm">
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FixViewingKeyModal;
