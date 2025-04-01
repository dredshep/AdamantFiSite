# Keplr Integration Library

This library provides a comprehensive set of utilities, hooks, and components for seamless integration with the Keplr wallet in your Secret Network dApp.

## Overview

The library is organized into the following categories:

```
lib/keplr/
├── components/     # React components for Keplr integration
├── hooks/          # React hooks for Keplr state management
├── incentives/     # Secret Network incentive contract interactions
├── utils/          # Utility functions for Keplr interactions
├── index.ts        # Main export file
└── README.md       # This file
```

## Key Features

### Enhanced Error Handling

The library provides advanced error handling for Keplr-related operations through:

- **`debugKeplrQuery`**: A wrapper function that captures detailed error information from Keplr interactions.
- **`enhancedKeplrErrorLogging`**: Captures and enhances error information with additional context.
- **`KeplrErrorDisplay`**: A React component that shows user-friendly error messages and troubleshooting steps.
- **`ErrorBoundary`**: A React component that catches and displays errors in your components.

### Usage Example

```tsx
import { debugKeplrQuery, KeplrErrorDisplay, ErrorBoundary } from '@/lib/keplr';

// Wrap your components with the ErrorBoundary
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Use debugKeplrQuery to enhance error handling
const getBalance = async () => {
  try {
    const result = await debugKeplrQuery(
      async () => {
        // Your Keplr interaction code
        const balance = await secretjs.query.compute.queryContract(...);
        return balance;
      },
      { operation: 'getBalance', context: 'additional info' }
    );
    return result;
  } catch (err) {
    // Enhanced error is available here
    return <KeplrErrorDisplay error={err} />;
  }
};
```

## Components

### `KeplrErrorDisplay`

A component that displays user-friendly error messages for Keplr-related errors:

- Shows appropriate troubleshooting steps based on error type
- Provides detailed technical information for developers
- Shows enhanced error information when using `debugKeplrQuery`

### `ErrorBoundary`

A React error boundary component that catches errors in its child components:

- Prevents the entire app from crashing
- Shows detailed error information
- Works especially well with Keplr-related errors

## Utilities

### `debugKeplrQuery`

A wrapper function for Keplr operations that enhances error information:

```tsx
const result = await debugKeplrQuery(
  async () => {
    // Your Keplr operation
    return result;
  },
  {
    operation: 'operationName',
    // Additional context information
    anyKey: 'anyValue',
  }
);
```

### Error Type Detection

The library includes utilities to detect and categorize Keplr errors:

- `KeplrErrorType` enum for categorizing errors
- `isKeplrErrorOfType` function to check error types
- `getKeplrErrorSuggestions` function to get user-friendly suggestions

## Testing

You can test the Keplr integration using the test page at `/incentives-test`:

- Connect to Keplr
- Test various incentive operations
- See enhanced error handling in action

## Next Steps

- Add comprehensive type definitions
- Add more examples and documentation
- Add unit tests for utility functions
- Enhance the error boundary with more fallback options

## Structure

- `utils/`: Core utility functions for Keplr wallet integration

  - Error handling utilities
  - Connection status checking
  - Environment validation

- `hooks/`: React hooks for Keplr integration

  - `useKeplrDiagnostics`: Comprehensive hook for diagnostics and error handling

- `components/`: React components for Keplr integration

  - `ErrorBoundary`: Error boundary for catching React errors
  - `KeplrErrorDisplay`: Component for displaying Keplr errors with troubleshooting

- `incentives/`: LP token staking and incentives utilities

  - Functions for staking, unstaking, and claiming rewards
  - Functions for querying staked balances and rewards

## Integration with NextJS

The incentives test page is located in the main pages directory for NextJS rendering:

- `/pages/incentives-test.tsx`: Testing dashboard for incentives functionality

## Usage

Import from the central index file:

```tsx
import { KeplrErrorDisplay, ErrorBoundary, useKeplrDiagnostics } from '@/lib/keplr';
```

Or import specific modules directly:

```tsx
import { stakeLP, unstakeLP } from '@/lib/keplr/incentives';
```
