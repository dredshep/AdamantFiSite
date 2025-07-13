import { TOKENS } from '@/config/tokens';
import { MultihopPath } from '@/utils/swap/routing';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon, InfoCircledIcon } from '@radix-ui/react-icons';
import React from 'react';
import { HiArrowRight, HiExclamationTriangle } from 'react-icons/hi2';

interface RouteDisplayProps {
  swapPath: MultihopPath | null;
  payTokenSymbol?: string;
  receiveTokenSymbol?: string;
  priceImpact: string;
  slippage: number;
  isEstimating: boolean;
  hopPriceImpacts?: string[]; // Price impact for each hop
  minSlippageRequired?: number; // Minimum slippage needed for this route
}

const RouteDisplay: React.FC<RouteDisplayProps> = ({
  swapPath,
  payTokenSymbol,
  receiveTokenSymbol,
  priceImpact,
  slippage,
  isEstimating,
  hopPriceImpacts,
  minSlippageRequired,
}) => {
  if (!swapPath || !payTokenSymbol || !receiveTokenSymbol) {
    return null;
  }

  const isDirectPath = swapPath.isDirectPath;
  const totalHops = swapPath.totalHops;

  // Check if slippage warning is needed
  const needsSlippageWarning = minSlippageRequired && minSlippageRequired > slippage;

  // Get token symbols for the path
  const getTokenSymbol = (address: string): string => {
    const token = TOKENS.find((t) => t.address === address);
    return token?.symbol || 'Unknown';
  };

  const RouteInfoDialog: React.FC = () => (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="ml-1 text-gray-400 hover:text-white transition-colors">
          <InfoCircledIcon className="w-3 h-3" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-lg p-4 w-[90vw] max-w-md max-h-[90vh] overflow-auto z-50">
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="text-lg font-semibold text-white">Route Details</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-white">
                <Cross2Icon className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-gray-300">
              <p>
                <strong>Route Type:</strong> {isDirectPath ? 'Direct' : 'Multihop'}
              </p>
              <p>
                <strong>Total Hops:</strong> {totalHops}
              </p>
              <p>
                <strong>Total Price Impact:</strong> {priceImpact}%
              </p>
              <p>
                <strong>Current Slippage:</strong> {slippage}%
              </p>
              {needsSlippageWarning && (
                <p className="text-orange-400">
                  <strong>Recommended Slippage:</strong> {minSlippageRequired}%
                </p>
              )}
            </div>

            {/* Hop-by-hop breakdown */}
            <div className="bg-gray-800 p-3 rounded border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Route Breakdown:</h4>
              <div className="space-y-2">
                {swapPath.hops.map((hop, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        {index + 1}
                      </span>
                      <span>{getTokenSymbol(hop.fromToken)}</span>
                      <HiArrowRight className="w-3 h-3 text-gray-500" />
                      <span>{getTokenSymbol(hop.toToken)}</span>
                    </div>
                    {hopPriceImpacts && hopPriceImpacts[index] && (
                      <span className="text-gray-400">{hopPriceImpacts[index]}% impact</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Raw data for debugging */}
            <div className="bg-gray-800 p-3 rounded border border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Raw Data:</h4>
              <pre className="text-xs text-gray-400 overflow-auto max-h-32">
                {JSON.stringify(swapPath, null, 2)}
              </pre>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

  return (
    <div className="bg-adamant-app-input/30 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Route:</span>
          <RouteInfoDialog />
        </div>
        <div className="flex items-center gap-2">
          {isEstimating && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          <span className="text-xs text-gray-400">
            {totalHops} hop{totalHops > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Route visualization */}
      <div className="flex items-center gap-2 mb-2">
        {isDirectPath ? (
          // Direct route
          <div className="flex items-center gap-2">
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-medium">
              {payTokenSymbol}
            </span>
            <HiArrowRight className="w-4 h-4 text-gray-500" />
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm font-medium">
              {receiveTokenSymbol}
            </span>
            <span className="text-xs text-gray-500 ml-2">Direct</span>
          </div>
        ) : (
          // Multihop route
          <div className="flex items-center gap-2 flex-wrap">
            {swapPath.hops.map((hop, index) => (
              <React.Fragment key={index}>
                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm font-medium">
                  {getTokenSymbol(hop.fromToken)}
                </span>
                <HiArrowRight className="w-4 h-4 text-gray-500" />
                {index === swapPath.hops.length - 1 && (
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm font-medium">
                    {getTokenSymbol(hop.toToken)}
                  </span>
                )}
              </React.Fragment>
            ))}
            <span className="text-xs text-gray-500 ml-2">
              via {swapPath.hops.length > 1 ? 'sSCRT' : 'direct'}
            </span>
          </div>
        )}
      </div>

      {/* Warnings */}
      {needsSlippageWarning && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 mb-2">
          <div className="flex items-center gap-2">
            <HiExclamationTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-400">
              Consider increasing slippage to {minSlippageRequired}% for better success rate
            </span>
          </div>
        </div>
      )}

      {/* No liquidity warning */}
      {priceImpact === 'N/A' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-2">
          <div className="flex items-center gap-2">
            <HiExclamationTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">
              One or more pools have no liquidity - swap may not be possible
            </span>
          </div>
        </div>
      )}

      {/* Price impact warning */}
      {priceImpact !== 'N/A' && parseFloat(priceImpact) > 5 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <HiExclamationTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">
              High price impact ({priceImpact}%) - consider smaller amount
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteDisplay;
