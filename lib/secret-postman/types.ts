/**
 * Network configuration for Secret Network connections
 */
export interface NetworkConfig {
  chainId: string;
  lcdUrl: string;
  rpcUrl?: string;
  name?: string;
}

/**
 * Query request structure
 */
export interface QueryRequest {
  id: string;
  contractAddress: string;
  codeHash?: string;
  query: Record<string, unknown>;
  networkConfig: NetworkConfig;
  timestamp: number;
  name?: string;
  description?: string;
  height?: number | string;
  autoFetchHeight?: boolean;
}

/**
 * Query response structure
 */
export interface QueryResponse {
  id: string;
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: number;
  executionTime: number;
  networkUsed: NetworkConfig;
}

/**
 * Combined query history item
 */
export interface QueryHistory {
  request: QueryRequest;
  response: QueryResponse;
}

/**
 * Resource item for the resources panel
 */
export interface ResourceItem {
  id: string;
  category: 'tokens' | 'pairs' | 'staking' | 'fees' | 'contracts' | 'custom';
  name: string;
  description?: string;
  value: string;
  templateVariable: string;
  metadata?: Record<string, unknown>;
}

/**
 * Query editor mode
 */
export type QueryEditorMode = 'structured' | 'raw';

/**
 * Postman store state
 */
export interface PostmanState {
  // Current query being built
  currentQuery: {
    contractAddress: string;
    codeHash: string;
    query: Record<string, unknown>;
    rawQuery: string;
    mode: QueryEditorMode;
    name: string;
    description: string;
    height?: number | string | undefined;
    autoFetchHeight: boolean;
    pendingStructuredInput?: {
      itemId: string;
      textToInsert: string;
      selectionStart: number;
      selectionEnd: number;
      timestamp: number;
    } | null;
  };

  // Network configuration
  networkConfig: NetworkConfig;

  // Query history
  history: QueryHistory[];

  // UI state
  isExecuting: boolean;
  selectedHistoryId: string | null;
  showResources: boolean;

  // Resources
  customResources: ResourceItem[];

  // Settings
  settings: {
    autoSave: boolean;
    saveErrors: boolean;
    maxHistoryItems: number;
  };
}

/**
 * Export/import data structure
 */
export interface ExportData {
  version: string;
  timestamp: number;
  history?: QueryHistory[];
  customResources?: ResourceItem[];
  networkConfig?: NetworkConfig;
  settings?: PostmanState['settings'];
}

/**
 * Template variable context
 */
export interface TemplateContext {
  [key: string]: string | number | boolean;
}
