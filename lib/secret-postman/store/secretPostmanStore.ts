import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  ExportData,
  NetworkConfig,
  PostmanState,
  QueryHistory,
  QueryRequest,
  QueryResponse,
  ResourceItem,
} from '../types';
import { generateId, getDefaultNetworkConfig } from '../utils';

// No longer need local CurrentQueryState if types.ts is authoritative and imported PostmanState uses it.

interface PostmanActions {
  // Query management
  setContractAddress: (address: string) => void;
  setCodeHash: (codeHash: string) => void;
  setQuery: (query: Record<string, unknown>) => void;
  setRawQuery: (rawQuery: string) => void;
  setQueryMode: (mode: 'structured' | 'raw') => void;
  setQueryName: (name: string) => void;
  setQueryDescription: (description: string) => void;
  setHeight: (height: number | string | undefined) => void;
  setAutoFetchHeight: (autoFetch: boolean) => void;
  resetCurrentQuery: () => void;

  // For structured editor input - NEW ACTIONS
  setPendingStructuredInput: (
    itemId: string,
    textToInsert: string,
    selectionStart: number,
    selectionEnd: number
  ) => void;
  clearPendingStructuredInput: () => void;

  // Insert text at cursor position helpers
  insertIntoContractAddress: (text: string, start: number, end: number) => void;
  insertIntoCodeHash: (text: string, start: number, end: number) => void;
  insertIntoQueryName: (text: string, start: number, end: number) => void;
  insertIntoQueryDescription: (text: string, start: number, end: number) => void;
  insertIntoRawQuery: (text: string, start: number, end: number) => void;

  // Network management
  setNetworkConfig: (config: NetworkConfig) => void;

  // History management
  addToHistory: (request: QueryRequest, response: QueryResponse) => void;
  removeFromHistory: (historyId: string) => void;
  clearHistory: () => void;
  selectHistoryItem: (historyId: string | null) => void;
  loadFromHistory: (historyId: string) => void;

  // UI state
  setIsExecuting: (isExecuting: boolean) => void;
  setShowResources: (show: boolean) => void;

  // Resources management
  addCustomResource: (resource: Omit<ResourceItem, 'id'>) => void;
  removeCustomResource: (resourceId: string) => void;
  updateCustomResource: (resourceId: string, updates: Partial<ResourceItem>) => void;

  // Settings
  updateSettings: (updates: Partial<PostmanState['settings']>) => void;

  // Export/Import
  exportData: (options?: {
    includeHistory?: boolean;
    includeResources?: boolean;
    includeNetworkConfig?: boolean;
    includeSettings?: boolean;
  }) => ExportData;
  importData: (
    data: ExportData,
    options?: {
      replaceHistory?: boolean;
      replaceResources?: boolean;
      replaceNetworkConfig?: boolean;
      replaceSettings?: boolean;
    }
  ) => void;
}

type PostmanStore = PostmanState & PostmanActions;

const initialState: PostmanState = {
  currentQuery: {
    contractAddress: '',
    codeHash: '',
    query: {},
    rawQuery: '{}',
    mode: 'structured',
    name: '',
    description: '',
    height: undefined,
    autoFetchHeight: false,
    pendingStructuredInput: null,
  },
  networkConfig: getDefaultNetworkConfig(),
  history: [],
  isExecuting: false,
  selectedHistoryId: null,
  showResources: true,
  customResources: [],
  settings: {
    autoSave: true,
    saveErrors: true,
    maxHistoryItems: 100,
  },
};

