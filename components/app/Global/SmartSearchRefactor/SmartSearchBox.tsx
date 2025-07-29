import { INPUT_STYLES } from '@/components/app/Shared/Forms/Input/inputStyles';
import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { useSwapFormLean } from '@/hooks/useSwapFormLean';
import { useSwapStore } from '@/store/swapStore';
import * as Popover from '@radix-ui/react-popover';
import {
  ArrowRight,
  Command,
  Copy,
  ExternalLink,
  Loader2,
  Mic,
  MicOff,
  Minus,
  Plus,
  Search,
  Send,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Import our extracted utilities
import { LIQUIDITY_PAIRS } from '@/config/tokens';
import {
  CommandStep,
  SearchSuggestion,
  SmartSearchBoxProps,
  SpeechRecognition,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
} from './types';
import { parseCommand } from './utils/commandParser';
import { generateStepSuggestions } from './utils/stepSuggestionGenerator';
import { processVoiceInput } from './utils/voiceProcessor';

// Icon mapping for string-based icons
const ICON_MAP = {
  ArrowRight: ArrowRight,
  TrendingUp: TrendingUp,
  Zap: Zap,
  Copy: Copy,
  Plus: Plus,
  Minus: Minus,
  Send: Send,
  ExternalLink: ExternalLink,
};

const SmartSearchBox: React.FC<SmartSearchBoxProps> = ({
  className = '',
  placeholder = 'Type a command or press Ctrl+K...',
  isMobile = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupportedState, setIsVoiceSupportedState] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const { setTokenInputProperty } = useSwapStore();
  const { handleSwapClick, isEstimating, estimatedOutput } = useSwapFormLean();
  const router = useRouter();

  // Check if voice is supported (Chrome or Edge only)
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome =
      userAgent.includes('chrome') &&
      !userAgent.includes('chromium') &&
      !userAgent.includes('brave');
    const isEdge = userAgent.includes('edg/');
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const voiceSupported = (isChrome || isEdge) && !!SpeechRecognitionConstructor;
    setIsVoiceSupportedState(voiceSupported);

    if (voiceSupported) {
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor!();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[0]?.[0]?.transcript || '';
        const processedQuery = processVoiceInput(result);
        setQuery(processedQuery);
        setIsListening(false);
        setIsOpen(true);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && !isOpen) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Execute a command step with proper loading state management
  const executeCommandStep = useCallback(
    async (commandStep: CommandStep, mode: 'execute' | 'fill' = 'execute') => {
      if (!commandStep.action) return;

      // Handle Deposit action
      if (commandStep.action === 'deposit' && commandStep.fromToken && commandStep.target) {
        setIsLoading(true);
        try {
          // Find the pool from the target string
          const pool = LIQUIDITY_PAIRS.find((p) => p.pairContract === commandStep.target);
          if (!pool) {
            console.error('Target pool for deposit not found');
            setIsLoading(false);
            return;
          }

          // Navigate to the pool page with query params for pre-filling
          const { symbol } = commandStep.fromToken;
          const { amount } = commandStep;

          const queryParams = new URLSearchParams();
          if (symbol) queryParams.append('token', symbol);
          if (amount) queryParams.append('amount', amount);

          await router.push(`/pool/${commandStep.target}?${queryParams.toString()}`);
          setIsOpen(false);
        } catch (error) {
          console.error('Error executing deposit command:', error);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      if (commandStep.action === 'swap' && commandStep.fromToken && commandStep.toToken) {
        setIsLoading(true);

        try {
          // Set up the swap form first
          setTokenInputProperty('swap.pay', 'tokenAddress', commandStep.fromToken.address);
          setTokenInputProperty('swap.receive', 'tokenAddress', commandStep.toToken.address);

          if (commandStep.amount) {
            setTokenInputProperty('swap.pay', 'amount', commandStep.amount);
          }

          // Navigate to swap page if not already there
          if (router.pathname !== '/') {
            await router.push('/');
          }

          // Close the dropdown
          setIsOpen(false);
          setIsLoading(false);

          // Only execute the swap if mode is 'execute', not 'fill'
          if (mode === 'execute') {
            // Wait for estimation to complete before executing swap
            const waitForEstimation = () => {
              return new Promise<void>((resolve, reject) => {
                const checkEstimation = () => {
                  // Check if estimation is complete (not estimating and has valid output)
                  if (
                    !isEstimating &&
                    estimatedOutput &&
                    estimatedOutput !== '0' &&
                    estimatedOutput !== 'Error during swap execution. Please try again.'
                  ) {
                    console.log('✅ Estimation complete, proceeding with swap');
                    resolve();
                  } else if (!isEstimating && estimatedOutput === '0') {
                    // If estimation finished but output is 0, there might be no liquidity
                    console.log(
                      '❌ Estimation complete but output is 0 - possible liquidity issue'
                    );
                    reject(new Error('No liquidity available for this swap'));
                  } else {
                    // Still estimating, check again in 100ms
                    setTimeout(checkEstimation, 100);
                  }
                };

                // Start checking after a brief delay to allow the form to update
                setTimeout(checkEstimation, 200);

                // Timeout after 10 seconds to prevent infinite waiting
                setTimeout(() => {
                  reject(new Error('Estimation timeout - please try again'));
                }, 10000);
              });
            };

            try {
              await waitForEstimation();
              await handleSwapClick();
              // Clear query after successful execution
              setQuery('');
            } catch (error) {
              console.error('Swap execution failed:', error);
              // Show error but don't clear query so user can try again
            }
          }
          // If mode is 'fill', we just pre-fill the form and stop here
        } catch (error) {
          console.error('Error executing command:', error);
          setIsLoading(false);
        }
      }

      // Handle stake command
      if (commandStep.action === 'stake' && commandStep.fromToken) {
        setIsLoading(true);
        try {
          // Navigate to pools page for staking
          await router.push('/pools');
          setIsOpen(false);
        } catch (error) {
          console.error('Error executing stake command:', error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [setTokenInputProperty, router, handleSwapClick, isEstimating, estimatedOutput]
  );

  // Generate step-based suggestions
  const stepSuggestions = useMemo(
    () =>
      generateStepSuggestions({
        query,
        router,
        executeCommand: executeCommandStep,
        setQuery,
        inputRef,
      }),
    [query, router, executeCommandStep]
  );

  // Convert StepSuggestion[] to SearchSuggestion[] for compatibility
  const suggestions = useMemo((): SearchSuggestion[] => {
    return stepSuggestions.map((stepSuggestion) => {
      // Map StepSuggestion types to SearchSuggestion types
      let mappedType: SearchSuggestion['type'];
      switch (stepSuggestion.type) {
        case 'completion':
          mappedType = 'command';
          break;
        case 'continuation':
          mappedType = 'action';
          break;
        case 'action':
          mappedType = 'action';
          break;
        case 'token':
          mappedType = 'token';
          break;
        case 'pool':
          mappedType = 'pool';
          break;
        case 'navigation':
          mappedType = 'navigation';
          break;
        case 'social':
          mappedType = 'social';
          break;
        case 'utility':
          mappedType = 'utility';
          break;
        case 'amount':
          mappedType = 'action'; // Map amount suggestions to action type
          break;
        default:
          mappedType = 'action';
      }

      const result: SearchSuggestion = {
        type: mappedType,
        title: stepSuggestion.title,
        onSelect: stepSuggestion.onSelect,
      };

      // Only add optional properties if they have values
      if (stepSuggestion.subtitle) {
        result.subtitle = stepSuggestion.subtitle;
      }
      if (stepSuggestion.token) {
        result.token = stepSuggestion.token;
      }
      if (stepSuggestion.pool) {
        result.pool = stepSuggestion.pool;
      }
      if (stepSuggestion.icon) {
        result.icon = stepSuggestion.icon;
      }

      return result;
    });
  }, [stepSuggestions]);

  // Voice input functions
  const startListening = useCallback(() => {
    if (recognition && !isListening && isVoiceSupportedState) {
      recognition.start();
    }
  }, [recognition, isListening, isVoiceSupportedState]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  const handleSuggestionClick = useCallback((suggestion: (typeof suggestions)[0]) => {
    suggestion.onSelect();
    // Don't close dropdown automatically - let the onSelect logic handle it
  }, []);

  // Handle keyboard navigation with proper completion
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || isLoading) return;

      const suggestionCount = suggestions.length;
      if (suggestionCount === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prevIndex) => (prevIndex + 1) % suggestionCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prevIndex) => (prevIndex - 1 + suggestionCount) % suggestionCount);
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions[activeIndex]) {
            handleSuggestionClick(suggestions[activeIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, isLoading, suggestions, activeIndex, handleSuggestionClick]
  );

  // Handle input focus/blur - ensure dropdown stays open while focused
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Don't close if focus is moving to a suggestion
    const relatedTarget = e.relatedTarget as Element;
    if (relatedTarget?.closest('[data-suggestions-container]')) {
      return;
    }

    setIsFocused(false);
    // Only close when focus is actually lost and not loading
    setTimeout(() => {
      if (!inputRef.current || document.activeElement !== inputRef.current) {
        setIsOpen(false);
      }
    }, 150);
  }, []);

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isLoading) {
        setQuery(e.target.value);
        // Always show suggestions when focused and not loading
        if (isFocused) {
          setIsOpen(true);
        }
      }
    },
    [isLoading, isFocused]
  );

  // Helper function to render icons
  const renderIcon = (icon: string | React.ReactNode | undefined) => {
    if (typeof icon === 'string') {
      const IconComponent = ICON_MAP[icon as keyof typeof ICON_MAP];
      return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
    }
    return icon;
  };

  // Helper function to render syntax-highlighted input segments
  const renderSyntaxHighlightedInput = (): React.ReactNode[] => {
    if (!query.trim()) {
      return [];
    }

    // Simple syntax highlighting without complex token replacement
    const words = query.split(' ');
    const segments: React.ReactNode[] = [];
    const parsedCommand = parseCommand(query);

    words.forEach((word, index) => {
      const wordLower = word.toLowerCase();
      let className = 'text-adamant-text-box-main';

      // Highlight action words
      if (parsedCommand.action && wordLower === parsedCommand.action) {
        className = 'text-adamant-accentText font-medium';
      }
      // Highlight numbers
      else if (/^\d+(\.\d+)?$/.test(word)) {
        className = 'text-blue-300 font-medium';
      }
      // Highlight directional words
      else if (['for', 'to', 'from', 'with', 'in'].includes(wordLower)) {
        className = 'text-adamant-text-box-secondary';
      }
      // Highlight recognized tokens
      else if (
        parsedCommand.fromToken &&
        wordLower === parsedCommand.fromToken.symbol.toLowerCase()
      ) {
        className = 'text-green-300 font-medium';
      } else if (
        parsedCommand.toToken &&
        wordLower === parsedCommand.toToken.symbol.toLowerCase()
      ) {
        className = 'text-green-300 font-medium';
      }

      segments.push(
        <span key={index} className={className}>
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </span>
      );
    });

    return segments;
  };

  // Generate a helpful status message
  const getStatusMessage = () => {
    const parsedCommand = parseCommand(query);
    if (!parsedCommand.action) return '';

    const parts = [];
    if (parsedCommand.action) parts.push(parsedCommand.action);
    if (parsedCommand.amount) parts.push(parsedCommand.amount);
    if (parsedCommand.fromToken) parts.push(parsedCommand.fromToken.symbol);
    if (parsedCommand.fromToken && !parsedCommand.toToken) parts.push('for ?');
    if (parsedCommand.toToken) parts.push('→', parsedCommand.toToken.symbol);

    return parts.join(' ');
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <div className={`relative ${className}`}>
        <Popover.Trigger asChild>
          <div
            className={`${INPUT_STYLES.container} ${
              isMobile ? 'p-3' : 'p-4'
            } relative transition-all duration-200
            ${isFocused ? 'ring-2 ring-adamant-accentText/30 border-adamant-accentText/50' : ''}
            ${!isFocused ? 'hover:border-adamant-accentText/30' : ''}
            ${isLoading ? 'opacity-75' : ''}
          `}
          >
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-adamant-text-box-secondary flex-shrink-0" />

              {/* Regular input with syntax highlighting overlay */}
              <div className="flex-1 relative min-w-0">
                {/* Visible syntax-highlighted text overlay */}
                <div className="absolute inset-0 flex items-center pointer-events-none text-sm py-2 px-0 overflow-hidden whitespace-nowrap">
                  {query && (
                    <div className="flex items-center gap-1">{renderSyntaxHighlightedInput()}</div>
                  )}
                </div>

                {/* Actual input (transparent text) */}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder={isLoading ? 'Executing command...' : placeholder}
                  disabled={isLoading}
                  className="w-full bg-transparent text-transparent caret-adamant-accentText outline-none disabled:cursor-not-allowed text-sm py-2"
                  style={{ caretColor: 'rgb(138, 117, 74)' }}
                  role="combobox"
                  aria-expanded={isOpen}
                  aria-haspopup="listbox"
                  aria-owns="smart-search-suggestions"
                  aria-activedescendant={
                    isOpen && suggestions.length > 0 ? `suggestion-${activeIndex}` : undefined
                  }
                  aria-label="Smart search input"
                  aria-describedby={getStatusMessage() ? 'search-status' : undefined}
                />
              </div>
              <div className="flex items-center gap-2">
                {isLoading && <Loader2 className="w-4 h-4 text-adamant-accentText animate-spin" />}

                {/* Voice input button - only show when focused and voice is supported */}
                {isFocused && isVoiceSupportedState && !isLoading && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-1 rounded transition-colors ${
                      isListening
                        ? 'text-red-400 hover:text-red-300'
                        : 'text-adamant-text-box-secondary hover:text-adamant-accentText'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  </button>
                )}

                {query && !isLoading && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
                {!isMobile && (
                  <div className="flex items-center gap-1 text-xs text-adamant-text-box-secondary/50">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Popover.Trigger>

        {/* Status message for screen readers */}
        {getStatusMessage() && (
          <div id="search-status" className="sr-only" aria-live="polite">
            {getStatusMessage()}
          </div>
        )}

        {/* Suggestions dropdown */}
        <Popover.Portal>
          <Popover.Content
            className={`w-full ${INPUT_STYLES.infoContainer} max-h-80 overflow-y-auto z-50 shadow-xl
              transition-all duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out 
              data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 
              data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2`}
            side="bottom"
            align="start"
            sideOffset={8}
            data-suggestions-container
            style={{
              width: 'var(--radix-popover-trigger-width)',
            }}
            onOpenAutoFocus={(e) => {
              // Prevent auto focus to maintain focus on input
              e.preventDefault();
            }}
            aria-describedby="smart-search-suggestions"
          >
            {suggestions.length > 0 && !isLoading && (
              <div role="listbox" id="smart-search-suggestions" aria-label="Search suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.title}-${index}`}
                    id={`suggestion-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`w-full flex items-center gap-3 p-3 cursor-pointer transition-all duration-150 text-left ${
                      index === activeIndex
                        ? 'bg-adamant-accentText/10 border-l-2 border-adamant-accentText'
                        : 'hover:bg-adamant-app-input/50'
                    } ${index > 0 ? 'border-t border-adamant-box-border/30' : ''}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => {
                      setActiveIndex(index);
                    }}
                    data-suggestion-type={suggestion.type}
                  >
                    {suggestion.token ? (
                      <TokenImageWithFallback
                        tokenAddress={suggestion.token.address}
                        size={24}
                        alt={suggestion.token.symbol}
                      />
                    ) : suggestion.pool ? (
                      <div className="w-6 h-6 flex items-center justify-center text-adamant-accentText">
                        <Zap className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center text-adamant-accentText">
                        {renderIcon(suggestion.icon)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-adamant-text-box-main">
                        {suggestion.title}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-xs text-adamant-text-box-secondary truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>

                    {(suggestion.type === 'command' ||
                      suggestion.type === 'navigation' ||
                      suggestion.type === 'social' ||
                      suggestion.type === 'pool') && (
                      <ArrowRight className="w-4 h-4 text-adamant-accentText" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
};

export default SmartSearchBox;
