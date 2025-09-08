import { TOKENS } from '@/config/tokens';
import { TokenBalanceError } from '@/hooks/useTokenBalance';
import { useViewingKeyModalStore } from '@/store/viewingKeyModalStore';
import { ExclamationTriangleIcon, PlusIcon } from '@radix-ui/react-icons';
import React from 'react';

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
  const openModal = useViewingKeyModalStore((state) => state.open);

  // Find token info
  const token = TOKENS.find((t) => t.address === tokenAddress);
  if (!token) {
    return null; // Can't create viewing key without token config
  }

  const handleOpenModal = (context: string) => {
    openModal(token, context, onSuccess);
  };

  const isInvalidKey = error === TokenBalanceError.VIEWING_KEY_INVALID;
  const isMissingKey = error === TokenBalanceError.NO_VIEWING_KEY;
  const isRejectedKey = error === TokenBalanceError.VIEWING_KEY_REJECTED;

  if (isInvalidKey) {
    return (
      <button
        onClick={() => handleOpenModal('invalid-key')}
        className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors bg-orange-900/20 hover:bg-orange-900/30 px-2 py-1 rounded border border-orange-700/50"
        title="Fix invalid viewing key"
      >
        <ExclamationTriangleIcon className="w-3 h-3" />
        Fix Key
      </button>
    );
  }

  if (isMissingKey) {
    return (
      <button
        onClick={() => handleOpenModal('missing-key')}
        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors bg-green-900/20 hover:bg-green-900/30 px-2 py-1 rounded border border-green-700/50"
        title="Add viewing key for this token"
      >
        <PlusIcon className="w-3 h-3" />
        Add Key
      </button>
    );
  }

  if (isRejectedKey) {
    return (
      <button
        onClick={() => handleOpenModal('rejected-key')}
        className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors bg-amber-900/20 hover:bg-amber-900/30 px-2 py-1 rounded border border-amber-700/50"
        title="Retry viewing key creation (was rejected)"
      >
        <PlusIcon className="w-3 h-3" />
        Try Again
      </button>
    );
  }

  return null;
};

export default AddViewingKeyButton;
