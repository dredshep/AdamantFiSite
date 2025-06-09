// Main Secret Postman page component
'use client';

import { showToastOnce } from '@/utils/toast/toastManager';
import { FileText, Network, Play, RotateCcw, Settings } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSecretPostmanStore } from '../store/secretPostmanStore';
import { QueryHistory, QueryRequest, QueryResponse, ResourceItem } from '../types';
import { executeQuery, generateId, getDefaultNetworkConfig } from '../utils';
import HistoryPanel from './HistoryPanel';
import QueryEditor from './QueryEditor';
import ResourcesPanel from './ResourcesPanel';
import ResponseViewer from './ResponseViewer';

interface SecretPostmanPageProps {
  className?: string;
}

export default function SecretPostmanPage({ className }: SecretPostmanPageProps) {
  const {
    currentQuery,
    networkConfig,
    history,
    isExecuting,
    showResources,
    setContractAddress,
    setCodeHash,
    setQueryName,
    setQueryDescription,
    setHeight,
    setAutoFetchHeight,
    setNetworkConfig,
    setIsExecuting,
    setShowResources,
    addToHistory,
    resetCurrentQuery,
    setRawQuery,
    insertIntoContractAddress,
    insertIntoCodeHash,
    insertIntoQueryName,
    insertIntoQueryDescription,
    insertIntoRawQuery,
    setPendingStructuredInput,
  } = useSecretPostmanStore();

  // Local state for current response
  const [currentResponse, setCurrentResponse] = useState<QueryResponse | null>(null);

  // Track the last focused element for auto-fill functionality
  const lastFocusedElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const isProcessingRef = useRef(false);

  // Track focus events to remember the last focused input
  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        lastFocusedElementRef.current = target as HTMLInputElement | HTMLTextAreaElement;
      }
    };

    document.addEventListener('focusin', handleFocus);

    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);

  const handleExecuteQuery = useCallback(async () => {
    if (!currentQuery.contractAddress.trim()) {
      showToastOnce('contract-address-required', 'Please enter a contract address', 'error');
      return;
    }

    if (!currentQuery.rawQuery.trim() || currentQuery.rawQuery === '{}') {
      showToastOnce('query-required', 'Please enter a query', 'error');
      return;
    }

    setIsExecuting(true);
    setCurrentResponse(null);

    try {
      const request: QueryRequest = {
        id: generateId(),
        contractAddress: currentQuery.contractAddress,
        ...(currentQuery.codeHash && { codeHash: currentQuery.codeHash }),
        query: currentQuery.query,
        networkConfig,
        timestamp: Date.now(),
        ...(currentQuery.name && { name: currentQuery.name }),
        ...(currentQuery.description && { description: currentQuery.description }),
        ...(currentQuery.height !== undefined && { height: currentQuery.height }),
        autoFetchHeight: currentQuery.autoFetchHeight,
      };

      const response = await executeQuery(request);
      setCurrentResponse(response);

      // Add to history
      addToHistory(request, response);

      if (response.success) {
        showToastOnce('query-success', 'Query executed successfully', 'success');
      } else {
        showToastOnce('query-failed', 'Query execution failed', 'error', {
          message: response.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      const errorResponse: QueryResponse = {
        id: generateId(),
        requestId: '',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        executionTime: 0,
        networkUsed: networkConfig,
      };
      setCurrentResponse(errorResponse);
      showToastOnce('query-execution-error', 'Query execution failed', 'error', {
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsExecuting(false);
    }
  }, [currentQuery, networkConfig, setIsExecuting, addToHistory]);

  const handleResourceSelect = useCallback(
    (resource: ResourceItem) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100);

      const activeElement = lastFocusedElementRef.current;

      // Define isTemplateVariable and valueToInsert at a higher scope
      const isTemplateVariable = resource.metadata?.type === 'template';
      const valueToInsert = isTemplateVariable
        ? `{{${resource.templateVariable}}}`
        : resource.value;

      if (
        resource.templateVariable.includes('_ADDRESS') &&
        !resource.templateVariable.includes('LP_')
      ) {
        setContractAddress(resource.value);
        showToastOnce(
          'resource-inserted-address',
          `Inserted ${resource.name} address into contract field`,
          'success'
        );
        return;
      }

      if (resource.templateVariable.includes('_CODE_HASH')) {
        setCodeHash(resource.value);
        showToastOnce(
          'resource-inserted-codehash',
          `Inserted ${resource.name} into code hash field`,
          'success'
        );
        return;
      }

      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
      ) {
        const start = activeElement.selectionStart || 0;
        const end = activeElement.selectionEnd || 0;

        // Check if it's a structured editor input first
        if (activeElement.dataset.structuredEditorInput === 'true') {
          const itemId = activeElement.dataset.itemId;
          if (itemId) {
            setPendingStructuredInput(itemId, valueToInsert, start, end);
            // QueryEditor will handle focus and cursor update via its useEffect
          } else {
            // Should not happen if attributes are set correctly
            console.warn('Structured editor input focused but itemId is missing.');
            showToastOnce(
              'structured-input-error',
              'Error inserting into structured field.',
              'error'
            );
          }
        } else if (activeElement.dataset.queryEditor === 'raw') {
          insertIntoRawQuery(valueToInsert, start, end);

          // Restore cursor position for raw query editor
          const newCursorPos = start + valueToInsert.length;
          setTimeout(() => {
            const textarea = document.querySelector(
              '[data-query-editor="raw"]'
            ) as HTMLTextAreaElement;
            if (textarea) {
              textarea.focus();
              textarea.setSelectionRange(newCursorPos, newCursorPos);
            }
          }, 50);
        } else {
          // For other known input fields, identify which field and update via store
          const fieldName =
            activeElement.name ||
            activeElement.id ||
            activeElement.placeholder?.toLowerCase() ||
            '';
          const newCursorPos = start + valueToInsert.length;

          if (
            fieldName.includes('contract') ||
            fieldName.includes('address') ||
            fieldName.includes('secret1')
          ) {
            insertIntoContractAddress(valueToInsert, start, end);
          } else if (fieldName.includes('code') || fieldName.includes('hash')) {
            insertIntoCodeHash(valueToInsert, start, end);
          } else if (fieldName.includes('name')) {
            insertIntoQueryName(valueToInsert, start, end);
          } else if (fieldName.includes('description') || fieldName.includes('describe')) {
            insertIntoQueryDescription(valueToInsert, start, end);
          } else if (fieldName.includes('height')) {
            const currentHeight = String(currentQuery.height || '');
            const newValue =
              currentHeight.slice(0, start) + valueToInsert + currentHeight.slice(end);
            try {
              const heightValue = parseInt(newValue, 10);
              setHeight(isNaN(heightValue) ? newValue : heightValue);
            } catch {
              setHeight(newValue);
            }
          } else if (fieldName.includes('chain') || fieldName.includes('pulsar')) {
            const currentChainId = networkConfig.chainId;
            const newValue =
              currentChainId.slice(0, start) + valueToInsert + currentChainId.slice(end);
            setNetworkConfig({ ...networkConfig, chainId: newValue });
          } else if (
            fieldName.includes('lcd') ||
            fieldName.includes('url') ||
            fieldName.includes('api')
          ) {
            const currentUrl = networkConfig.lcdUrl;
            const newValue = currentUrl.slice(0, start) + valueToInsert + currentUrl.slice(end);
            setNetworkConfig({ ...networkConfig, lcdUrl: newValue });
          } else {
            // THIS WAS THE PROBLEMATIC FALLBACK
            // If no specific input field is matched, do not prepend to raw query.
            // Instead, show a message or do nothing.
            showToastOnce(
              'focus-unknown-input',
              'Please focus a recognized field or use the Raw JSON editor to insert this resource.',
              'warning'
            );
            return; // Return to prevent the generic success toast / cursor restore for this case
          }

          // Restore cursor position for regular inputs (if not handled by QueryEditor)
          setTimeout(() => {
            if (
              activeElement &&
              activeElement.isConnected &&
              activeElement.dataset.structuredEditorInput !== 'true'
            ) {
              activeElement.focus();
              if (activeElement.setSelectionRange) {
                activeElement.setSelectionRange(newCursorPos, newCursorPos);
              }
            }
          }, 50);
        }

        showToastOnce(
          'resource-auto-filled',
          `Auto-filled "${resource.name}" into focused input`,
          'success'
        );
      } else {
        // Fallback: if no specific input element is focused, insert into raw query editor
        const textarea = document.querySelector('[data-query-editor="raw"]') as HTMLTextAreaElement;

        if (textarea) {
          const currentRawQuery = currentQuery.rawQuery;
          const selectionStart = textarea.selectionStart || 0;
          const selectionEnd = textarea.selectionEnd || 0;
          insertIntoRawQuery(valueToInsert, selectionStart, selectionEnd);

          const newCursorPos = selectionStart + valueToInsert.length;
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          }, 50);
        } else {
          // Ultimate fallback: insert at beginning of raw query (should ideally not be reached if textarea exists)
          insertIntoRawQuery(valueToInsert, 0, 0);
        }

        showToastOnce(
          'template-variable-inserted',
          `Inserted resource into raw query: ${resource.name}`,
          'success'
        );
      }
    },
    [
      setContractAddress,
      setCodeHash,
      setQueryName,
      setQueryDescription,
      setHeight,
      setNetworkConfig,
      insertIntoContractAddress,
      insertIntoCodeHash,
      insertIntoQueryName,
      insertIntoQueryDescription,
      insertIntoRawQuery,
      setPendingStructuredInput,
      currentQuery.height,
      currentQuery.rawQuery,
      networkConfig,
    ]
  );

  const handleExecuteFromHistory = useCallback(
    async (historyItem: QueryHistory) => {
      // Load the history item into current state
      setContractAddress(historyItem.request.contractAddress);
      setCodeHash(historyItem.request.codeHash || '');
      setQueryName(historyItem.request.name || '');
      setQueryDescription(historyItem.request.description || '');
      if (historyItem.request.height !== undefined) {
        setHeight(historyItem.request.height);
      }
      setAutoFetchHeight(historyItem.request.autoFetchHeight || false);
      setNetworkConfig(historyItem.request.networkConfig);

      // Execute the query
      await handleExecuteQuery();

      showToastOnce('history-executed', 'Executing query from history', 'info');
    },
    [
      setContractAddress,
      setCodeHash,
      setQueryName,
      setQueryDescription,
      setHeight,
      setAutoFetchHeight,
      setNetworkConfig,
      handleExecuteQuery,
    ]
  );

  const resetToDefaults = () => {
    resetCurrentQuery();
    setNetworkConfig(getDefaultNetworkConfig());
    setCurrentResponse(null);
    showToastOnce('reset-defaults', 'Reset to defaults', 'success');
  };

  return (
    <div className={`min-h-screen bg-adamant-background ${className}`}>
      {/* Header */}
      <div className="bg-adamant-box-regular border-b border-adamant-box-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-adamant-accentText" />
                <h1 className="text-2xl font-bold text-adamant-text-box-main">Secret Postman</h1>
              </div>
              <div className="hidden md:block text-sm text-adamant-text-box-secondary">
                A Postman-like interface for Secret Network contract interactions
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResources(!showResources)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showResources
                    ? 'bg-adamant-accentText text-black'
                    : 'bg-adamant-box-dark text-adamant-text-box-main hover:bg-adamant-box-light'
                }`}
              >
                Resources {showResources ? 'Hide' : 'Show'}
              </button>

              <button
                onClick={resetToDefaults}
                className="p-2 text-adamant-text-box-secondary hover:text-adamant-accentText transition-colors"
                title="Reset to defaults"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-200px)]">
          {/* Left Sidebar - Resources (when shown) */}
          {showResources && (
            <div className="lg:col-span-1">
              <ResourcesPanel onResourceSelect={handleResourceSelect} className="h-full" />
            </div>
          )}

          {/* Main Content Area */}
          <div className={`${showResources ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
            {/* Network Configuration */}
            <div className="bg-adamant-box-regular rounded-xl border border-adamant-box-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Network className="h-5 w-5 text-adamant-accentText" />
                <h3 className="text-lg font-semibold text-adamant-text-box-main">
                  Network Configuration
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                    Chain ID
                  </label>
                  <input
                    type="text"
                    value={networkConfig.chainId}
                    onChange={(e) =>
                      setNetworkConfig({ ...networkConfig, chainId: e.target.value })
                    }
                    className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                    placeholder="e.g., pulsar-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                    LCD URL
                  </label>
                  <input
                    type="text"
                    value={networkConfig.lcdUrl}
                    onChange={(e) => setNetworkConfig({ ...networkConfig, lcdUrl: e.target.value })}
                    className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                    placeholder="e.g., https://api.pulsar3.scrttestnet.com"
                  />
                </div>
              </div>
            </div>

            {/* Contract Information */}
            <div className="bg-adamant-box-regular rounded-xl border border-adamant-box-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-5 w-5 text-adamant-accentText" />
                <h3 className="text-lg font-semibold text-adamant-text-box-main">
                  Contract Information
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                    Query Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentQuery.name}
                    onChange={(e) => setQueryName(e.target.value)}
                    className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                    placeholder="e.g., Get Pool Info"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={currentQuery.description}
                    onChange={(e) => setQueryDescription(e.target.value)}
                    className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                    placeholder="Describe what this query does..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                      Contract Address *
                    </label>
                    <input
                      type="text"
                      value={currentQuery.contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                      placeholder="secret1..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                      Code Hash (Optional)
                    </label>
                    <input
                      type="text"
                      value={currentQuery.codeHash}
                      onChange={(e) => setCodeHash(e.target.value)}
                      className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                      placeholder="Contract code hash..."
                    />
                  </div>
                </div>

                {/* Height Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-adamant-text-box-main">
                      Block Height Configuration
                    </h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoFetchHeight"
                        checked={currentQuery.autoFetchHeight}
                        onChange={(e) => setAutoFetchHeight(e.target.checked)}
                        className="w-4 h-4 text-adamant-accentText bg-adamant-app-input border-white/20 rounded focus:ring-adamant-accentText/30 focus:ring-2"
                      />
                      <label
                        htmlFor="autoFetchHeight"
                        className="text-sm text-adamant-text-box-secondary"
                      >
                        Auto-fetch latest height
                      </label>
                    </div>
                  </div>

                  {!currentQuery.autoFetchHeight && (
                    <div>
                      <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                        Block Height (Optional)
                      </label>
                      <input
                        type="number"
                        value={currentQuery.height || ''}
                        onChange={(e) =>
                          setHeight(e.target.value ? parseInt(e.target.value, 10) : undefined)
                        }
                        className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                        placeholder="Enter specific block height or use template variable {{HEIGHT}}"
                      />
                    </div>
                  )}

                  <div className="text-xs text-adamant-text-box-secondary bg-adamant-box-dark rounded-lg p-3">
                    <strong>Height Templates:</strong> Use <code>{`{{HEIGHT}}`}</code> or{' '}
                    <code>{`{{BLOCK_HEIGHT}}`}</code> in your query to inject the current or
                    specified block height.
                    {currentQuery.autoFetchHeight ? (
                      <span className="block mt-1 text-adamant-accentText">
                        ✓ Latest block height will be fetched automatically
                      </span>
                    ) : (
                      currentQuery.height && (
                        <span className="block mt-1 text-adamant-accentText">
                          ✓ Using height: {currentQuery.height}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Query Editor */}
            <QueryEditor className="flex-1" />

            {/* Execute Button */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-adamant-text-box-secondary">Ready to execute query</div>
              <button
                onClick={handleExecuteQuery}
                disabled={isExecuting || !currentQuery.contractAddress.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark text-black font-bold hover:from-adamant-gradientDark hover:to-adamant-gradientBright transition-all duration-300 px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-4px_rgba(167,142,90,0.3)]"
              >
                {isExecuting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Execute Query
                  </>
                )}
              </button>
            </div>

            {/* Response Viewer */}
            <ResponseViewer
              response={currentResponse}
              isLoading={isExecuting}
              className="min-h-[300px]"
            />
          </div>

          {/* Right Sidebar - History */}
          <div className="lg:col-span-1">
            <HistoryPanel
              onExecuteFromHistoryAction={(historyItem) =>
                void handleExecuteFromHistory(historyItem)
              }
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Documentation Footer */}
      <div className="bg-adamant-box-regular border-t border-adamant-box-border mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="text-sm text-adamant-text-box-secondary">
            <div className="font-medium mb-2">Secret Postman Usage Guide:</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <strong>Template Variables:</strong> Use {`{{VARIABLE_NAME}}`} in your queries.
                Click resources to insert them automatically.
              </div>
              <div>
                <strong>Query Modes:</strong> Switch between structured editor (beginner-friendly)
                and raw JSON mode (advanced users).
              </div>
              <div>
                <strong>Auto-Fill:</strong> Click any input field, then click a resource to
                auto-fill. Resources auto-detect the focused input.
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-adamant-box-dark rounded-lg">
                <div className="text-sm font-medium mb-2">Available Template Variables:</div>
                <div className="text-xs space-y-1">
                  <div>
                    <code>{`{{HEIGHT}}`}</code> / <code>{`{{BLOCK_HEIGHT}}`}</code> - Current block
                    height
                  </div>
                  <div>
                    <code>{`{{ADDRESS}}`}</code> - Connected wallet address
                  </div>
                  <div>
                    <code>{`{{VIEWING_KEY}}`}</code> - Viewing key for contract
                  </div>
                </div>
              </div>
              <div className="p-3 bg-adamant-box-dark rounded-lg">
                <div className="text-sm font-medium mb-2">
                  Example Query with Template Variables:
                </div>
                <pre className="text-xs text-adamant-text-box-secondary overflow-x-auto">
                  {`{
  "balance": {
    "address": "{{ADDRESS}}",
    "key": "{{VIEWING_KEY}}"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
