// Main index file for Keplr library

// Export components
export { default as ErrorBoundary } from './components/ErrorBoundary';
export { default as KeplrErrorDisplay } from './components/KeplrErrorDisplay';

// Export util functions and types
export {
  debugKeplrQuery,
  enhancedKeplrErrorLogging,
  formatKeplrErrorDetails,
  getKeplrErrorSuggestions,
  isKeplrErrorOfType,
  KeplrErrorType,
  type EnhancedKeplrError,
  type KeplrDebugInfo,
} from './utils';

// Export incentives functions
export * from './incentives';
