'use client';

import { showToastOnce } from '@/utils/toast/toastManager';
import * as Dialog from '@radix-ui/react-dialog';
import { Calendar, Copy, Download, History, Play, Search, Trash2, Upload } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { useSecretPostmanStore } from '../store/secretPostmanStore';
import { ExportData, QueryHistory } from '../types';

interface HistoryPanelProps {
  onExecuteFromHistoryAction: (historyItem: QueryHistory) => void;
  className?: string;
}

export default function HistoryPanel({ onExecuteFromHistoryAction, className }: HistoryPanelProps) {
  const { history, removeFromHistory, clearHistory, addToHistory } = useSecretPostmanStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeHistory: true,
    includeResources: false,
    includeNetworkConfig: false,
    includeSettings: false,
  });
  const [importOptions, setImportOptions] = useState({
    replaceHistory: false,
    replaceResources: false,
    replaceNetworkConfig: false,
    replaceSettings: false,
  });
  const [importJsonText, setImportJsonText] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter history based on search
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;

    return history.filter((item) => {
      const request = item.request;
      const searchText = searchQuery.toLowerCase();

      return (
        request.contractAddress.toLowerCase().includes(searchText) ||
        (request.name && request.name.toLowerCase().includes(searchText)) ||
        (request.description && request.description.toLowerCase().includes(searchText)) ||
        JSON.stringify(request.query).toLowerCase().includes(searchText)
      );
    });
  }, [history, searchQuery]);

  const handleExport = () => {
    if (selectedItems.size === 0) {
      showToastOnce('export-validation', 'Please select at least one item to export', 'warning');
      return;
    }

    const exportData: ExportData = {
      version: '1.0',
      timestamp: Date.now(),
      history: Array.from(selectedItems)
        .map((id) => history.find((item) => item.request.id === id))
        .filter((item): item is QueryHistory => item !== undefined),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secret-postman-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToastOnce('export-success', `Exported ${selectedItems.size} queries`, 'success');
    setSelectedItems(new Set());
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importData = JSON.parse(text) as ExportData;

        if (!importData.history || !Array.isArray(importData.history)) {
          throw new Error('Invalid export file format');
        }

        let importedCount = 0;
        importData.history.forEach((query) => {
          // Check if query already exists (avoid duplicates)
          const exists = history.some((h) => h.request.id === query.request.id);
          if (!exists) {
            addToHistory(query.request, query.response);
            importedCount++;
          }
        });

        showToastOnce('import-success', `Imported ${importedCount} new queries`, 'success');
      } catch (_error) {
        showToastOnce(
          'import-error',
          'Failed to import queries. Please check the file format.',
          'error'
        );
      }
    };

    reader.readAsText(file);
    // Reset the input
    event.target.value = '';
  };

  const handleDialogImport = () => {
    try {
      const importData = JSON.parse(importJsonText) as ExportData;

      if (!importData.history || !Array.isArray(importData.history)) {
        throw new Error('Invalid export file format');
      }

      let importedCount = 0;
      importData.history.forEach((query) => {
        // Check if query already exists (avoid duplicates)
        const exists = history.some((h) => h.request.id === query.request.id);
        if (!exists) {
          addToHistory(query.request, query.response);
          importedCount++;
        }
      });

      showToastOnce('import-success', `Imported ${importedCount} new queries`, 'success');
      setShowImportDialog(false);
      setImportJsonText('');
    } catch (_error) {
      showToastOnce(
        'import-error',
        'Failed to import queries. Please check the file format.',
        'error'
      );
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map((item) => item.request.id)));
    }
  };

  return (
    <div
      className={`bg-adamant-box-regular rounded-xl border border-adamant-box-border flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-adamant-box-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-adamant-accentText" />
            <h3 className="text-lg font-semibold text-adamant-text-box-main">History</h3>
            <span className="text-sm text-adamant-text-box-secondary">({history.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Export */}
            <Dialog.Root open={showExportDialog} onOpenChange={setShowExportDialog}>
              <Dialog.Trigger asChild>
                <button
                  className="p-1.5 text-adamant-text-box-secondary hover:text-adamant-accentText transition-colors"
                  title="Export data"
                >
                  <Download className="h-4 w-4" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-adamant-box-regular rounded-xl border border-adamant-box-border p-6 w-full max-w-md">
                  <Dialog.Title className="text-lg font-semibold text-adamant-text-box-main mb-4">
                    Export Data
                  </Dialog.Title>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeHistory}
                        onChange={(e) =>
                          setExportOptions({ ...exportOptions, includeHistory: e.target.checked })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-adamant-text-box-main">Include History</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeResources}
                        onChange={(e) =>
                          setExportOptions({ ...exportOptions, includeResources: e.target.checked })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-adamant-text-box-main">
                        Include Custom Resources
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeNetworkConfig}
                        onChange={(e) =>
                          setExportOptions({
                            ...exportOptions,
                            includeNetworkConfig: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-adamant-text-box-main">
                        Include Network Config
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeSettings}
                        onChange={(e) =>
                          setExportOptions({ ...exportOptions, includeSettings: e.target.checked })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-adamant-text-box-main">Include Settings</span>
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Dialog.Close asChild>
                      <button className="flex-1 bg-adamant-button-form-secondary text-adamant-button-form-secondary border border-adamant-box-border px-4 py-2 rounded-lg font-medium hover:bg-adamant-app-boxHighlight transition-colors">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      onClick={handleExport}
                      className="flex-1 bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark text-black font-bold hover:from-adamant-gradientDark hover:to-adamant-gradientBright transition-all duration-300 px-4 py-2 rounded-lg"
                    >
                      Export
                    </button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            {/* Import */}
            <Dialog.Root open={showImportDialog} onOpenChange={setShowImportDialog}>
              <Dialog.Trigger asChild>
                <button
                  className="p-1.5 text-adamant-text-box-secondary hover:text-adamant-accentText transition-colors"
                  title="Import data"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-adamant-box-regular rounded-xl border border-adamant-box-border p-6 w-full max-w-lg">
                  <Dialog.Title className="text-lg font-semibold text-adamant-text-box-main mb-4">
                    Import Data
                  </Dialog.Title>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-adamant-text-box-secondary mb-2">
                        Import from file
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="block w-full text-sm text-adamant-text-box-main file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-adamant-box-dark file:text-adamant-text-box-main hover:file:bg-adamant-box-light"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-adamant-text-box-secondary mb-2">
                        Or paste JSON
                      </label>
                      <textarea
                        value={importJsonText}
                        onChange={(e) => setImportJsonText(e.target.value)}
                        placeholder="Paste exported JSON here..."
                        className="w-full h-32 bg-adamant-app-input rounded-lg p-3 text-sm font-mono text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm font-medium text-adamant-text-box-secondary">
                        Import Options
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importOptions.replaceHistory}
                          onChange={(e) =>
                            setImportOptions({ ...importOptions, replaceHistory: e.target.checked })
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-adamant-text-box-main">Replace History</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importOptions.replaceResources}
                          onChange={(e) =>
                            setImportOptions({
                              ...importOptions,
                              replaceResources: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-adamant-text-box-main">
                          Replace Custom Resources
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importOptions.replaceNetworkConfig}
                          onChange={(e) =>
                            setImportOptions({
                              ...importOptions,
                              replaceNetworkConfig: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-adamant-text-box-main">
                          Replace Network Config
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importOptions.replaceSettings}
                          onChange={(e) =>
                            setImportOptions({
                              ...importOptions,
                              replaceSettings: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-adamant-text-box-main">Replace Settings</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Dialog.Close asChild>
                      <button className="flex-1 bg-adamant-button-form-secondary text-adamant-button-form-secondary border border-adamant-box-border px-4 py-2 rounded-lg font-medium hover:bg-adamant-app-boxHighlight transition-colors">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button
                      onClick={handleDialogImport}
                      disabled={!importJsonText.trim()}
                      className="flex-1 bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark text-black font-bold hover:from-adamant-gradientDark hover:to-adamant-gradientBright transition-all duration-300 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Import
                    </button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            {/* Clear History */}
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all history?')) {
                    clearHistory();
                    showToastOnce('history-cleared', 'History cleared', 'success');
                  }
                }}
                className="p-1.5 text-adamant-text-box-secondary hover:text-red-400 transition-colors"
                title="Clear all history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-adamant-text-box-secondary" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-adamant-app-input rounded-lg pl-10 pr-4 py-2 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
          />
        </div>

        {/* Selection Controls */}
        {filteredHistory.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={selectAll}
              className="text-adamant-accentText hover:text-adamant-accentText/80 transition-colors"
            >
              {selectedItems.size === filteredHistory.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-adamant-text-box-secondary">
              {selectedItems.size} of {filteredHistory.length} selected
            </span>
          </div>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-adamant-text-box-secondary">
            {searchQuery ? 'No history items found matching your search.' : 'No query history yet.'}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredHistory.map((item) => (
              <div
                key={item.request.id}
                className={`group p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedItems.has(item.request.id)
                    ? 'bg-adamant-box-dark border-adamant-accentText/30'
                    : 'bg-adamant-box-dark/50 border-transparent hover:bg-adamant-box-dark hover:border-white/10'
                }`}
                onClick={() => {
                  toggleItemSelection(item.request.id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.request.id)}
                        onChange={() => toggleItemSelection(item.request.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-adamant-box-border text-adamant-accentText focus:ring-adamant-accentText/30"
                      />
                      <div className="text-sm font-medium text-adamant-text-box-main truncate">
                        {item.request.name || 'Untitled Query'}
                      </div>
                      <div className="text-xs text-adamant-text-box-secondary flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTimestamp(item.request.timestamp)}
                      </div>
                    </div>

                    <div className="text-xs text-adamant-text-box-secondary truncate">
                      {item.request.contractAddress}
                    </div>

                    {item.request.description && (
                      <div className="text-xs text-adamant-text-box-secondary/70 truncate mt-1">
                        {item.request.description}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-adamant-text-box-secondary">
                      <span>{formatExecutionTime(item.response.executionTime)}</span>
                      <span>•</span>
                      <span>{item.request.networkConfig.chainId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExecuteFromHistoryAction(item);
                      }}
                      className="p-1 text-adamant-text-box-secondary hover:text-adamant-accentText transition-colors"
                      title="Execute again"
                    >
                      <Play className="h-3 w-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void navigator.clipboard.writeText(JSON.stringify(item.request, null, 2));
                        showToastOnce(
                          `copy-request-${item.request.id}`,
                          'Request copied to clipboard',
                          'success'
                        );
                      }}
                      className="p-1 text-adamant-text-box-secondary hover:text-adamant-accentText transition-colors"
                      title="Copy request"
                    >
                      <Copy className="h-3 w-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.request.id);
                        showToastOnce(
                          `removed-${item.request.id}`,
                          'Query removed from history',
                          'success'
                        );
                      }}
                      className="p-1 text-adamant-text-box-secondary hover:text-red-400 transition-colors"
                      title="Remove from history"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
