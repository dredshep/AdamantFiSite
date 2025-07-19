# Design Document

## Overview

The smart search refactor transforms a monolithic 1022-line component into a modular, extensible architecture. The design follows a strategy pattern for search functionality, separates parsing concerns, and creates a clean component hierarchy that maintains all existing functionality while enabling easy extension.

## Architecture

### High-Level Structure

```
components/app/Global/SmartSearch/
├── SmartSearchBox.tsx                 # Main component (simplified)
├── hooks/
│   ├── useSmartSearch.ts             # Main search orchestration hook
│   ├── useVoiceInput.ts              # Voice recognition logic
│   └── useSearchKeyboard.ts          # Keyboard navigation logic
├── parsers/
│   ├── CommandParser.ts              # Main command parsing logic
│   ├── TokenResolver.ts              # Token matching and resolution
│   ├── AmountExtractor.ts            # Number/amount extraction
│   └── VoiceProcessor.ts             # Voice input processing
├── strategies/
│   ├── BaseStrategy.ts               # Abstract base strategy
│   ├── SwapStrategy.ts               # Swap command suggestions
│   ├── StakeStrategy.ts              # Staking command suggestions
│   ├── NavigationStrategy.ts         # Navigation suggestions
│   ├── TokenStrategy.ts              # Token-based suggestions
│   ├── SocialStrategy.ts             # Social link suggestions
│   └── ActionStrategy.ts             # General action suggestions
├── components/
│   ├── SearchInput.tsx               # Input field component
│   ├── SuggestionsList.tsx           # Results dropdown
│   ├── SuggestionItem.tsx            # Individual suggestion
│   └── VoiceButton.tsx               # Voice input button
└── types/
    ├── SearchTypes.ts                # Core type definitions
    └── StrategyTypes.ts              # Strategy-specific types
```

## Components and Interfaces

### Core Types

```typescript
// SearchTypes.ts
export interface ParsedCommand {
  action: SearchAction | null;
  amount?: string;
  fromToken?: ConfigToken;
  toToken?: ConfigToken;
  query: string;
  confidence: number;
  target?: string;
  metadata?: Record<string, any>;
}

export interface SearchSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  confidence: number;
  onSelect: () => void;
  metadata?: Record<string, any>;
}

export interface SearchContext {
  query: string;
  parsedCommand: ParsedCommand;
  router: NextRouter;
  swapStore: SwapStoreState;
  isLoading: boolean;
}
```

### Strategy Interface

```typescript
// BaseStrategy.ts
export abstract class BaseStrategy {
  abstract readonly name: string;
  abstract readonly priority: number;
  
  abstract canHandle(context: SearchContext): boolean;
  abstract generateSuggestions(context: SearchContext): Promise<SearchSuggestion[]>;
  
  protected createSuggestion(
    type: SuggestionType,
    title: string,
    onSelect: () => void,
    options?: Partial<SearchSuggestion>
  ): SearchSuggestion {
    return {
      id: `${this.name}-${Date.now()}-${Math.random()}`,
      type,
      title,
      onSelect,
      confidence: 0.5,
      ...options,
    };
  }
}
```

### Parser Architecture

```typescript
// CommandParser.ts
export class CommandParser {
  constructor(
    private tokenResolver: TokenResolver,
    private amountExtractor: AmountExtractor,
    private voiceProcessor: VoiceProcessor
  ) {}

  parse(input: string, isVoiceInput = false): ParsedCommand {
    const processedInput = isVoiceInput 
      ? this.voiceProcessor.process(input)
      : input;

    return {
      action: this.detectAction(processedInput),
      ...this.tokenResolver.extractTokens(processedInput),
      amount: this.amountExtractor.extract(processedInput),
      query: input,
      confidence: this.calculateConfidence(processedInput),
    };
  }

  private detectAction(input: string): SearchAction | null {
    // Action detection logic
  }

  private calculateConfidence(input: string): number {
    // Confidence calculation logic
  }
}
```

### Main Hook Architecture

