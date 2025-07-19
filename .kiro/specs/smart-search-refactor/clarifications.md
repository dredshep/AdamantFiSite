# Design Clarifications and Decisions

## Voice Input Strategy

**Decision**: Keep Chrome-only voice input with current browser detection
- Use existing `window.SpeechRecognition || window.webkitSpeechRecognition` detection
- Only show voice button on Chrome/Edge browsers
- No fallback strategies needed - voice is a nice-to-have feature
- Voice processing can be added as a separate input strategy later if needed

**Rationale**: Voice input isn't working properly in current implementation anyway, so keeping it simple and Chrome-only is fine for now.

## Token Resolution Architecture

**Decision**: TokenResolver handles ALL token-related logic
- Fuzzy matching for partial token names
- Special mappings ("secret" → "sSCRT", "atom" → "sATOM", etc.)
- Compound token detection ("Secret ATOM" → "sATOM")
- Exact symbol matching with priority
- Name-based matching as fallback

**Rationale**: If TokenResolver doesn't handle all cases, no other component should. It's the single source of truth for token identification.

## Directional Parsing

**Decision**: Preserve existing directional logic exactly
- "swap X for Y" means swap X to get Y (X is fromToken, Y is toToken)
- "swap X to Y" same meaning
- Current code already handles this correctly with directional word detection
- Don't overcomplicate - the logic is straightforward

**Key insight**: The current implementation already solves this correctly. Just need to preserve the existing logic in the extracted parser.

## Strategy Conflicts and Overlap

**Decision**: Multiple strategies can match the same query - this is a feature, not a bug
- User types "sSCRT" → TokenStrategy shows token info, SwapStrategy suggests "swap sSCRT for..."
- Both suggestions are valuable to the user
- Strategies work independently and don't conflict
- Sort by confidence score to prioritize most relevant suggestions

**Rationale**: Multiple relevant suggestions improve user experience. No need for complex conflict resolution.

## Strategy Composition and Interaction

**Decision**: No strategy composition or interaction needed
- Each strategy works independently
- Strategies don't modify each other's results
- Keep it simple - strategies generate their own suggestions based on the parsed command

**Rationale**: Adding strategy interaction would overcomplicate the architecture without clear benefits.

## Store Access and Dependencies

**Decision**: Pass store actions as dependencies rather than direct store access
- Strategies receive `setTokenInputProperty`, `handleSwapClick`, etc. as function parameters
- No direct store imports in strategy files
- Makes strategies more testable and decoupled

**Example**:
```typescript
class SwapStrategy extends BaseStrategy {
  constructor(
    private setTokenInputProperty: SwapStore['setTokenInputProperty'],
    private handleSwapClick: () => Promise<void>
  ) {}
}
```

## Async Handling in New Architecture

**Decision**: Keep existing async patterns
- Strategies return suggestions with async `onSelect` handlers
- `executeCommand` remains async for swap estimation waiting
- No changes to current async flow - just organize it better

**Current pattern works fine**:
```typescript
onSelect: () => void executeCommand(parsedCommand)
// where executeCommand is async and handles estimation
```

## Error Recovery and Fallbacks

**Decision**: Implement graceful degradation at multiple levels
- **Parser level**: Return minimal valid command if parsing fails (preserve current behavior)
- **Strategy level**: Each strategy handles errors independently, continues if one fails
- **Partial commands**: Strategies suggest completions for incomplete commands
- **No learning mechanism**: Keep it simple, no adaptive parsing

**Example fallback command**:
```typescript
// If parsing fails completely
return {
  action: null,
  query: input,
  confidence: 0,
}
```

## Confidence Scoring

**Decision**: Single confidence score per suggestion, calculated by individual strategies
- No separate token confidence vs command confidence
- Each strategy calculates its own confidence for its suggestions
- Sort final suggestions by confidence score
- Keep scoring simple and intuitive

## Voice Input Integration

**Decision**: Remove voice complexity from initial refactor
- Voice processing can be added later as a separate input preprocessing step
- Focus on text-based parsing first
- Voice can be added as an input strategy later without affecting core architecture

## Architecture Simplifications

Based on clarifications, the architecture is actually simpler than initially designed:

1. **No complex strategy interactions** - each works independently
2. **No voice complexity** - Chrome-only, simple implementation
3. **No learning or adaptation** - static parsing rules
4. **No store coupling** - dependency injection for store actions
5. **Preserve existing logic** - don't reinvent working parts

## Key Principles for Implementation

1. **Preserve existing behavior** - users shouldn't notice any functional changes
2. **Extract, don't rewrite** - move existing logic to appropriate modules
3. **Test in isolation** - each extracted module should be unit testable
4. **Fail gracefully** - errors in one part shouldn't break the whole system
5. **Keep it simple** - avoid over-engineering, focus on organization and testability

## Tomorrow's Focus Areas

When implementing, prioritize these areas:
1. **CommandParser** - Extract the massive parsing logic first
2. **TokenResolver** - Get token matching working in isolation
3. **SwapStrategy** - Most complex strategy, handles the core use case
4. **Error boundaries** - Make sure failures don't cascade
5. **Testing setup** - Unit tests for extracted utilities

The goal is clean separation of concerns while maintaining 100% backward compatibility.