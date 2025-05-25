import React from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiErrorCircle } from 'react-icons/bi';
import { FiRefreshCw } from 'react-icons/fi';
import { HiOutlinePlus } from 'react-icons/hi';

interface FetchButtonProps {
  loading?: boolean;
  error?: boolean;
  hasBalance?: boolean;
  errorMessage?: string;
  showAddToken?: boolean;
  onFetch?: () => void;
  onAddToken?: () => void;
}

const FetchButton: React.FC<FetchButtonProps> = ({
  loading = false,
  error = false,
  hasBalance = false,
  errorMessage = 'Error',
  showAddToken = false,
  onFetch,
  onAddToken,
}) => {
  if (loading) {
    return (
      <div className="flex items-center gap-1 text-xs text-blue-400">
        <AiOutlineLoading3Quarters className="h-3 w-3 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error) {
    if (showAddToken && onAddToken) {
      return (
        <button
          onClick={onAddToken}
          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          title="Add token to Keplr"
        >
          <HiOutlinePlus className="h-3 w-3" />
          Add Token
        </button>
      );
    }

    return (
      <button
        onClick={onFetch}
        className="px-2 py-0.5 text-xs bg-red-700/30 hover:bg-red-700/50 rounded-full transition-colors flex items-center gap-1"
        title={`${errorMessage} - Click to retry`}
        disabled={loading}
      >
        <BiErrorCircle className="h-3 w-3" />
        <span>Error</span>
      </button>
    );
  }

  if (hasBalance) {
    return (
      <button
        onClick={onFetch}
        className="px-1 py-0.5 text-xs bg-gray-700/20 hover:bg-gray-700/40 rounded transition-colors flex items-center"
        title="Refresh balance"
        disabled={loading}
      >
        <FiRefreshCw className="h-3 w-3" />
      </button>
    );
  }

  return (
    <button
      onClick={onFetch}
      className="px-2 py-0.5 text-xs bg-gray-700/30 hover:bg-gray-700/50 rounded-full transition-colors flex items-center gap-1"
      title="Fetch balance"
      disabled={loading}
    >
      <FiRefreshCw className="h-3 w-3" />
      <span>Fetch</span>
    </button>
  );
};

export default FetchButton;
