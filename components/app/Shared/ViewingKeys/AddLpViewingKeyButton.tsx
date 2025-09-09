import { ConfigToken, LIQUIDITY_PAIRS } from '@/config/tokens';
import { LpTokenBalanceError } from '@/hooks/useLpTokenBalance';
import { useViewingKeyModalStore } from '@/store/viewingKeyModalStore';
import { ExclamationTriangleIcon, PlusIcon } from '@radix-ui/react-icons';
import React from 'react';

interface AddLpViewingKeyButtonProps {
  error: LpTokenBalanceError;
  onSuccess: () => void;
  tokenSymbol: string;
  tokenAddress: string; // Required for LP viewing key modal
}

const AddLpViewingKeyButton: React.FC<AddLpViewingKeyButtonProps> = ({
  error,
  onSuccess,
  tokenSymbol,
  tokenAddress,
}) => {
  const openModal = useViewingKeyModalStore((state) => state.open);

  // Create a temporary ConfigToken for the LP token to work with the viewing key modal
  const createLpTokenConfig = (): ConfigToken | null => {
    const lpPair = LIQUIDITY_PAIRS.find((pair) => pair.lpToken === tokenAddress);
    if (!lpPair) {
      console.warn('LP token not found in LIQUIDITY_PAIRS:', tokenAddress);
      return null;
    }

    return {
      name: `${lpPair.token0}/${lpPair.token1} LP Token`,
      symbol: tokenSymbol,
      address: tokenAddress as `secret1${string}`,
      codeHash: lpPair.lpTokenCodeHash,
      decimals: 6, // LP tokens typically use 6 decimals
    };
  };

  const handleOpenModal = (context: string) => {
    const lpTokenConfig = createLpTokenConfig();
    if (lpTokenConfig) {
      openModal(lpTokenConfig, context, onSuccess);
    } else {
      console.error('Cannot open viewing key modal for LP token:', tokenAddress);
    }
  };

  const isMissingKey = error === LpTokenBalanceError.NO_VIEWING_KEY;
  const isLpTokenNotFound = error === LpTokenBalanceError.LP_TOKEN_NOT_FOUND;
  const isKeyRejected = error === LpTokenBalanceError.VIEWING_KEY_REJECTED;

  // Show "Add Key" for missing viewing key
  if (isMissingKey) {
    return (
      <button
        onClick={() => handleOpenModal('missing-key')}
        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors bg-green-900/20 hover:bg-green-900/30 px-2 py-1 rounded border border-green-700/50"
        title={`Add viewing key for ${tokenSymbol} LP token`}
      >
        <PlusIcon className="w-3 h-3" />
        Add LP Key
      </button>
    );
  }

  // Show "Fix Key" for key rejection or LP token not found issues
  if (isKeyRejected || isLpTokenNotFound) {
    return (
      <button
        onClick={() => handleOpenModal(isLpTokenNotFound ? 'lp-setup' : 'rejected-key')}
        className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors bg-orange-900/20 hover:bg-orange-900/30 px-2 py-1 rounded border border-orange-700/50"
        title={
          isLpTokenNotFound
            ? `Add ${tokenSymbol} LP token to Keplr wallet`
            : `Fix viewing key for ${tokenSymbol} LP token`
        }
      >
        <ExclamationTriangleIcon className="w-3 h-3" />
        {isLpTokenNotFound ? 'Add LP Token' : 'Fix LP Key'}
      </button>
    );
  }

  return null;
};

export default AddLpViewingKeyButton;
