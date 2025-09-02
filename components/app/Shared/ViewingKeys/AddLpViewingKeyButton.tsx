import { LpTokenBalanceError } from '@/hooks/useLpTokenBalance';
import { ExclamationTriangleIcon, PlusIcon } from '@radix-ui/react-icons';
import React, { useState } from 'react';

interface AddLpViewingKeyButtonProps {
  error: LpTokenBalanceError;
  onSuggestToken: () => void;
  onSuccess: () => void;
  tokenSymbol: string;
}

const AddLpViewingKeyButton: React.FC<AddLpViewingKeyButtonProps> = ({
  error,
  onSuggestToken,
  onSuccess,
  tokenSymbol,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = () => {
    setIsProcessing(true);
    try {
      onSuggestToken();
      onSuccess();
    } catch (error) {
      console.error('LP viewing key creation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isMissingKey = error === LpTokenBalanceError.NO_VIEWING_KEY;
  const isLpTokenNotFound = error === LpTokenBalanceError.LP_TOKEN_NOT_FOUND;
  const isKeyRejected = error === LpTokenBalanceError.VIEWING_KEY_REJECTED;

  // Show "Add Key" for missing viewing key
  if (isMissingKey) {
    return (
      <button
        onClick={handleAction}
        disabled={isProcessing}
        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors bg-green-900/20 hover:bg-green-900/30 px-2 py-1 rounded border border-green-700/50 disabled:opacity-50"
        title={`Add viewing key for ${tokenSymbol} LP token`}
      >
        <PlusIcon className="w-3 h-3" />
        {isProcessing ? 'Adding...' : 'Add LP Key'}
      </button>
    );
  }

  // Show "Fix Key" for key rejection or LP token not found issues
  if (isKeyRejected || isLpTokenNotFound) {
    return (
      <button
        onClick={handleAction}
        disabled={isProcessing}
        className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors bg-orange-900/20 hover:bg-orange-900/30 px-2 py-1 rounded border border-orange-700/50 disabled:opacity-50"
        title={
          isLpTokenNotFound
            ? `Add ${tokenSymbol} LP token to Keplr wallet`
            : `Fix viewing key for ${tokenSymbol} LP token`
        }
      >
        <ExclamationTriangleIcon className="w-3 h-3" />
        {isProcessing ? 'Setting...' : isLpTokenNotFound ? 'Add LP Token' : 'Fix LP Key'}
      </button>
    );
  }

  return null;
};

export default AddLpViewingKeyButton;