```typescript
// useSmartSearch.ts
export const useSmartSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const parser = useMemo(() => new CommandParser(
    new TokenResolver(),
    new AmountExtractor(),
    new VoiceProcessor()
  ), []);

  const strategies = useMemo(() => [
    new SwapStrategy(),
    new StakeStrategy(),
    new NavigationStrategy(),
    new TokenStrategy(),
    new SocialStrategy(),
    new ActionStrategy(),
  ], []);

  const generateSuggestions = useCallback(async (query: string) => {
    const parsedCommand = parser.parse(query);
    const context: SearchContext = {
      query,
      parsedCommand,
      router,
      swapStore: useSwapStore.getState(),
      isLoading,
    };

    const allSuggestions: SearchSuggestion[] = [];
    
    for (const strategy of strategies) {
      if (strategy.canHandle(context)) {
        const strategySuggestions = await strategy.generateSuggestions(context);
        allSuggestions.push(...strategySuggestions);
      }
    }

    // Sort by confidence and priority
    return allSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);
  }, [parser, strategies, router, isLoading]);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    generateSuggestions,
  };
};
```

## Data Models

### Token Resolution Model

```typescript
// TokenResolver.ts
export class TokenResolver {
  private readonly specialMappings = {
    secret: 'sSCRT',
    scrt: 'sSCRT',
    atom: 'sATOM',
    // ... other mappings
  };

  extractTokens(input: string): { fromToken?: ConfigToken; toToken?: ConfigToken } {
    const tokens = this.findAllTokens(input);
    return this.assignTokenRoles(tokens, input);
  }

  private findAllTokens(input: string): ConfigToken[] {
    // Fuzzy token matching logic
  }

  private assignTokenRoles(tokens: ConfigToken[], input: string) {
    // Logic to determine which token is "from" and which is "to"
  }
}
```

### Strategy Implementation Examples

```typescript
// SwapStrategy.ts
export class SwapStrategy extends BaseStrategy {
  readonly name = 'swap';
  readonly priority = 10;

  canHandle(context: SearchContext): boolean {
    return context.parsedCommand.action === 'swap' ||
           context.query.toLowerCase().includes('swap');
  }

  async generateSuggestions(context: SearchContext): Promise<SearchSuggestion[]> {
    const { parsedCommand } = context;
    const suggestions: SearchSuggestion[] = [];

    // Complete swap command
    if (parsedCommand.fromToken && parsedCommand.toToken) {
      suggestions.push(this.createExecuteSwapSuggestion(parsedCommand));
    }

    // Partial commands - suggest token completions
    if (parsedCommand.action === 'swap' && !parsedCommand.toToken) {
      suggestions.push(...this.createTokenCompletionSuggestions(context));
    }

    return suggestions;
  }

  private createExecuteSwapSuggestion(command: ParsedCommand): SearchSuggestion {
    return this.createSuggestion(
      'command',
      `Swap ${command.amount || ''} ${command.fromToken!.symbol} → ${command.toToken!.symbol}`,
      () => this.executeSwap(command),
      {
        icon: <ArrowRight className="w-4 h-4 text-green-400" />,
        confidence: 0.9,
      }
    );
  }

  private async executeSwap(command: ParsedCommand): Promise<void> {
    // Swap execution logic
  }
}
```

## Error Handling

### Strategy Error Isolation

```typescript
// useSmartSearch.ts (error handling portion)
const generateSuggestions = useCallback(async (query: string) => {
  const allSuggestions: SearchSuggestion[] = [];
  const errors: Array<{ strategy: string; error: Error }> = [];
  
  for (const strategy of strategies) {
    try {
      if (strategy.canHandle(context)) {
        const strategySuggestions = await strategy.generateSuggestions(context);
        allSuggestions.push(...strategySuggestions);
      }
    } catch (error) {
      console.error(`Strategy ${strategy.name} failed:`, error);
      errors.push({ strategy: strategy.name, error: error as Error });
      
      // Continue with other strategies
    }
  }

  // Log errors for debugging but don't break the UI
  if (errors.length > 0) {
    console.warn('Some search strategies failed:', errors);
  }

  return allSuggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}, [parser, strategies, router, isLoading]);
```

### Parser Error Recovery