export const useSecretPostmanStore = create<PostmanStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Query management
      setContractAddress: (address) =>
        set((state) => ({
          currentQuery: { ...state.currentQuery, contractAddress: address },
        })),

      setCodeHash: (codeHash) =>
        set((state) => ({
          currentQuery: { ...state.currentQuery, codeHash },
        })),

      setQuery: (query) =>
        set((state) => {
          const newRawQuery = JSON.stringify(query, null, 2);
          // Only update rawQuery if it has actually changed
          if (state.currentQuery.rawQuery !== newRawQuery) {
            return {
              currentQuery: {
                ...state.currentQuery,
                query,
                rawQuery: newRawQuery,
              },
            };
          }
          // Otherwise, just update the query object
          return {
            currentQuery: {
              ...state.currentQuery,
              query,
            },
          };
        }),

      setRawQuery: (rawQuery) =>
        set((state) => ({
          currentQuery: { ...state.currentQuery, rawQuery },
        })),

      setQueryMode: (mode) =>
        set((state) => ({
          currentQuery: { ...state.currentQuery, mode },
        })),

      setQueryName: (name) =>
        set((state) => ({
          currentQuery: { ...state.currentQuery, name },
        })),

      setQueryDescription: (description) =>
        set((state) => ({
          currentQuery: { ...state.currentQuery, description },
        })),

      setHeight: (height) =>
        set((state) => ({
          currentQuery: {
            ...state.currentQuery,
            ...(height !== undefined ? { height } : {}),
          },
        })),

      setAutoFetchHeight: (autoFetch) =>
        set((state) => ({
          currentQuery: { ...state.currentQuery, autoFetchHeight: autoFetch },
        })),

      resetCurrentQuery: () =>
        set((state) => ({
          currentQuery: {
            // Reset to initial values, which should now conform to the updated type
            ...initialState.currentQuery,
            mode: state.currentQuery.mode, // Keep the current mode
            // Explicitly ensure all fields are reset as per initial state
            contractAddress: initialState.currentQuery.contractAddress,
            codeHash: initialState.currentQuery.codeHash,
            query: initialState.currentQuery.query,
            rawQuery: initialState.currentQuery.rawQuery,
            name: initialState.currentQuery.name || '', // Ensure name is always string
            description: initialState.currentQuery.description || '', // Ensure description is always string
            height: initialState.currentQuery.height,
            autoFetchHeight: initialState.currentQuery.autoFetchHeight || false, // Ensure boolean
            pendingStructuredInput: null, // Reset this specifically
          },
        })),

      // For structured editor input - NEW ACTION IMPLEMENTATIONS
      setPendingStructuredInput: (itemId, textToInsert, selectionStart, selectionEnd) =>
        set((state) => ({
          currentQuery: {
            ...state.currentQuery,
            pendingStructuredInput: {
              itemId,
              textToInsert,
              selectionStart,
              selectionEnd,
              timestamp: Date.now(),
            },
          },
        })),

      clearPendingStructuredInput: () =>
        set((state) => ({
          currentQuery: {
            ...state.currentQuery,
            pendingStructuredInput: null,
          },
        })),

      // Insert text at cursor position helpers
      insertIntoContractAddress: (text, start, end) =>
        set((state) => ({
          currentQuery: {
            ...state.currentQuery,
            contractAddress:
              state.currentQuery.contractAddress.slice(0, start) +
              text +
              state.currentQuery.contractAddress.slice(end),
          },
        })),

      insertIntoCodeHash: (text, start, end) =>
        set((state) => ({
          currentQuery: {
            ...state.currentQuery,
            codeHash:
              state.currentQuery.codeHash.slice(0, start) +
              text +
              state.currentQuery.codeHash.slice(end),
          },
        })),

      insertIntoQueryName: (text, start, end) =>
        set((state) => ({
          currentQuery: {
            ...state.currentQuery,
            name:
              state.currentQuery.name.slice(0, start) + text + state.currentQuery.name.slice(end),
          },
        })),

      insertIntoQueryDescription: (text, start, end) =>
        set((state) => ({
          currentQuery: {
            ...state.currentQuery,
            description:
              state.currentQuery.description.slice(0, start) +
              text +
              state.currentQuery.description.slice(end),
          },
        })),

      insertIntoRawQuery: (text, start, end) =>
        set((state) => ({
          currentQuery: {
            ...state.currentQuery,
            rawQuery:
              state.currentQuery.rawQuery.slice(0, start) +
              text +
              state.currentQuery.rawQuery.slice(end),
          },
        })),

      // Network management
      setNetworkConfig: (config) => set({ networkConfig: config }),

      // History management
      addToHistory: (request, response) =>
        set((state) => {
          const newHistory: QueryHistory = { request, response };
          const updatedHistory = [newHistory, ...state.history];

          // Respect max history items setting
          const trimmedHistory = updatedHistory.slice(0, state.settings.maxHistoryItems);

          return { history: trimmedHistory };
        }),

      removeFromHistory: (historyId) =>
        set((state) => ({
          history: state.history.filter((item) => item.request.id !== historyId),
          selectedHistoryId: state.selectedHistoryId === historyId ? null : state.selectedHistoryId,
        })),

      clearHistory: () => set({ history: [], selectedHistoryId: null }),

      selectHistoryItem: (historyId) => set({ selectedHistoryId: historyId }),

      loadFromHistory: (historyId) => {
        const state = get();
        const historyItem = state.history.find((item) => item.request.id === historyId);
        if (historyItem) {
          set({
            currentQuery: {
              contractAddress: historyItem.request.contractAddress,
              codeHash: historyItem.request.codeHash || '',
              query: historyItem.request.query,
              rawQuery: JSON.stringify(historyItem.request.query, null, 2),
              mode: state.currentQuery.mode, // Keep current mode
              name: historyItem.request.name || '',
              description: historyItem.request.description || '',
              ...(historyItem.request.height !== undefined
                ? { height: historyItem.request.height }
                : {}),
              autoFetchHeight: historyItem.request.autoFetchHeight || false,
            },
            networkConfig: historyItem.request.networkConfig,
            selectedHistoryId: historyId,
          });
        }
      },

      // UI state
      setIsExecuting: (isExecuting) => set({ isExecuting }),

      setShowResources: (show) => set({ showResources: show }),

      // Resources management
      addCustomResource: (resource) =>
        set((state) => ({
          customResources: [...state.customResources, { ...resource, id: generateId() }],
        })),

      removeCustomResource: (resourceId) =>
        set((state) => ({
          customResources: state.customResources.filter((r) => r.id !== resourceId),
        })),

      updateCustomResource: (resourceId, updates) =>
        set((state) => ({
          customResources: state.customResources.map((r) =>
            r.id === resourceId ? { ...r, ...updates } : r
          ),
        })),

      // Settings
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      // Export/Import
      exportData: (options = {}) => {
        const state = get();
        const {
          includeHistory = true,
          includeResources = true,
          includeNetworkConfig = true,
          includeSettings = true,
        } = options;

        const exportData: ExportData = {
          version: '1.0.0',
          timestamp: Date.now(),
        };

        if (includeHistory) {
          exportData.history = state.history;
        }

        if (includeResources) {
          exportData.customResources = state.customResources;
        }

        if (includeNetworkConfig) {
          exportData.networkConfig = state.networkConfig;
        }

        if (includeSettings) {
          exportData.settings = state.settings;
        }

        return exportData;
      },

      importData: (data, options = {}) => {
        const state = get();
        const {
          replaceHistory = false,
          replaceResources = false,
          replaceNetworkConfig = false,
          replaceSettings = false,
        } = options;

        const updates: Partial<PostmanState> = {};

        if (data.history) {
          updates.history = replaceHistory ? data.history : [...data.history, ...state.history];
        }

        if (data.customResources) {
          updates.customResources = replaceResources
            ? data.customResources
            : [...data.customResources, ...state.customResources];
        }

        if (data.networkConfig && replaceNetworkConfig) {
          updates.networkConfig = data.networkConfig;
        }

        if (data.settings && replaceSettings) {
          updates.settings = { ...state.settings, ...data.settings };
        }

        set((state) => ({ ...state, ...updates }));
      },
    }),
    {
      name: 'secret-postman-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields
      partialize: (state) => ({
        history: state.history,
        customResources: state.customResources,
        networkConfig: state.networkConfig,
        settings: state.settings,
        showResources: state.showResources,
      }),
    }
  )
);
