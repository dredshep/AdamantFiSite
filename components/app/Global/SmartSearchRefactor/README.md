# SmartSearchRefactor Component

A modern, modular refactor of the original SmartSearchBox component that provides intelligent command parsing, syntax highlighting, and natural language processing for DeFi operations.

## 🎯 Overview

This refactored component transforms a 1022-line monolithic component into a clean, maintainable architecture with extracted utilities and improved UX. It supports natural language commands for swapping tokens, staking, and other DeFi operations.

## ✨ Key Features

### 🎨 **Syntax Highlighting**

- **Actions** (`swap`, `stake`) → Adamant accent color, bold
- **Numbers** (`10`, `100.5`) → Blue, bold
- **Tokens** (`sSCRT`, `USDC.nbl`) → Green, bold
- **Directional words** (`for`, `to`) → Secondary gray
- **Regular text** → Default color

### 🧠 **Natural Language Processing**

- Parse commands like "swap 10 USDC.nbl for sSCRT"
- Extract amounts, tokens, and actions from free-form text
- Support multiple command patterns and synonyms
- Intelligent token matching with fuzzy search

### 🎤 **Voice Input Support**

- Web Speech API integration
- Browser compatibility detection
- Voice command processing with visual feedback

### 📱 **Mobile-Optimized UX**

- No duplicate text display (pills + raw text)
- Responsive design for small screens
- Touch-friendly interface
- Keyboard navigation support

### ♿ **Accessibility Features**

- **ARIA Support**: Full ARIA attributes for screen readers
- **Keyboard Navigation**: Arrow keys, Enter, Escape support
- **Focus Management**: Proper focus handling and visual indicators
- **Screen Reader**: Live regions and descriptive labels
- **Radix Integration**: Uses Radix Popover for enhanced accessibility

## 🏗️ Architecture

### File Structure

```
SmartSearchRefactor/
├── README.md                    # This documentation
├── SmartSearchBox.tsx          # Main component (~470 lines)
├── types.ts                    # TypeScript interfaces
├── components/
│   └── TokenPill.tsx          # Reusable token display component
├── constants/
│   └── actionKeywords.ts      # Command action definitions
└── utils/
    ├── commandParser.ts       # Natural language parsing logic
    ├── suggestionGenerator.ts # Smart suggestion generation
    ├── tokenMatcher.ts       # Token fuzzy matching
    └── voiceProcessor.ts     # Voice input processing
```

### Modular Design Benefits

- **Maintainability**: Each utility has a single responsibility
- **Testability**: Individual functions can be unit tested
- **Reusability**: Utils can be used in other components
- **Readability**: Main component focuses on UI logic

## 🔧 Implementation Details

### Command Parsing

The `commandParser.ts` utility handles complex natural language patterns:

```typescript
// Supported patterns:
'swap 10 USDC for sSCRT';
'swap USDC.nbl for 100 sSCRT';
'stake 50 sSCRT';
'add liquidity 10 USDC 5 sSCRT';
```

**Features:**

- Multiple amount parsing strategies
- Token symbol extraction
- Action detection with synonyms
- Prevents same-token swaps

### Token Matching

The `tokenMatcher.ts` provides intelligent token search:

```typescript
// Fuzzy matching examples:
"usdc" → matches "USDC.nbl"
"secret" → matches "sSCRT"
"scrt" → matches "sSCRT", "SCRT"
```

**Features:**

- Symbol and name matching
- Partial text matching (3+ characters)
- Case-insensitive search
- Ranked results by relevance

### Suggestion Generation

The `suggestionGenerator.ts` creates contextual suggestions:

```typescript
// Context-aware suggestions:
"swap 10 " → suggests tokens for "from"
"swap USDC for " → suggests tokens for "to" (excludes USDC)
"stake " → suggests stakeable tokens
```

**Features:**

- Context-aware filtering
- Prevents duplicate token suggestions
- Proper spacing and formatting
- Action-specific token filtering

### Voice Processing

The `voiceProcessor.ts` handles speech input:

```typescript
// Browser compatibility:
✅ Chrome/Edge (WebKit Speech API)
✅ Firefox (with flag)
❌ Safari (graceful degradation)
```

**Features:**

- Browser support detection
- Continuous listening mode
- Error handling and recovery
- Visual feedback integration

## 🎮 Usage Examples

### Basic Integration

```tsx
import SmartSearchBox from './SmartSearchRefactor/SmartSearchBox';

function MyComponent() {
  return (
    <SmartSearchBox
      onExecuteCommand={(command) => {
        console.log('Execute:', command);
      }}
      placeholder="Try: swap 10 USDC for sSCRT"
    />
  );
}
```