```typescript
// CommandParser.ts (error handling)
parse(input: string, isVoiceInput = false): ParsedCommand {
  try {
    const processedInput = isVoiceInput 
      ? this.voiceProcessor.process(input)
      : input;

    return {
      action: this.detectAction(processedInput),
      ...this.tokenResolver.extractTokens(processedInput),
      amount: this.amountExtractor.extract(processedInput),
      query: input,
      confidence: this.calculateConfidence(processedInput),
    };
  } catch (error) {
    console.error('Command parsing failed:', error);
    
    // Return minimal valid command
    return {
      action: null,
      query: input,
      confidence: 0,
    };
  }
}
```

## Testing Strategy

### Unit Testing Structure

```typescript
// __tests__/parsers/CommandParser.test.ts
describe('CommandParser', () => {
  let parser: CommandParser;

  beforeEach(() => {
    parser = new CommandParser(
      new TokenResolver(),
      new AmountExtractor(),
      new VoiceProcessor()
    );
  });

  describe('swap command parsing', () => {
    it('should parse complete swap commands', () => {
      const result = parser.parse('swap 100 sSCRT for USDC');
      
      expect(result.action).toBe('swap');
      expect(result.amount).toBe('100');
      expect(result.fromToken?.symbol).toBe('sSCRT');
      expect(result.toToken?.symbol).toBe('USDC.nbl');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle partial swap commands', () => {
      const result = parser.parse('swap sSCRT');
      
      expect(result.action).toBe('swap');
      expect(result.fromToken?.symbol).toBe('sSCRT');
      expect(result.toToken).toBeUndefined();
    });
  });
});
```

### Strategy Testing

```typescript
// __tests__/strategies/SwapStrategy.test.ts
describe('SwapStrategy', () => {
  let strategy: SwapStrategy;
  let mockContext: SearchContext;

  beforeEach(() => {
    strategy = new SwapStrategy();
    mockContext = createMockSearchContext();
  });

  it('should handle complete swap commands', async () => {
    mockContext.parsedCommand = {
      action: 'swap',
      fromToken: mockTokens.sSCRT,
      toToken: mockTokens.USDC,
      amount: '100',
      query: 'swap 100 sSCRT for USDC',
      confidence: 0.9,
    };

    const suggestions = await strategy.generateSuggestions(mockContext);
    
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe('command');
    expect(suggestions[0].title).toContain('Swap 100 sSCRT → USDC');
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/SmartSearch.test.tsx
describe('SmartSearch Integration', () => {
  it('should execute complete swap workflow', async () => {
    const { getByPlaceholderText, getByText } = render(<SmartSearchBox />);
    
    const input = getByPlaceholderText(/Type a command/);
    
    // Type swap command
    fireEvent.change(input, { target: { value: 'swap 100 sSCRT for USDC' } });
    
    // Wait for suggestions
    await waitFor(() => {
      expect(getByText(/Swap 100 sSCRT → USDC/)).toBeInTheDocument();
    });
    
    // Execute command
    fireEvent.click(getByText(/Swap 100 sSCRT → USDC/));
    
    // Verify swap store was updated
    expect(mockSwapStore.setTokenInputProperty).toHaveBeenCalledWith(
      'swap.pay',
      'tokenAddress',
      'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek'
    );
  });
});
```

## Performance Considerations

### Debounced Suggestion Generation

```typescript
// useSmartSearch.ts (performance optimization)
const debouncedGenerateSuggestions = useMemo(
  () => debounce(generateSuggestions, 150),
  [generateSuggestions]
);

useEffect(() => {
  if (query.trim()) {
    debouncedGenerateSuggestions(query);
  } else {
    setSuggestions(getDefaultSuggestions());
  }
}, [query, debouncedGenerateSuggestions]);
```

### Strategy Lazy Loading

```typescript
// strategies/index.ts
export const createStrategies = () => [
  new SwapStrategy(),
  new StakeStrategy(),
  // Only load heavy strategies when needed
  ...(FEATURE_FLAGS.advancedSearch ? [new AdvancedStrategy()] : []),
];
```

This design provides a clean separation of concerns, maintains all existing functionality, and creates a foundation for easy extension and testing. Each strategy can be developed and tested independently, and the parser modules can be reused across different contexts.