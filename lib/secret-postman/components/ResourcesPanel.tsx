'use client';

import { showToastOnce } from '@/utils/toast/toastManager';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, ChevronRight, Copy, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getDefaultResources, searchResources } from '../resources';
import { useSecretPostmanStore } from '../store/secretPostmanStore';
import { ResourceItem } from '../types';

interface ResourcesPanelProps {
  onResourceSelect: (resource: ResourceItem) => void;
  className?: string;
}

const categoryIcons = {
  tokens: '🪙',
  pairs: '🔄',
  staking: '📈',
  fees: '💰',
  contracts: '📝',
  custom: '⚙️',
} as const;

const categoryNames = {
  tokens: 'Tokens',
  pairs: 'Liquidity Pairs',
  staking: 'Staking Contracts',
  fees: 'Fee Configuration',
  contracts: 'System Contracts',
  custom: 'Custom Resources',
} as const;

export default function ResourcesPanel({ onResourceSelect, className }: ResourcesPanelProps) {
  const { customResources, addCustomResource, removeCustomResource } = useSecretPostmanStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(['tokens', 'contracts'])
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newResource, setNewResource] = useState({
    name: '',
    description: '',
    value: '',
    templateVariable: '',
    category: 'custom' as const,
  });

  // Combine default and custom resources
  const allResources = useMemo(() => {
    return [...getDefaultResources(), ...customResources];
  }, [customResources]);

  // Filter resources based on search
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return allResources;
    return searchResources(searchQuery, allResources);
  }, [searchQuery, allResources]);

  // Group filtered resources by category
  const groupedResources = useMemo(() => {
    const grouped: Record<string, ResourceItem[]> = {};
    filteredResources.forEach((resource) => {
      if (!grouped[resource.category]) {
        grouped[resource.category] = [];
      }
      grouped[resource.category]!.push(resource);
    });
    return grouped;
  }, [filteredResources]);

  const toggleCategory = (category: string) => {
    const newOpenCategories = new Set(openCategories);
    if (newOpenCategories.has(category)) {
      newOpenCategories.delete(category);
    } else {
      newOpenCategories.add(category);
    }
    setOpenCategories(newOpenCategories);
  };

  const handleResourceClick = (resource: ResourceItem) => {
    onResourceSelect(resource);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToastOnce(`copy-${label}`, `Copied ${label} to clipboard`, 'success');
    } catch (_error) {
      showToastOnce('copy-error', 'Failed to copy to clipboard', 'error');
    }
  };

  const handleAddResource = () => {
    if (!newResource.name || !newResource.value || !newResource.templateVariable) {
      showToastOnce('add-resource-validation', 'Please fill in all required fields', 'error');
      return;
    }

    addCustomResource(newResource);
    setNewResource({
      name: '',
      description: '',
      value: '',
      templateVariable: '',
      category: 'custom',
    });
    setShowAddDialog(false);
    showToastOnce('resource-added', 'Custom resource added', 'success');
  };

  return (
    <div
      className={`bg-adamant-box-regular rounded-xl border border-adamant-box-border flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-adamant-box-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-adamant-text-box-main">Resources</h3>
          <Dialog.Root open={showAddDialog} onOpenChange={setShowAddDialog}>
            <Dialog.Trigger asChild>
              <button className="p-1.5 text-adamant-accentText hover:text-adamant-accentText/80 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
              <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-adamant-box-regular rounded-xl border border-adamant-box-border p-6 w-full max-w-md">
                <Dialog.Title className="text-lg font-semibold text-adamant-text-box-main mb-4">
                  Add Custom Resource
                </Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newResource.name}
                      onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                      className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                      placeholder="e.g., My Custom Contract"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                      Template Variable *
                    </label>
                    <input
                      type="text"
                      value={newResource.templateVariable}
                      onChange={(e) =>
                        setNewResource({ ...newResource, templateVariable: e.target.value })
                      }
                      className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                      placeholder="e.g., MY_CONTRACT_ADDRESS"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                      Value *
                    </label>
                    <input
                      type="text"
                      value={newResource.value}
                      onChange={(e) => setNewResource({ ...newResource, value: e.target.value })}
                      className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                      placeholder="e.g., secret1abc123..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-adamant-text-box-secondary mb-1">
                      Description
                    </label>
                    <textarea
                      value={newResource.description}
                      onChange={(e) =>
                        setNewResource({ ...newResource, description: e.target.value })
                      }
                      className="w-full bg-adamant-app-input rounded-lg p-3 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Dialog.Close asChild>
                    <button className="flex-1 bg-adamant-button-form-secondary text-adamant-button-form-secondary border border-adamant-box-border px-4 py-2 rounded-lg font-medium hover:bg-adamant-app-boxHighlight transition-colors">
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleAddResource}
                    className="flex-1 bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark text-black font-bold hover:from-adamant-gradientDark hover:to-adamant-gradientBright transition-all duration-300 px-4 py-2 rounded-lg"
                  >
                    Add Resource
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-adamant-text-box-secondary" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-adamant-app-input rounded-lg pl-10 pr-4 py-2 text-adamant-text-form-main border border-white/5 focus:border-adamant-accentText/30 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Resource Categories */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {Object.entries(groupedResources).map(([category, resources]) => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="flex items-center justify-between w-full p-2 text-left hover:bg-white/5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                {openCategories.has(category) ? (
                  <ChevronDown className="h-4 w-4 text-adamant-text-box-secondary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-adamant-text-box-secondary" />
                )}
                <span className="text-lg">
                  {categoryIcons[category as keyof typeof categoryIcons] || '📁'}
                </span>
                <span className="text-sm font-medium text-adamant-text-box-main">
                  {categoryNames[category as keyof typeof categoryNames] || category}
                </span>
                <span className="text-xs text-adamant-text-box-secondary">
                  ({resources.length})
                </span>
              </div>
            </button>

            {openCategories.has(category) && (
              <div className="pl-6 space-y-1">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="group flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    onClick={() => handleResourceClick(resource)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-adamant-text-box-main truncate">
                          {resource.name}
                        </div>
                        {resource.metadata?.type === 'template' && (
                          <span className="px-1.5 py-0.5 text-xs bg-adamant-accentText/20 text-adamant-accentText rounded border border-adamant-accentText/30">
                            Template
                          </span>
                        )}
                      </div>
                      {resource.description && (
                        <div className="text-xs text-adamant-text-box-secondary truncate">
                          {resource.description}
                        </div>
                      )}
                      <div className="text-xs text-adamant-accentText/70 font-mono">
                        {resource.metadata?.type === 'template'
                          ? `{{${resource.templateVariable}}}`
                          : resource.templateVariable}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void copyToClipboard(resource.value, resource.name);
                        }}
                        className="p-1 text-adamant-text-box-secondary hover:text-adamant-accentText transition-colors"
                        title="Copy value"
                      >
                        <Copy className="h-3 w-3" />
                      </button>

                      {resource.category === 'custom' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomResource(resource.id);
                            showToastOnce('resource-removed', 'Custom resource removed', 'success');
                          }}
                          className="p-1 text-adamant-text-box-secondary hover:text-red-400 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(groupedResources).length === 0 && (
          <div className="text-center py-8 text-adamant-text-box-secondary">
            {searchQuery ? 'No resources found matching your search.' : 'No resources available.'}
          </div>
        )}
      </div>
    </div>
  );
}
