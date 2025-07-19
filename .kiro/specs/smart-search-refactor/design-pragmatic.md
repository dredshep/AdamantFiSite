# Pragmatic Design Document

## Overview

This is a focused, pragmatic refactor that addresses the immediate pain points of the 1022-line SmartSearchBox without over-engineering. The goal is to extract the most problematic parts into separate modules while keeping the existing structure mostly intact.

## Architecture

### Minimal Extraction Strategy

Instead of a full rewrite, we'll extract the heaviest, most problematic parts:

```
components/app/Global/SmartSearch/
├── SmartSearchBox.tsx                 # Main component (reduced to ~400 lines)
├── utils/
│   ├── commandParser.ts              # Extract the massive parseCommand function
│   ├── tokenMatcher.ts               # Extract findTokenByText logic
│   ├── suggestionGenerator.ts        # Extract the giant suggestions useMemo
│   └── voiceProcessor.ts             # Extract voice processing logic
└── constants/
    ├── actionKeywords.ts             # Move ACTION_KEYWORDS and mappings
    └── socialLinks.ts                # Move SOCIAL_LINKS
```

This keeps 80% of the existing code structure while solving the main problems:
1. The giant `parseCommand` function (200+ lines)
2. The massive `suggestions` useMemo (300+ lines) 
3. Voice processing complexity
4. Constants scattered throughout

## Components and Interfaces

### Keep Existing Interfaces
We'll keep all the existing interfaces (`ParsedCommand`, `SearchSuggestion`, etc.) to avoid breaking changes.

### Extract Heavy Functions

```typescript
// utils/commandParser.ts
export function parseCommand(
  input: string,
  findTokenByText: (text: string) => ConfigToken | null,
  detectAction: (query: string) => keyof typeof ACTION_KEYWORDS | null
): ParsedCommand {
  // Move the entire parseCommand logic here
  // Keep the same signature and behavior
}
```

```typescript
// utils/suggestionGenerator.ts
export function generateSuggestions(
  query: string,
  parseCommand: (input: string) => ParsedCommand,
  router: NextRouter,
  executeCommand: (command: ParsedCommand) => Promise<void>
): SearchSuggestion[] {
  // Move the entire suggestions useMemo logic here
  // Keep the same behavior
}
```

```typescript
// utils/tokenMatcher.ts
export function findTokenByText(text: string): ConfigToken | null {
  // Move the token matching logic here
  // Keep exact same behavior
}

export function detectAction(query: string): keyof typeof ACTION_KEYWORDS | null {
  // Move action detection here
}
```

### Simplified Main Component

```typescript
// SmartSearchBox.tsx (simplified)
const SmartSearchBox: React.FC<SmartSearchBoxProps> = ({ ... }) => {
  // Keep all existing state
  const [query, setQuery] = useState('');
  // ... all other state

  // Use extracted utilities
  const suggestions = useMemo(() => 
    generateSuggestions(query, parseCommand, router, executeCommand),
    [query, router, executeCommand]
  );

  // Keep all existing handlers and effects
  // Just delegate heavy lifting to utils

  // Keep exact same JSX structure
  return (
    // ... existing JSX
  );
};
```

## Data Models

Keep all existing data models and types. No changes to interfaces to avoid breaking anything.

## Error Handling

Keep existing error handling patterns. The extracted functions will maintain the same error behavior.

## Testing Strategy

### Focus on Extracted Utils

Since we're extracting the most complex logic, we can now easily unit test:

```typescript
// __tests__/utils/commandParser.test.ts
describe('parseCommand', () => {
  it('should parse swap commands correctly', () => {
    const result = parseCommand('swap 100 sSCRT for USDC', mockFindToken, mockDetectAction);
    expect(result.action).toBe('swap');
    expect(result.amount).toBe('100');
  });
});
```

```typescript
// __tests__/utils/tokenMatcher.test.ts
describe('findTokenByText', () => {
  it('should find exact symbol matches', () => {
    const result = findTokenByText('sSCRT');
    expect(result?.symbol).toBe('sSCRT');
  });
});
```

The main component can keep integration tests, but now the complex logic is unit testable.

## Migration Strategy

### Phase 1: Extract Constants (30 minutes)
- Move `ACTION_KEYWORDS`, `SOCIAL_LINKS`, `VOICE_TOKEN_MAPPINGS` to separate files
- Import them back into main component
- Zero behavior change

### Phase 2: Extract Token Matching (45 minutes)
- Move `findTokenByText` and `detectAction` to `tokenMatcher.ts`
- Update main component to import and use them
- Test that token matching still works exactly the same

### Phase 3: Extract Command Parser (60 minutes)
- Move the entire `parseCommand` function to `commandParser.ts`
- Keep exact same signature and behavior
- Update main component to use extracted function

### Phase 4: Extract Suggestion Generator (90 minutes)
- Move the massive `suggestions` useMemo logic to `suggestionGenerator.ts`
- Keep exact same behavior and return type
- This is the biggest win - removes ~300 lines from main component

### Phase 5: Extract Voice Processing (45 minutes)
- Move voice-related logic to `voiceProcessor.ts`
- Keep same behavior for voice input processing

### Phase 6: Clean Up and Test (60 minutes)
- Remove unused imports
- Add basic unit tests for extracted functions
- Verify all existing functionality still works

## Benefits of This Approach

1. **Immediate Relief**: Main component goes from 1022 lines to ~400 lines
2. **Testable**: Complex logic is now in pure functions that can be unit tested
3. **Maintainable**: Each extracted function has a single responsibility
4. **Safe**: Zero behavior changes, just code organization
5. **Realistic**: Can be done in a single day without breaking anything

## What We're NOT Doing

- No new architecture patterns
- No strategy pattern complexity
- No new interfaces or breaking changes
- No hooks refactoring (keep existing useEffect, useMemo, etc.)
- No component splitting (keep single SmartSearchBox component)

This is purely about extracting the most problematic functions into separate files while keeping everything else exactly the same.