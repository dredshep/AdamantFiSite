import { isDevelopmentMode } from '@/utils/features';
import React from 'react';

interface ViewingKeyDebugDisplayProps {
  isLpKeyValid: boolean;
  isStakingKeyValid: boolean;
}

/**
 * Debug component to display viewing key validation status
 * Only visible in development mode
 */
const ViewingKeyDebugDisplay: React.FC<ViewingKeyDebugDisplayProps> = ({
  isLpKeyValid,
  isStakingKeyValid,
}) => {
  // Only render in development mode
  if (!isDevelopmentMode()) {
    return null;
  }

  return (
    <div className="bg-adamant-box-dark/10 backdrop-blur-sm rounded-xl p-2 border border-gray-500/10 text-xs">
      <div className="text-gray-400 mb-1">Debug: Viewing Key Status</div>
      <div className="flex gap-4">
        <span className={`${isLpKeyValid ? 'text-green-400' : 'text-red-400'}`}>
          LP: {isLpKeyValid ? '✓' : '✗'}
        </span>
        <span className={`${isStakingKeyValid ? 'text-green-400' : 'text-red-400'}`}>
          Staking: {isStakingKeyValid ? '✓' : '✗'}
        </span>
        <span
          className={`${isLpKeyValid && !isStakingKeyValid ? 'text-blue-400' : 'text-gray-500'}`}
        >
          Sync: {isLpKeyValid && !isStakingKeyValid ? 'Available' : 'N/A'}
        </span>
      </div>
    </div>
  );
};

export default ViewingKeyDebugDisplay;

