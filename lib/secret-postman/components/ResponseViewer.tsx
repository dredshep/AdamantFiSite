'use client';

import { CheckCircle, Clock, Code, Copy, Download, Eye, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { QueryResponse } from '../types';
import { formatJson } from '../utils';

interface ResponseViewerProps {
  response: QueryResponse | null;
  isLoading?: boolean;
  className?: string;
}

export default function ResponseViewer({
  response,
  isLoading = false,
  className,
}: ResponseViewerProps) {
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  const copyToClipboard = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(`${label} copied to clipboard`);
    } catch (_error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadResponse = () => {
    if (!response) return;

    const content =
      viewMode === 'formatted' ? formatJson(response.data) : JSON.stringify(response.data);

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${response.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Response downloaded');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div
        className={`bg-adamant-box-regular rounded-xl border border-adamant-box-border ${className}`}
      >
        <div className="p-4 border-b border-adamant-box-border">
          <h3 className="text-lg font-semibold text-adamant-text-box-main">Response</h3>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-adamant-accentText border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-adamant-text-box-secondary">Executing query...</div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div
        className={`bg-adamant-box-regular rounded-xl border border-adamant-box-border ${className}`}
      >
        <div className="p-4 border-b border-adamant-box-border">
          <h3 className="text-lg font-semibold text-adamant-text-box-main">Response</h3>
        </div>
        <div className="p-8 text-center text-adamant-text-box-secondary">
          No response yet. Execute a query to see results.
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-adamant-box-regular rounded-xl border border-adamant-box-border ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-adamant-box-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-adamant-text-box-main">Response</h3>
            <div className="flex items-center gap-2">
              {response.success ? (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Success
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400 text-sm">
                  <XCircle className="h-4 w-4" />
                  Error
                </div>
              )}
              <div className="flex items-center gap-1 text-adamant-text-box-secondary text-sm">
                <Clock className="h-3 w-3" />
                {response.executionTime}ms
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-adamant-box-dark rounded-lg p-1">
              <button
                onClick={() => setViewMode('formatted')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  viewMode === 'formatted'
                    ? 'bg-adamant-box-regular text-adamant-text-box-main'
                    : 'text-adamant-text-box-secondary hover:text-adamant-text-box-main'
                }`}
              >
                <Eye className="h-3 w-3" />
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  viewMode === 'raw'
                    ? 'bg-adamant-box-regular text-adamant-text-box-main'
                    : 'text-adamant-text-box-secondary hover:text-adamant-text-box-main'
                }`}
              >
                <Code className="h-3 w-3" />
              </button>
            </div>

            <button
              onClick={() =>
                void copyToClipboard(
                  viewMode === 'formatted'
                    ? formatJson(response.data || response.error)
                    : JSON.stringify(response.data || response.error),
                  'Response'
                )
              }
              className="p-1.5 text-adamant-text-box-secondary hover:text-adamant-accentText transition-colors"
              title="Copy response"
            >
              <Copy className="h-4 w-4" />
            </button>

            {response.success && (
              <button
                onClick={downloadResponse}
                className="p-1.5 text-adamant-text-box-secondary hover:text-adamant-accentText transition-colors"
                title="Download response"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Response Metadata */}
        <div className="flex items-center gap-4 text-xs text-adamant-text-box-secondary">
          <div>
            <span className="font-medium">Time:</span> {formatTimestamp(response.timestamp)}
          </div>
          <div>
            <span className="font-medium">Network:</span>{' '}
            {response.networkUsed.name || response.networkUsed.chainId}
          </div>
          <div>
            <span className="font-medium">Chain ID:</span> {response.networkUsed.chainId}
          </div>
        </div>
      </div>

      {/* Response Content */}
      <div className="p-4">
        {response.success ? (
          <div className="space-y-3">
            <div className="text-sm font-medium text-adamant-text-box-secondary">Response Data</div>
            <div className="bg-adamant-box-dark rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-sm text-adamant-text-box-main whitespace-pre-wrap break-words">
                {viewMode === 'formatted'
                  ? formatJson(response.data)
                  : JSON.stringify(response.data)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-medium text-red-400">Error</div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <pre className="text-sm text-red-300 whitespace-pre-wrap break-words">
                {response.error}
              </pre>
            </div>
          </div>
        )}

        {/* Raw Response Object (Debug) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="text-xs text-adamant-text-box-secondary cursor-pointer hover:text-adamant-text-box-main">
              Show raw response object (debug)
            </summary>
            <div className="mt-2 bg-adamant-box-dark rounded-lg p-3">
              <pre className="text-xs text-adamant-text-box-secondary whitespace-pre-wrap break-words">
                {formatJson(response)}
              </pre>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
