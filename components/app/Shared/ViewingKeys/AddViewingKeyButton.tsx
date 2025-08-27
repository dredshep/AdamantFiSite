import { TOKENS } from '@/config/tokens';
import { TokenBalanceError } from '@/hooks/useTokenBalance';
import { ExclamationTriangleIcon, PlusIcon } from '@radix-ui/react-icons';
import React, { useState } from 'react';
import FixViewingKeyModal from './FixViewingKeyModal';
import ViewingKeyMiniCreator from './ViewingKeyMiniCreator';

interface AddViewingKeyButtonProps {
  tokenAddress: string;
  error: TokenBalanceError;
  onSuccess: () => void;
}

const AddViewingKeyButton: React.FC<AddViewingKeyButtonProps> = ({
  tokenAddress,
  error,
  onSuccess,
}) => {
  const [showCreator, setShowCreator] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);

  // Find token info
  const token = TOKENS.find((t) => t.address === tokenAddress);
  if (!token) {
    return null; // Can't create viewing key without token config
  }

  const handleSuccess = () => {
    setShowCreator(false);
    setShowFixModal(false);
    onSuccess();
  };

  const handleError = (error: Error) => {
    console.error('Viewing key creation failed:', error);
    // Could show a toast here
  };

  const isInvalidKey = error === TokenBalanceError.VIEWING_KEY_INVALID;
  const isMissingKey = error === TokenBalanceError.NO_VIEWING_KEY;

  if (isInvalidKey) {
    return (
      <>
        <button
          onClick={() => setShowFixModal(true)}
          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors bg-orange-900/20 hover:bg-orange-900/30 px-2 py-1 rounded border border-orange-700/50"
          title="Fix invalid viewing key"
        >
          <ExclamationTriangleIcon className="w-3 h-3" />
          Fix Key
        </button>
        <FixViewingKeyModal
          isOpen={showFixModal}
          onClose={() => setShowFixModal(false)}
          token={token}
          onRetry={() => {
            setShowFixModal(false);
            setShowCreator(true);
          }}
        />
        {showCreator && (
          <div className="absolute top-full left-0 mt-1 z-50">
            <ViewingKeyMiniCreator
              token={token}
              onSuccess={handleSuccess}
              onError={handleError}
              onClose={() => setShowCreator(false)}
            />
          </div>
        )}
      </>
    );
  }

  if (isMissingKey) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowCreator(!showCreator)}
          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors bg-green-900/20 hover:bg-green-900/30 px-2 py-1 rounded border border-green-700/50"
          title="Add viewing key for this token"
        >
          <PlusIcon className="w-3 h-3" />
          Add Key
        </button>
        {showCreator && (
          <div className="absolute top-full left-0 mt-1 z-50">
            <ViewingKeyMiniCreator
              token={token}
              onSuccess={handleSuccess}
              onError={handleError}
              onClose={() => setShowCreator(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AddViewingKeyButton;
