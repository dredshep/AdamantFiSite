import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ViewingKeyStatus as ViewingKeyStatusEnum } from '@/types/staking';
import React from 'react';

interface ViewingKeyStatusProps {
  status: ViewingKeyStatusEnum;
  contractAddress: string;
  onSetupViewingKey: () => Promise<void>;
  isLoading?: boolean;
}

const ViewingKeyStatus: React.FC<ViewingKeyStatusProps> = ({
  status,
  contractAddress,
  onSetupViewingKey,
  isLoading = false,
}) => {
  // Handler for onClick that doesn't return a Promise
  const handleSetupViewingKey = () => {
    void onSetupViewingKey();
  };

  if (status === ViewingKeyStatusEnum.CREATED) {
    return (
      <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-green-300 font-medium">Viewing key is set up</span>
        </div>
      </div>
    );
  }

  if (status === ViewingKeyStatusEnum.PENDING || isLoading) {
    return (
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 text-sm">
        <div className="flex items-center">
          <LoadingSpinner size={12} className="mr-2" />
          <span className="text-blue-300 font-medium">Setting up viewing key...</span>
        </div>
      </div>
    );
  }

  if (status === ViewingKeyStatusEnum.ERROR) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-sm">
        <div className="flex items-center mb-2">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-red-300 font-medium">Viewing key error</span>
        </div>
        <p className="text-gray-300 mb-2">
          A viewing key is required to see your staked balance and rewards.
        </p>
        <button
          onClick={handleSetupViewingKey}
          disabled={isLoading}
          className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Default case: NONE
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm">
      <div className="mb-2 text-gray-300">
        <span className="font-medium text-white">Viewing key required</span>
      </div>
      <p className="text-gray-400 mb-3">
        To view your staked balance and rewards, you need to set up a viewing key for this contract:
      </p>
      <div className="bg-gray-900 px-2 py-1 rounded mb-3 font-mono text-xs text-gray-400 break-all">
        {contractAddress}
      </div>
      <button
        onClick={handleSetupViewingKey}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium w-full"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <LoadingSpinner size={12} className="mr-2" />
            Setting up...
          </span>
        ) : (
          'Set Up Viewing Key'
        )}
      </button>
    </div>
  );
};

export default ViewingKeyStatus;
