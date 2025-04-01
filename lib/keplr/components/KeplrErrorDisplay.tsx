/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import {
  formatKeplrErrorDetails,
  getKeplrErrorSuggestions,
  KeplrDebugInfo,
  KeplrErrorType,
} from '@/lib/keplr/utils';
import React from 'react';

interface KeplrErrorDisplayProps {
  error: Error;
  isExpanded?: boolean;
  showDeveloperInfo?: boolean;
}

// Enhanced error type that includes debug information
interface EnhancedError extends Error {
  __keplrDebugInfo?: KeplrDebugInfo;
}

export default function KeplrErrorDisplay({
  error,
  isExpanded = false,
  showDeveloperInfo = true,
}: KeplrErrorDisplayProps) {
  const [expanded, setExpanded] = React.useState(isExpanded);

  // Cast error to EnhancedError type for proper typing
  const enhancedError = error as EnhancedError;

  // Check for enhanced error info
  const hasEnhancedInfo = enhancedError.__keplrDebugInfo !== undefined;
  const enhancedInfo = hasEnhancedInfo ? enhancedError.__keplrDebugInfo : null;

  // Determine error type
  const errorMessage = error.message || '';
  const isNetworkError = errorMessage.includes('NetworkError');
  const isKeplrError =
    errorMessage.includes('Keplr') ||
    errorMessage.includes('wallet') ||
    errorMessage.includes('extension') ||
    isNetworkError;

  // Get appropriate error type
  let errorType = KeplrErrorType.UNEXPECTED;
  if (isNetworkError) {
    errorType = KeplrErrorType.NETWORK_ERROR;
  } else {
    if (errorMessage.includes('not installed')) {
      errorType = KeplrErrorType.NOT_INSTALLED;
    } else if (errorMessage.includes('locked') || errorMessage.includes('unlock')) {
      errorType = KeplrErrorType.NOT_UNLOCKED;
    } else if (errorMessage.includes('rejected')) {
      errorType = KeplrErrorType.REJECTED_BY_USER;
    } else if (errorMessage.includes('chain') || errorMessage.includes('network')) {
      errorType = KeplrErrorType.CHAIN_NOT_FOUND;
    } else if (errorMessage.includes('account')) {
      errorType = KeplrErrorType.ACCOUNT_NOT_FOUND;
    } else if (errorMessage.includes('timeout')) {
      errorType = KeplrErrorType.TIMEOUT;
    }
  }

  // Get suggestions based on error type
  const suggestions = getKeplrErrorSuggestions(errorType);

  // Format detailed error information for developers
  const detailedErrorInfo = formatKeplrErrorDetails(error);

  // Format stack trace from enhanced error (if available)
  const renderEnhancedStackTrace = () => {
    if (!enhancedInfo) return null;
    if (!enhancedInfo.extendedInfo !== undefined) return null;
    if (!enhancedInfo.extendedInfo.stackTrace) return null;

    const stackTrace = enhancedInfo.extendedInfo.stackTrace;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2 text-gray-300">Enhanced Stack Trace</h4>
        <div className="bg-black bg-opacity-50 p-3 rounded text-xs text-gray-400 font-mono">
          {stackTrace.map((frame, index) => (
            <div key={index} className="mb-1">
              {Boolean(frame.function) && Boolean(frame.file) ? (
                <span>
                  at <span className="text-blue-300">{frame.function}</span> in{' '}
                  <span className="text-green-300">{frame.file}</span>:
                  <span className="text-yellow-300">
                    {frame.line}:{frame.column}
                  </span>
                </span>
              ) : (
                <span>{frame.originalLine}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render additional diagnostic information
  const renderDiagnosticInfo = () => {
    if (!enhancedInfo) return null;
    if (!enhancedInfo.extendedInfo !== undefined) return null;

    const { extendedInfo } = enhancedInfo;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2 text-gray-300">Diagnostic Information</h4>
        <div className="bg-black bg-opacity-50 p-3 rounded text-xs overflow-auto max-h-52">
          <table className="w-full text-left text-gray-400">
            <tbody>
              <tr>
                <td className="pr-4 py-1 font-medium">Timestamp:</td>
                <td>{enhancedInfo.timestamp}</td>
              </tr>
              <tr>
                <td className="pr-4 py-1 font-medium">Browser:</td>
                <td className="break-all">{enhancedInfo.browserInfo}</td>
              </tr>
              {Object.entries(extendedInfo)
                .filter(
                  ([key]) =>
                    !['stackTrace', 'message', 'context'].includes(key) &&
                    typeof extendedInfo[key] !== 'object'
                )
                .map(([key, value]) => (
                  <tr key={key}>
                    <td className="pr-4 py-1 font-medium">{key}:</td>
                    <td className="break-all">
                      {value !== null && value !== undefined
                        ? typeof value === 'boolean'
                          ? value.toString()
                          : String(value)
                        : '(not available)'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render context information
  const renderContextInfo = () => {
    if (!enhancedInfo) return null;
    if (!enhancedInfo.extendedInfo !== undefined) return null;
    if (!enhancedInfo.extendedInfo.context) return null;

    const context = enhancedInfo.extendedInfo.context;
    if (Object.keys(context).length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2 text-gray-300">Operation Context</h4>
        <div className="bg-black bg-opacity-50 p-3 rounded text-xs">
          <pre className="text-gray-400 whitespace-pre-wrap">
            {JSON.stringify(context, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  // Get browser info and timestamp for display
  const browserInfo = enhancedInfo?.browserInfo ?? navigator.userAgent;
  const timestamp = enhancedInfo?.timestamp ?? new Date().toISOString();

  return (
    <div className="p-6 bg-red-900 border border-red-700 rounded-lg text-white my-4">
      <h2 className="text-xl font-bold mb-4">Keplr Connection Error</h2>

      <div className="mb-4">
        <p className="text-lg font-medium mb-2">{errorMessage}</p>

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
            Developer Information {hasEnhancedInfo ? '(Enhanced)' : ''}
          </summary>
          <div className="mt-3 p-3 bg-black bg-opacity-30 rounded">
            <h4 className="text-sm font-semibold mb-2 text-gray-300">Environment Information</h4>
            <div className="text-sm text-gray-400 mb-4">
              <p>Browser: {browserInfo}</p>
              <p>Timestamp: {timestamp}</p>
            </div>

            {/* Enhanced diagnostic info */}
            {renderDiagnosticInfo()}

            {/* Enhanced context info */}
            {renderContextInfo()}

            {/* Enhanced stack trace */}
            {renderEnhancedStackTrace()}

            {/* Original error details as fallback */}
            {!enhancedInfo && (
              <>
                <h4 className="text-sm font-semibold mb-2 text-gray-300">Error Details</h4>
                <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-96 bg-black bg-opacity-50 p-3 rounded text-gray-400">
                  {detailedErrorInfo}
                </pre>
              </>
            )}

            <div className="mt-4 text-xs text-gray-500">
              <p>
                Use <code className="bg-black bg-opacity-50 px-1 rounded">debugKeplrQuery()</code>{' '}
                from <code className="bg-black bg-opacity-50 px-1 rounded">@/lib/keplr</code> to get
                enhanced error details.
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
