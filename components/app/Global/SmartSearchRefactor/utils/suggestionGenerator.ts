import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { NextRouter } from 'next/router';
import { ACTION_KEYWORDS } from '../constants/actionKeywords';
import { SOCIAL_LINKS } from '../constants/socialLinks';
import { ParsedCommand, SearchSuggestion } from '../types';

interface SuggestionGeneratorProps {
  query: string;
  parsedCommand: ParsedCommand;
  router: NextRouter;
  executeCommand: (command: ParsedCommand) => Promise<void>;
  setQuery: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Generate suggestions based on current query
 * Extracted from original SmartSearchBox suggestions useMemo
 * FIXED: Better spacing and same-token prevention
 */
export function generateSuggestions({
  query,
  parsedCommand,
  router,
  executeCommand,
  setQuery,
  inputRef,
}: SuggestionGeneratorProps): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  const queryLower = query.toLowerCase().trim();

  if (!queryLower) {
    // Default suggestions when empty
    return [
      {
        type: 'action',
        title: 'Swap tokens',
        subtitle: 'Exchange one token for another',
        icon: 'ArrowRight',
        onSelect: () => {
          setQuery('swap ');
          inputRef.current?.focus();
        },
      },
      {
        type: 'action',
        title: 'Stake tokens',
        subtitle: 'Earn rewards by staking',
        icon: 'TrendingUp',
        onSelect: () => {
          setQuery('stake ');
          inputRef.current?.focus();
        },
      },
      {
        type: 'action',
        title: 'View pools',
        subtitle: 'Browse liquidity pools',
        icon: 'Zap',
        onSelect: () => {
          void router.push('/pools');
        },
      },
      {
        type: 'utility',
        title: 'Receive tokens',
        subtitle: 'Copy wallet address',
        icon: 'Copy',
        onSelect: () => {
          // TODO: Implement wallet address copy
          console.log('Copy wallet address');
        },
      },
    ];
  }

