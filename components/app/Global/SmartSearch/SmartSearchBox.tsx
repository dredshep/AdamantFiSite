import { INPUT_STYLES } from '@/components/app/Shared/Forms/Input/inputStyles';
import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { ConfigToken, TOKENS } from '@/config/tokens';
import { useSwapFormLean } from '@/hooks/useSwapFormLean';
import { useSwapStore } from '@/store/swapStore';
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

interface ParsedCommand {
  action:
    | 'swap'
    | 'pool'
    | 'stake'
    | 'deposit'
    | 'withdraw'
    | 'send'
    | 'receive'
    | 'navigate'
    | 'social'
    | null;
  amount?: string;
  fromToken?: ConfigToken;
  toToken?: ConfigToken;
  query: string;
  confidence: number;
  target?: string; // For navigation or social targets
}

interface SearchSuggestion {
  type: 'token' | 'command' | 'action' | 'navigation' | 'social' | 'utility';
  title: string;
  subtitle?: string;
  token?: ConfigToken;
  command?: ParsedCommand;
  icon?: React.ReactNode;
  onSelect: () => void;
  url?: string; // For external links
}

interface SmartSearchBoxProps {
  className?: string;
  placeholder?: string;
  isMobile?: boolean;
}

// Action keywords configuration
const ACTION_KEYWORDS = {
  swap: ['swap', 'exchange', 'trade', 'convert'],
  pool: ['pool', 'liquidity', 'lp'],
  stake: ['stake', 'staking', 'earn', 'reward'],
  deposit: ['deposit', 'add', 'provide'],
  withdraw: ['withdraw', 'remove', 'unstake'],
  send: ['send', 'transfer', 'pay'],
  receive: ['receive', 'address', 'wallet'],
};

// Social links from footer
const SOCIAL_LINKS = [
  { name: 'Twitter', url: 'https://twitter.com/adamantfi', icon: '🐦' },
  { name: 'Telegram', url: 'https://t.me/adamantfi', icon: '📱' },
  { name: 'Discord', url: 'https://discord.gg/adamantfi', icon: '💬' },
  { name: 'GitHub', url: 'https://github.com/adamantfi', icon: '⚡' },
  { name: 'Medium', url: 'https://medium.com/@adamantfi', icon: '📝' },
  { name: 'Documentation', url: 'https://docs.adamantfi.com', icon: '📚' },
];

// Speech Recognition types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

// Voice token mappings for speech recognition
const VOICE_TOKEN_MAPPINGS: Record<string, string> = {
  secret: 'sSCRT',
  scrt: 'sSCRT',
  usdc: 'USDC.nbl',
  dollar: 'USDC.nbl',
  usd: 'USDC.nbl',
  atom: 'sATOM',
  silk: 'SILK',
  stable: 'SILK',
  eth: 'ETH.axl',
  ethereum: 'ETH.axl',
  jackal: 'JKL',
  jkl: 'JKL',
  adamant: 'bADMT',
  badmt: 'bADMT',
};

