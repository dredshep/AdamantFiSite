// Main index file for Keplr library

// Export components
export { default as ErrorBoundary } from './components/ErrorBoundary';
export { default as KeplrErrorDisplay } from './components/KeplrErrorDisplay';

// Export util functions and types
export {
  connectKeplr,
  debugKeplrQuery,
  enhancedKeplrErrorLogging,
  formatKeplrErrorDetails,
  getKeplrError,
  getKeplrErrorSuggestions,
  getKeplrStatus,
  isKeplrErrorOfType,
  KeplrErrorType,
  validateKeplrEnvironment,
  type EnhancedKeplrError,
  type KeplrDebugInfo,
} from './utils';

// Export incentives functions
export * from './incentives';