  // Show action suggestions if no clear action detected
  if (!parsedCommand.action) {
    // Match action keywords
    Object.entries(ACTION_KEYWORDS).forEach(([action, keywords]) => {
      const matchingKeywords = keywords.filter((keyword) => keyword.includes(queryLower));
      if (matchingKeywords.length > 0) {
        const actionIcons = {
          swap: 'ArrowRight',
          pool: 'Zap',
          stake: 'TrendingUp',
          deposit: 'Plus',
          withdraw: 'Minus',
          send: 'Send',
          receive: 'Copy',
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
        icon: 'Zap',
        onSelect: () => {
          void router.push('/pools');
        },
      });
    }

    // Social suggestions
    if ('social'.includes(queryLower) || 'community'.includes(queryLower)) {
      suggestions.push({
        type: 'action',
        title: 'Social links',
        subtitle: 'View community links',
        icon: 'ExternalLink',
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
            icon: social.icon,
            url: social.url,
            onSelect: () => {
              window.open(social.url, '_blank');
            },
          });
        }
      });
    }
  }

  // If we have a complete command, show execute option
  if (parsedCommand.confidence > 0.5 && parsedCommand.fromToken && parsedCommand.toToken) {
    // Determine which token the amount belongs to based on the original query
    let fromTokenDisplay = parsedCommand.fromToken.symbol;
    let toTokenDisplay = parsedCommand.toToken.symbol;

    if (parsedCommand.amount) {
      // Check if amount appears after "for" keyword (belongs to toToken)
      const queryLower = parsedCommand.query.toLowerCase();
      const forIndex = queryLower.indexOf(' for ');
      const amountIndex = queryLower.indexOf(parsedCommand.amount);

      if (forIndex !== -1 && amountIndex > forIndex) {
        // Amount appears after "for", so it belongs to toToken
        toTokenDisplay = `${parsedCommand.amount} ${parsedCommand.toToken.symbol}`;
      } else {
        // Amount appears before "for" or no "for", so it belongs to fromToken
        fromTokenDisplay = `${parsedCommand.amount} ${parsedCommand.fromToken.symbol}`;
      }
    }

    suggestions.unshift({
      type: 'command',
      title: `${parsedCommand.action?.charAt(0).toUpperCase()}${parsedCommand.action?.slice(
        1
      )} ${fromTokenDisplay} → ${toTokenDisplay}`,
      subtitle: 'Execute this command',
      icon: 'Zap',
      command: parsedCommand,
      onSelect: () => void executeCommand(parsedCommand),
    });
  }

  // IMPROVED: Show relevant tokens if we have an action but incomplete tokens
  if (
    parsedCommand.action &&
    ['swap', 'stake', 'deposit', 'withdraw', 'send'].includes(parsedCommand.action)
  ) {
    // Special handling for deposit action to suggest pools
    const isDepositAction = parsedCommand.action === 'deposit';
    const hasConnector = queryLower.includes(' in');

    if (isDepositAction && hasConnector && parsedCommand.fromToken) {
      const fromToken = parsedCommand.fromToken;
      const poolSearchTerm = query.substring(query.toLowerCase().lastIndexOf(' in') + 3).trim();

      const matchingPools = LIQUIDITY_PAIRS.filter(
        (p) =>
          (p.token0 === fromToken.symbol || p.token1 === fromToken.symbol) &&
          p.symbol.toLowerCase().includes(poolSearchTerm.toLowerCase())
      );

      matchingPools.forEach((pool) => {
        suggestions.push({
          type: 'pool',
          title: pool.symbol,
          subtitle: `Deposit into the ${pool.token0}/${pool.token1} pool`,
          pool: pool,
          icon: 'Zap',
          onSelect: () => {
            // Create a command object for the executeCommand function to handle
            const depositCommand = {
              ...parsedCommand,
              target: pool.pairContract,
            };
            void executeCommand(depositCommand);
          },
        });
      });

      // Return early with only pool suggestions
      return suggestions.slice(0, 8);
    }

    // Parse the current query more carefully to preserve amounts and existing tokens

    // Remove action keyword
    let actionKeywordLength = 0;
    for (const keywords of Object.values(ACTION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (query.toLowerCase().startsWith(keyword + ' ')) {
          actionKeywordLength = keyword.length + 1;
          break;
        }
      }
      if (actionKeywordLength > 0) break;
    }

    const afterAction = query.substring(actionKeywordLength);
    const afterActionWords = afterAction.split(/\s+/).filter((word) => word.length > 0);

    // Find the last incomplete word that could be a token
    let searchTerm = '';
    let queryBase = query;

    if (afterActionWords.length > 0) {
      const lastWord = afterActionWords[afterActionWords.length - 1];

      if (lastWord) {
        // Check if the last word is an incomplete token (not a complete token and not a number)
        const isNumber = /^\d+(\.\d+)?$/.test(lastWord);
        const isCompleteToken = TOKENS.some(
          (token) => token.symbol.toLowerCase() === lastWord.toLowerCase()
        );

        if (!isNumber && !isCompleteToken && lastWord.length > 0) {
          searchTerm = lastWord.toLowerCase();
          // Remove the incomplete word from the base query
          queryBase = query.substring(0, query.lastIndexOf(lastWord)).trim();
        }
      }
    }

    if (searchTerm.length > 0) {
      // FIXED: Filter out tokens that would create same-token swaps
      const matchingTokens = TOKENS.filter((token) => {
        const symbolMatch = token.symbol.toLowerCase().includes(searchTerm);
        const nameMatch = token.name?.toLowerCase().includes(searchTerm);

        // PREVENT same token suggestions
        const isFromTokenMatch =
          parsedCommand.fromToken && token.symbol === parsedCommand.fromToken.symbol;
        const isToTokenMatch =
          parsedCommand.toToken && token.symbol === parsedCommand.toToken.symbol;

        if (isFromTokenMatch || isToTokenMatch) {
          return false;
        }

        return symbolMatch || nameMatch;
      }).slice(0, 5);

      matchingTokens.forEach((token) => {
        // IMPROVED: Build suggestion based on current parsing state while preserving amounts
        let suggestionQuery = '';

        if (!parsedCommand.fromToken) {
          // First token - preserve any amount that was already parsed
          const baseWithToken = `${queryBase} ${token.symbol}`.trim();

          // Choose appropriate connector based on action type
          let connector = '';
          if (parsedCommand.action === 'deposit') {
            connector = 'in ';
          } else if (parsedCommand.action === 'stake') {
            connector = ''; // Don't add connector for stake
          } else if (parsedCommand.action === 'withdraw') {
            connector = 'from ';
          } else if (parsedCommand.action === 'send') {
            connector = 'to ';
          } else {
            // Default for swap and other actions
            connector = 'for ';
          }

          suggestionQuery = `${baseWithToken} ${connector}`;
        } else if (!parsedCommand.toToken) {
          // Second token - preserve the existing structure
          suggestionQuery = `${queryBase} ${token.symbol}`;
        }

        if (suggestionQuery) {
          suggestions.push({
            type: 'token',
            title: token.symbol,
            subtitle: token.name || '',
            token,
            onSelect: () => {
              setQuery(suggestionQuery);
              inputRef.current?.focus();
            },
          });
        }
      });
    }
  }

  return suggestions.slice(0, 8); // Limit total suggestions
}
