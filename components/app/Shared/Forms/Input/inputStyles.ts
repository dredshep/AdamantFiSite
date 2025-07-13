// Shared styling constants for input components
export const INPUT_STYLES = {
  // Main container for input components - Updated with new border and full opacity
  container:
    'flex flex-col gap-2.5 bg-adamant-app-input backdrop-blur-sm rounded-lg p-4 border border-adamant-box-inputBorder transition-all duration-200 hover:bg-adamant-app-input/90',

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

  // Additional utility styles for common patterns

  // Info/details containers (like swap details, voice transcript, etc.)
  infoContainer:
    'bg-adamant-app-input backdrop-blur-sm rounded-lg p-4 border border-adamant-box-inputBorder transition-all duration-200 hover:bg-adamant-app-input/90',

  // Small input fields (like slippage input)
  smallInput:
    'bg-adamant-app-input backdrop-blur-sm border border-adamant-box-inputBorder rounded-lg px-2.5 py-1 text-right outline-none transition-all duration-200 hover:bg-adamant-app-input/90 focus:bg-adamant-app-input/90 focus:border-white/10',

  // Button containers with input styling
  buttonContainer:
    'bg-adamant-app-input backdrop-blur-sm rounded-lg border border-adamant-box-inputBorder transition-all duration-200 hover:bg-adamant-app-input/90',

  // Note: Size-specific loading placeholders moved to @/components/app/Shared/LoadingPlaceholder
  // for general use outside of input contexts

  // Form button styling (for FormButton component)
  formButton:
    'w-full py-3 px-4 bg-adamant-app-input backdrop-blur-sm rounded-lg border border-adamant-box-inputBorder text-white font-medium transition-all duration-200 hover:enabled:bg-adamant-app-input/90 hover:enabled:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

// Validation regex for amount inputs
export const AMOUNT_INPUT_REGEX = /^\d*\.?\d*$/;
