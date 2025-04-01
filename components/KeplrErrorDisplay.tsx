import { KeplrErrorType, formatKeplrErrorDetails, getKeplrErrorSuggestions } from '@/lib/keplr';
import React from 'react';

interface KeplrErrorDisplayProps {
  error: Error;
  isExpanded?: boolean;
  showDeveloperInfo?: boolean;
}

export default function KeplrErrorDisplay({
  error,
  isExpanded = false,
  showDeveloperInfo = true,
}: KeplrErrorDisplayProps) {
  const [expanded, setExpanded] = React.useState(isExpanded);

  // Determine error type
  const isNetworkError =
    typeof error.message === 'string' && error.message.includes('NetworkError');
  const isKeplrError =
    typeof error.message === 'string' &&
    (error.message.includes('Keplr') ||
      error.message.includes('wallet') ||
      error.message.includes('extension') ||
      isNetworkError);

  // Get appropriate error type
  let errorType = KeplrErrorType.UNEXPECTED;
  if (isNetworkError) {
    errorType = KeplrErrorType.NETWORK_ERROR;
  } else if (typeof error.message === 'string') {
    if (error.message.includes('not installed')) {
      errorType = KeplrErrorType.NOT_INSTALLED;
    } else if (error.message.includes('locked') || error.message.includes('unlock')) {
      errorType = KeplrErrorType.NOT_UNLOCKED;
    } else if (error.message.includes('rejected')) {
      errorType = KeplrErrorType.REJECTED_BY_USER;
    } else if (error.message.includes('chain') || error.message.includes('network')) {
      errorType = KeplrErrorType.CHAIN_NOT_FOUND;
    } else if (error.message.includes('account')) {
      errorType = KeplrErrorType.ACCOUNT_NOT_FOUND;
    } else if (error.message.includes('timeout')) {
      errorType = KeplrErrorType.TIMEOUT;
    }
  }

  // Get suggestions based on error type
  const suggestions = getKeplrErrorSuggestions(errorType);

  // Format detailed error information for developers
  const detailedErrorInfo = formatKeplrErrorDetails(error);

  return (
    <div className="p-6 bg-red-900 border border-red-700 rounded-lg text-white my-4">
      <h2 className="text-xl font-bold mb-4">Keplr Connection Error</h2>

      <div className="mb-4">
        <p className="text-lg font-medium mb-2">{error.message}</p>

        {isKeplrError && (
          <div className="mt-4 p-4 bg-yellow-900 bg-opacity-50 rounded">
            <h3 className="font-bold text-yellow-300 mb-2">Troubleshooting Steps</h3>
            <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-100">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showDeveloperInfo && (
        <details
          className="mt-4 border border-red-800 rounded p-3"
          open={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <summary className="cursor-pointer text-red-300 font-medium">
            Developer Information
          </summary>
          <div className="mt-3 p-3 bg-black bg-opacity-30 rounded">
            <h4 className="text-sm font-semibold mb-2 text-gray-300">Environment Information</h4>
            <div className="text-sm text-gray-400 mb-4">
              <p>Browser: {navigator.userAgent}</p>
              <p>Timestamp: {new Date().toISOString()}</p>
            </div>

            <h4 className="text-sm font-semibold mb-2 text-gray-300">Error Details</h4>
            <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-96 bg-black bg-opacity-50 p-3 rounded text-gray-400">
              {detailedErrorInfo}
            </pre>

            <div className="mt-4 text-xs text-gray-500">
              <p>
                Run{' '}
                <code className="bg-black bg-opacity-50 px-1 rounded">window.keplr.version</code> in
                the browser console to check your Keplr version.
              </p>
            </div>
          </div>
        </details>
      )}

      {isNetworkError && (
        <div className="mt-4 text-sm text-gray-300">
          <p>
            This appears to be a network connection issue between your browser and the Keplr
            extension. This usually happens when the extension is not responding or has an internal
            error.
          </p>
          <div className="mt-2 p-2 bg-blue-900 bg-opacity-30 rounded">
            <p className="font-medium">Try these additional steps:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1 text-blue-100">
              <li>Restart your browser completely</li>
              <li>Check if Keplr needs to be updated</li>
              <li>Temporarily disable other browser extensions</li>
              <li>Try using a different browser</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