### Supported Commands

#### Swap Operations

```
swap 10 USDC for sSCRT
swap USDC.nbl for 100 sSCRT
exchange 50 ATOM to JUNO
trade SCRT for USDC
```

#### Staking Operations

```
stake 100 sSCRT
stake 50 ATOM in validator
earn rewards with sSCRT
```

#### Liquidity Operations

```
add liquidity 10 USDC 5 sSCRT
provide 100 ATOM to pool
deposit into USDC/sSCRT pool
```

## 🐛 Bug Fixes & Improvements

### Issues Resolved from Original

1. **✅ Same Token Prevention**: Won't suggest identical from/to tokens
2. **✅ Amount Parsing**: Handles "swap x for {amount} y" patterns correctly
3. **✅ Proper Spacing**: Suggestions add correct trailing spaces
4. **✅ No Duplicate Display**: Removed pill + text redundancy
5. **✅ Mobile Optimization**: Responsive design without layout breaks
6. **✅ Aggressive Matching**: Fixed overly aggressive partial token matching
7. **✅ Accessibility**: Enhanced with Radix Popover and ARIA attributes
8. **✅ Keyboard Navigation**: Improved arrow key navigation with smooth scrolling

### Performance Improvements

- **Debounced parsing**: Reduces unnecessary re-computations
- **Memoized suggestions**: Caches suggestion results
- **Optimized rendering**: Minimal re-renders with useCallback/useMemo
- **Lazy token matching**: Only searches when needed

## 🧪 Testing

### Manual Testing Scenarios

1. **Basic Commands**:

   - Type: `swap 10 u` → Should suggest USDC tokens
   - Type: `swap USDC.nbl for 100 s` → Should suggest sSCRT

2. **Error Handling**:

   - Type: `swap USDC for USDC` → Should prevent same-token swap
   - Type: `invalid command` → Should show no suggestions

3. **Voice Input**:

   - Say: "swap ten USDC for Secret" → Should parse correctly
   - Test on different browsers for compatibility

4. **Mobile Testing**:
   - Test on mobile devices for responsive behavior
   - Verify touch interactions work properly

### Unit Testing Utilities

Each utility function can be tested independently:

```typescript
// Example test for commandParser
import { parseCommand } from './utils/commandParser';

test('parses swap command correctly', () => {
  const result = parseCommand('swap 10 USDC for sSCRT', tokenList);
  expect(result.action).toBe('swap');
  expect(result.amount).toBe('10');
  expect(result.fromToken?.symbol).toBe('USDC');
  expect(result.toToken?.symbol).toBe('sSCRT');
});
```

## 🚀 Future Enhancements

### Planned Features

- [ ] **Command History**: Remember recent commands
- [ ] **Smart Autocomplete**: Predictive text completion
- [ ] **Macro Support**: Custom command shortcuts
- [ ] **Advanced Parsing**: Support for complex multi-step operations
- [ ] **Internationalization**: Multi-language support
- [ ] **Analytics**: Usage metrics and optimization insights

### Technical Improvements

- [ ] **Error Boundaries**: Better error handling and recovery
- [ ] **Loading States**: Improved feedback during operations
- [x] **Accessibility**: Enhanced screen reader support with Radix
- [ ] **Performance**: Further optimization for large token lists
- [ ] **Testing**: Comprehensive unit and integration tests

## 📊 Metrics

### Code Quality Improvements

- **Lines of Code**: 1022 → 470 (54% reduction)
- **Cyclomatic Complexity**: High → Low (modular functions)
- **Maintainability Index**: Significantly improved
- **Test Coverage**: Ready for comprehensive testing

### User Experience Improvements

- **Mobile Usability**: 📱 Optimized for small screens
- **Visual Clarity**: 🎨 Clear syntax highlighting
- **Performance**: ⚡ Faster parsing and suggestions
- **Accessibility**: ♿ Better keyboard navigation

## 🤝 Contributing

When contributing to this component:

1. **Maintain Modularity**: Keep utilities focused and testable
2. **Follow Patterns**: Use established parsing and suggestion patterns
3. **Test Thoroughly**: Verify changes don't break existing functionality
4. **Document Changes**: Update this README for significant modifications
5. **Consider Mobile**: Test responsive behavior on various screen sizes

## 📝 License

This component is part of the AdamantFi project and follows the same licensing terms.

---

_Last updated: December 2024_
_Component version: 2.0.0 (Refactored)_
