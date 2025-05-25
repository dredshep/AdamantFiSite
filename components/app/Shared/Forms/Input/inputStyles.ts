// Shared styling constants for input components
export const INPUT_STYLES = {
  // Main container for input components
  container:
    'flex flex-col gap-2.5 bg-adamant-app-input/30 backdrop-blur-sm rounded-lg p-4 border border-white/5 transition-all duration-200 hover:bg-adamant-app-input/40',

  // Header row with label and balance
  header: 'flex justify-between items-center',

  // Input row with field and token selector
  inputRow: 'flex items-center gap-4',

  // Main input field
  inputField:
    'w-full bg-transparent text-2xl font-light outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-500/50',

  // Token selector (clickable)
  tokenSelectorClickable:
    'flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 bg-adamant-app-selectTrigger min-w-max cursor-pointer hover:bg-adamant-app-selectTrigger/80 transition-colors',

  // Token selector (non-clickable)
  tokenSelectorStatic:
    'flex gap-3 items-center rounded-xl text-base font-medium py-1 px-3 bg-adamant-app-selectTrigger min-w-max',

  // Loading overlay
  loadingOverlay: 'absolute inset-0 flex items-center',
  loadingPlaceholder: 'h-8 w-32 bg-white/5 animate-pulse rounded',
} as const;

// Validation regex for amount inputs
export const AMOUNT_INPUT_REGEX = /^\d*\.?\d*$/;
