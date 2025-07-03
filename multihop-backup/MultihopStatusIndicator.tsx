import React from 'react';
import { validateMultihopConfig } from './multihopExecution';
import { MultihopPath } from './routing';

interface MultihopStatusIndicatorProps {
  swapPath: MultihopPath | null;
  payTokenSymbol?: string | undefined;
  receiveTokenSymbol?: string | undefined;
}

/**
 * MultihopStatusIndicator - Shows the status of multihop routing configuration
 *
 * This component displays:
 * - Whether multihop is enabled/disabled for safety
 * - Router contract configuration status
 * - Current routing path information
 *
 * Can be easily commented out to hide multihop status from users
 */
const MultihopStatusIndicator: React.FC<MultihopStatusIndicatorProps> = ({
  swapPath,
  payTokenSymbol,
  receiveTokenSymbol,
}) => {
  // Validate multihop configuration
  const multihopConfig = validateMultihopConfig();

  // Only show for multihop routes (not direct swaps)
  if (!swapPath || swapPath.isDirectPath) {
    return null;
  }

  return (
    <div className="flex justify-between items-center bg-adamant-app-input/20 border border-adamant-box-inputBorder rounded px-2 py-1.5">
      <span className="font-medium text-adamant-text-form-main">Multihop:</span>
      <div className="flex items-center gap-1 text-xs">
        {!multihopConfig.valid ? (
          <span className="text-red-400">⚠️ Disabled (Safety)</span>
        ) : (
          <span className="text-adamant-gradientBright">✓ Router Ready</span>
        )}
      </div>
    </div>
  );
};

export default MultihopStatusIndicator;