const SmartSearchBox: React.FC<SmartSearchBoxProps> = ({
  className = '',
  placeholder = 'Type a command or press Ctrl+K...',
  isMobile = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

    if ((isChrome || isEdge) && SpeechRecognitionConstructor) {
      setIsVoiceSupported(true);

      const recognition = new SpeechRecognitionConstructor();
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

  // Process voice input to convert spoken words to text commands
  const processVoiceInput = useCallback((voiceInput: string): string => {
    let processed = voiceInput.toLowerCase();

    // Replace voice token mappings
    Object.entries(VOICE_TOKEN_MAPPINGS).forEach(([spoken, symbol]) => {
      const regex = new RegExp(`\\b${spoken}\\b`, 'gi');
      processed = processed.replace(regex, symbol);
    });

    return processed;
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

  // Find token by text input (fuzzy matching)
  const findTokenByText = useCallback((text: string): ConfigToken | null => {
    const normalized = text.toLowerCase().replace(/[^a-z0-9.]/g, '');

    // Exact symbol match (highest priority)
    const exactMatch = TOKENS.find((token) => token.symbol.toLowerCase() === normalized);
    if (exactMatch) return exactMatch;

    // Partial symbol match
    const symbolMatch = TOKENS.find(
      (token) =>
        token.symbol.toLowerCase().includes(normalized) ||
        normalized.includes(token.symbol.toLowerCase())
    );
    if (symbolMatch) return symbolMatch;

    // Name match
    const nameMatch = TOKENS.find(
      (token) =>
        token.name?.toLowerCase().includes(normalized) ||
        (token.name && normalized.includes(token.name.toLowerCase().split(' ')[0]!))
    );
    if (nameMatch) return nameMatch;

    // Special mappings for common terms
    const specialMappings: Record<string, string> = {
      secret: 'sSCRT',
      scrt: 'sSCRT',
      atom: 'sATOM',
      eth: 'ETH.axl',
      ethereum: 'ETH.axl',
      usdc: 'USDC.nbl',
      dollar: 'USDC.nbl',
      usd: 'USDC.nbl',
      silk: 'SILK',
      stable: 'SILK',
      jackal: 'JKL',
      jkl: 'JKL',
      adamant: 'bADMT',
      badmt: 'bADMT',
    };

    const mappedSymbol = specialMappings[normalized];
    if (mappedSymbol) {
      return TOKENS.find((token) => token.symbol === mappedSymbol) || null;
    }

    return null;
  }, []);

  // Detect action from query
  const detectAction = useCallback((query: string): keyof typeof ACTION_KEYWORDS | null => {
    const normalized = query.toLowerCase().trim();

    for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (normalized.startsWith(keyword + ' ') || normalized === keyword) {
          return action as keyof typeof ACTION_KEYWORDS;
        }
      }
    }
    return null;
  }, []);

  // Parse the user's input to extract swap commands
  const parseCommand = useCallback(
    (input: string): ParsedCommand => {
      const normalized = input.toLowerCase().trim();

      // Initialize command
      const command: ParsedCommand = {
        action: null,
        query: input,
        confidence: 0,
      };

      // Detect action type first
      const detectedAction = detectAction(input);
      if (detectedAction) {
        command.action = detectedAction;
        command.confidence += 0.5;
      }

      // Only look for tokens if we have an action that uses tokens
      if (
        command.action &&
        ['swap', 'stake', 'deposit', 'withdraw', 'send'].includes(command.action)
      ) {
        // Remove action keywords from the beginning to focus on token detection
        let tokenQuery = normalized;
        for (const keywords of Object.values(ACTION_KEYWORDS)) {
          for (const keyword of keywords) {
            if (tokenQuery.startsWith(keyword + ' ')) {
              tokenQuery = tokenQuery.substring(keyword.length + 1);
              break;
            }
          }
        }

        // Extract all numbers from the query
        const numbers = tokenQuery.match(/\d+(?:\.\d+)?/g) || [];

        // Find tokens in the remaining query
        const words = tokenQuery.split(/\s+/);
        const foundTokens: ConfigToken[] = [];
        const tokenPositions: Array<{ token: ConfigToken; position: number; wordCount: number }> =
          [];

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (!word || /^\d+(\.\d+)?$/.test(word)) continue; // Skip numbers

          // Try single word first
          const singleToken = findTokenByText(word);
          if (singleToken && !foundTokens.find((t) => t.symbol === singleToken.symbol)) {
            foundTokens.push(singleToken);
            tokenPositions.push({ token: singleToken, position: i, wordCount: 1 });
            command.confidence += 0.3;
            continue;
          }

          // Try two words for compound tokens
          if (i < words.length - 1) {
            const nextWord = words[i + 1];
            if (nextWord && word && !/^\d+(\.\d+)?$/.test(nextWord)) {
              const twoWords = `${word} ${nextWord}`;
              const compoundToken = findTokenByText(twoWords);
              if (compoundToken && !foundTokens.find((t) => t.symbol === compoundToken.symbol)) {
                foundTokens.push(compoundToken);
                tokenPositions.push({ token: compoundToken, position: i, wordCount: 2 });
                command.confidence += 0.3;
                i++; // Skip next word since we used it
              }
            }
          }
        }

        // Assign tokens based on context and position
        if (foundTokens.length >= 2) {
          // Look for directional words to determine order
          const fromWords = ['from', 'sell', 'pay'];
          const toWords = ['to', 'for', 'buy', 'get', 'receive'];

          let fromIndex = -1;
          let toIndex = -1;

          fromWords.forEach((word) => {
            const index = tokenQuery.indexOf(word);
            if (index !== -1 && (fromIndex === -1 || index < fromIndex)) {
              fromIndex = index;
            }
          });

          toWords.forEach((word) => {
            const index = tokenQuery.indexOf(word);
            if (index !== -1 && (toIndex === -1 || index < toIndex)) {
              toIndex = index;
            }
          });

          if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
            // Use directional context - find tokens before/after directional words
            const beforeTo = tokenPositions.filter((tp) => {
              const wordsArray = tokenQuery.split(/\s+/);
              const wordIndex = wordsArray.findIndex(
                (_word, i) => i >= tp.position && i < tp.position + tp.wordCount
              );
              if (wordIndex === -1) return false;
              const word = wordsArray[wordIndex];
              return word && wordIndex * word.length < toIndex;
            });
            const afterTo = tokenPositions.filter((tp) => {
              const wordsArray = tokenQuery.split(/\s+/);
              const wordIndex = wordsArray.findIndex(
                (_word, i) => i >= tp.position && i < tp.position + tp.wordCount
              );
              if (wordIndex === -1) return false;
              const word = wordsArray[wordIndex];
              return word && wordIndex * word.length > toIndex;
            });

            if (beforeTo.length > 0 && beforeTo[0]) command.fromToken = beforeTo[0].token;
            if (afterTo.length > 0 && afterTo[0]) command.toToken = afterTo[0].token;
          } else {
            // FIXED: Default assignment based on natural language order
            // In "swap X for Y", X is what you pay (fromToken), Y is what you receive (toToken)
            if (foundTokens[0]) command.fromToken = foundTokens[0];
            if (foundTokens[1]) command.toToken = foundTokens[1];
          }
        } else if (foundTokens.length === 1 && foundTokens[0]) {
          // If only one token, check context to determine if it's from or to
          const hasForWord = tokenQuery.includes('for') || tokenQuery.includes('to');
          if (hasForWord) {
            // If "for" appears before the token, it's likely the target (toToken)
            const tokenWord = foundTokens[0].symbol.toLowerCase();
            const forIndex = Math.max(tokenQuery.indexOf('for'), tokenQuery.indexOf('to'));
            const tokenIndex = tokenQuery.indexOf(tokenWord);

            if (forIndex !== -1 && tokenIndex > forIndex) {
              command.toToken = foundTokens[0];
            } else {
              command.fromToken = foundTokens[0];
            }
          } else {
            // Default to fromToken if no directional context
            command.fromToken = foundTokens[0];
          }
        }

        // FIXED: Assign amounts to tokens based on position in original query
        if (numbers.length > 0 && (command.fromToken || command.toToken)) {
          const originalWords = input.toLowerCase().split(/\s+/);

          numbers.forEach((number) => {
            const numberIndex = originalWords.findIndex((word) => word === number);
            if (numberIndex === -1) return;

            // Find positions of tokens in original query
            let fromTokenIndex = -1;
            let toTokenIndex = -1;

            if (command.fromToken) {
              fromTokenIndex = originalWords.findIndex(
                (word) => findTokenByText(word)?.symbol === command.fromToken!.symbol
              );
            }

            if (command.toToken) {
              toTokenIndex = originalWords.findIndex(
                (word) => findTokenByText(word)?.symbol === command.toToken!.symbol
              );
            }

            // Assign number based on position relative to tokens
            if (fromTokenIndex !== -1 && toTokenIndex !== -1) {
              // If number is closer to fromToken, it's the amount
              const distanceToFrom = Math.abs(numberIndex - fromTokenIndex);
              const distanceToTo = Math.abs(numberIndex - toTokenIndex);

              if (distanceToFrom <= distanceToTo) {
                command.amount = number;
              }
            } else if (fromTokenIndex !== -1) {
              // Only fromToken found, assign number to it
              command.amount = number;
            } else if (toTokenIndex !== -1) {
              // Only toToken found, but it's likely the amount for fromToken
              command.amount = number;
            }
          });

          if (command.amount) {
            command.confidence += 0.2;
          }
        }
      }

      return command;
    },
    [findTokenByText, detectAction]
  );

  // Generate suggestions based on current query
  const suggestions = useMemo((): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase().trim();

    if (!queryLower) {
      // Default suggestions when empty
      return [
        {
          type: 'action',
          title: 'Swap tokens',
          subtitle: 'Exchange one token for another',
          icon: <ArrowRight className="w-4 h-4" />,
          onSelect: () => {
            setQuery('swap ');
            inputRef.current?.focus();
          },
        },
        {
          type: 'action',
          title: 'Stake tokens',
          subtitle: 'Earn rewards by staking',
          icon: <TrendingUp className="w-4 h-4" />,
          onSelect: () => {
            setQuery('stake ');
            inputRef.current?.focus();
          },
        },
        {
          type: 'action',
          title: 'View pools',
          subtitle: 'Browse liquidity pools',
          icon: <Zap className="w-4 h-4" />,
          onSelect: () => {
            void router.push('/pools');
            setIsOpen(false);
          },
        },
        {
          type: 'utility',
          title: 'Receive tokens',
          subtitle: 'Copy wallet address',
          icon: <Copy className="w-4 h-4" />,
          onSelect: () => {
            // TODO: Implement wallet address copy
            console.log('Copy wallet address');
            setIsOpen(false);
          },
        },
      ];
    }

    const parsedCommand = parseCommand(query);

    // Show action suggestions if no clear action detected
    if (!parsedCommand.action) {
      // Match action keywords
      Object.entries(ACTION_KEYWORDS).forEach(([action, keywords]) => {
        const matchingKeywords = keywords.filter((keyword) => keyword.includes(queryLower));
        if (matchingKeywords.length > 0) {
          const actionIcons = {
            swap: <ArrowRight className="w-4 h-4" />,
            pool: <Zap className="w-4 h-4" />,
            stake: <TrendingUp className="w-4 h-4" />,
            deposit: <Plus className="w-4 h-4" />,
            withdraw: <Minus className="w-4 h-4" />,
            send: <Send className="w-4 h-4" />,
            receive: <Copy className="w-4 h-4" />,
          };

          suggestions.push({
            type: 'action',
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} tokens`,
            subtitle: `Start ${action} command`,
            icon: actionIcons[action as keyof typeof actionIcons],
            onSelect: () => {
              setQuery(`${keywords[0]} `);
              inputRef.current?.focus();
            },
          });
        }
      });

      // Navigation suggestions
      if ('pools'.includes(queryLower)) {
        suggestions.push({
          type: 'navigation',
          title: 'Go to Pools',
          subtitle: 'Browse liquidity pools',
          icon: <Zap className="w-4 h-4" />,
          onSelect: () => {
            void router.push('/pools');
            setIsOpen(false);
          },
        });
      }

      // Social suggestions
      if ('social'.includes(queryLower) || 'community'.includes(queryLower)) {
        suggestions.push({
          type: 'action',
          title: 'Social links',
          subtitle: 'View community links',
          icon: <ExternalLink className="w-4 h-4" />,
          onSelect: () => {
            setQuery('social ');
            inputRef.current?.focus();
          },
        });
      }

      // Show individual social links if query starts with 'social'
      if (queryLower.startsWith('social ')) {
        SOCIAL_LINKS.forEach((social) => {
          if (social.name.toLowerCase().includes(queryLower.substring(7))) {
            suggestions.push({
              type: 'social',
              title: social.name,
              subtitle: 'Open in new tab',
              icon: <span className="text-sm">{social.icon}</span>,
              url: social.url,
              onSelect: () => {
                window.open(social.url, '_blank');
                setIsOpen(false);
              },
            });
          }
        });
      }
    }

    // If we have a complete command, show execute option
    if (parsedCommand.confidence > 0.7 && parsedCommand.fromToken && parsedCommand.toToken) {
      suggestions.unshift({
        type: 'command',
        title: `${parsedCommand.action?.charAt(0).toUpperCase()}${parsedCommand.action?.slice(1)} ${
          parsedCommand.amount || ''
        } ${parsedCommand.fromToken.symbol} → ${parsedCommand.toToken.symbol}`,
        subtitle: 'Execute this command',
        icon: <Zap className="w-4 h-4 text-green-400" />,
        command: parsedCommand,
        onSelect: () => void executeCommand(parsedCommand),
      });
    }

    // FIXED: Show relevant tokens if we have an action but incomplete tokens
    if (
      parsedCommand.action &&
      ['swap', 'stake', 'deposit', 'withdraw', 'send'].includes(parsedCommand.action)
    ) {
      // Remove action keyword and numbers to get clean token search
      let remainingQuery = query.toLowerCase();

      // Remove action keyword
      for (const keywords of Object.values(ACTION_KEYWORDS)) {
        for (const keyword of keywords) {
          if (remainingQuery.startsWith(keyword + ' ')) {
            remainingQuery = remainingQuery.substring(keyword.length + 1);
            break;
          }
        }
      }

      // Remove numbers and common words to focus on token search
      remainingQuery = remainingQuery
        .replace(/\b\d+(\.\d+)?\b/g, '') // Remove numbers
        .replace(/\b(for|to|from|with)\b/g, '') // Remove directional words
        .trim();

      // Get the last word as the search term
      const words = remainingQuery.split(/\s+/).filter((word) => word.length > 0);
      const lastWord = words[words.length - 1] || '';

      if (lastWord.length > 0) {
        const matchingTokens = TOKENS.filter((token) => {
          const symbolMatch = token.symbol.toLowerCase().includes(lastWord);
          const nameMatch = token.name?.toLowerCase().includes(lastWord);
          return symbolMatch || nameMatch;
        }).slice(0, 5);

        matchingTokens.forEach((token) => {
          // Build suggestion based on current parsing state
          let suggestionQuery = '';
          const currentAmount = parsedCommand.amount || '';

          if (!parsedCommand.fromToken) {
            // First token - suggest as fromToken
            suggestionQuery = `${parsedCommand.action} ${currentAmount} ${token.symbol} for `;
          } else if (!parsedCommand.toToken) {
            // Second token - suggest as toToken
            const baseQuery = query.replace(/\s+[^\s]*$/, ''); // Remove last word
            suggestionQuery = `${baseQuery} ${token.symbol}`;
          }

          if (suggestionQuery) {
            suggestions.push({
              type: 'token',
              title: token.symbol,
              subtitle: token.name || '',
              token,
              onSelect: () => {
                setQuery(suggestionQuery.trim());
                inputRef.current?.focus();
              },
            });
          }
        });
      }
    }

    return suggestions.slice(0, 8); // Limit total suggestions
  }, [query, parseCommand, router]);

  // Execute a parsed command with proper loading state management
  const executeCommand = useCallback(
    async (command: ParsedCommand) => {
      if (command.action === 'swap' && command.fromToken && command.toToken) {
        setIsLoading(true);

        try {
          // Set up the swap form first
          setTokenInputProperty('swap.pay', 'tokenAddress', command.fromToken.address);
          setTokenInputProperty('swap.receive', 'tokenAddress', command.toToken.address);

          if (command.amount) {
            setTokenInputProperty('swap.pay', 'amount', command.amount);
          }

          // Navigate to swap page if not already there
          if (router.pathname !== '/') {
            await router.push('/');
          }

          // Close the dropdown but keep the query
          setIsOpen(false);

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
                  console.log('❌ Estimation complete but output is 0 - possible liquidity issue');
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
            // Only reset loading state after successful completion
            setIsLoading(false);
            setQuery('');
          } catch (error) {
            console.error('Swap execution failed:', error);
            setIsLoading(false);
            // Show error but don't clear query so user can try again
          }
        } catch (error) {
          console.error('Error executing command:', error);
          setIsLoading(false);
        }
      }
      // TODO: Add other command executions (stake, deposit, withdraw, send)
    },
    [setTokenInputProperty, router, handleSwapClick, isEstimating, estimatedOutput]
  );

  // Voice input functions
  const startListening = useCallback(() => {
    if (recognition && !isListening && isVoiceSupported) {
      recognition.start();
    }
  }, [recognition, isListening, isVoiceSupported]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  // Handle keyboard navigation with proper completion
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || isLoading) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            const suggestion = suggestions[selectedIndex];

            // For command suggestions, complete the query first, then execute
            if (suggestion.type === 'command' && suggestion.command) {
              // First complete the query to show full command
              const fullCommand = `${suggestion.command.action} ${
                suggestion.command.amount || ''
              } ${suggestion.command.fromToken?.symbol || ''} for ${
                suggestion.command.toToken?.symbol || ''
              }`.trim();
              setQuery(fullCommand);

              // Then execute after a brief delay to show completion
              setTimeout(() => {
                void executeCommand(suggestion.command!);
              }, 100);
            } else {
              // For other suggestions, execute normally
              suggestion?.onSelect();
            }
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, isLoading, suggestions, selectedIndex, executeCommand]
  );

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isOpen]);

  // Handle input focus/blur with improved timing
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Don't close immediately on blur - let click handlers work
    setTimeout(() => {
      if (!isLoading) {
        setIsOpen(false);
      }
    }, 150);
  }, [isLoading]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    suggestion.onSelect();
    // Keep dropdown open after selection unless it's a command execution or navigation
    if (
      suggestion.type !== 'command' &&
      suggestion.type !== 'navigation' &&
      suggestion.type !== 'social'
    ) {
      setTimeout(() => {
        setIsOpen(true);
        inputRef.current?.focus();
      }, 50);
    }
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
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
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              if (!isLoading) {
                setQuery(e.target.value);
                setIsOpen(true);
              }
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Executing command...' : placeholder}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-adamant-text-box-secondary/50 disabled:cursor-not-allowed"
          />
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 text-adamant-accentText animate-spin" />}

            {/* Voice input button - only show when focused and voice is supported */}
            {isFocused && isVoiceSupported && !isLoading && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`p-1 rounded transition-colors ${
                  isListening
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-adamant-text-box-secondary hover:text-adamant-accentText'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              </button>
            )}

            {query && !isLoading && (
              <button
                onClick={() => setQuery('')}
                className="text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors"
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

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && !isLoading && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 ${INPUT_STYLES.infoContainer} max-h-80 overflow-y-auto z-50 shadow-xl
            transition-all duration-200 ease-out`}
          style={{
            opacity: 1,
            transform: 'translateY(0)',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.title}-${index}`}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-150 ${
                index === selectedIndex
                  ? 'bg-adamant-accentText/10 border-l-2 border-adamant-accentText'
                  : 'hover:bg-adamant-app-input/50'
              } ${index > 0 ? 'border-t border-adamant-box-border/30' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion.token ? (
                <TokenImageWithFallback
                  tokenAddress={suggestion.token.address}
                  size={24}
                  alt={suggestion.token.symbol}
                />
              ) : (
                <div className="w-6 h-6 flex items-center justify-center text-adamant-accentText">
                  {suggestion.icon}
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
                suggestion.type === 'social') && (
                <ArrowRight className="w-4 h-4 text-adamant-accentText" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSearchBox;
