import { LIQUIDITY_PAIRS, TOKENS } from '@/config/tokens';
import { NextRouter } from 'next/router';
import { ACTION_KEYWORDS } from '../constants/actionKeywords';
import { ActionType, CommandStep, StepSuggestion } from '../types';
import { analyzeCommandState } from './commandStateMachine';

interface StepSuggestionGeneratorProps {
  query: string;
  router: NextRouter;
  executeCommand: (commandStep: CommandStep, mode?: 'execute' | 'fill') => Promise<void>;
  setQuery: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Generate step-based suggestions that guide users through command construction
 */
export function generateStepSuggestions({
  query,
  router,
  executeCommand,
  setQuery,
  inputRef,
}: StepSuggestionGeneratorProps): StepSuggestion[] {
  const suggestions: StepSuggestion[] = [];
  const commandStep = analyzeCommandState(query);

  // Generate suggestions based on current state
  switch (commandStep.state) {
    case 'initial':
      return generateInitialSuggestions(setQuery, inputRef, router);

    case 'action_partial':
      return generateActionSuggestions(query, setQuery, inputRef);

    case 'action_complete':
      return generatePostActionSuggestions(commandStep, setQuery, inputRef);

    case 'amount_partial':
      return generateAmountSuggestions(commandStep, query, setQuery, inputRef);

    case 'amount_complete':
      return generateTokenAfterAmountSuggestions(commandStep, setQuery, inputRef);

    case 'from_token_partial':
      return generateFromTokenSuggestions(commandStep, query, setQuery, inputRef);

    case 'from_token_complete':
      return generateAfterFromTokenSuggestions(commandStep, setQuery, inputRef, executeCommand);

    case 'connector_added':
      return generateAfterConnectorSuggestions(commandStep, setQuery, inputRef);

    case 'to_token_partial':
      return generateToTokenSuggestions(commandStep, query, setQuery, inputRef);

    case 'to_token_complete':
    case 'command_ready':
      return generateExecutionSuggestions(commandStep, executeCommand);

    default:
      return [];
  }
}

/**
 * Initial suggestions when the field is empty
 */
function generateInitialSuggestions(
  setQuery: (query: string) => void,
  inputRef: React.RefObject<HTMLInputElement>,
  router: NextRouter
): StepSuggestion[] {
  return [
    {
      type: 'action',
      title: 'Swap tokens',
      subtitle: 'Exchange one token for another',
      icon: 'ArrowRight',
      isPrimary: true,
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
      title: 'Add liquidity',
      subtitle: 'Deposit tokens into pools',
      icon: 'Plus',
      onSelect: () => {
        setQuery('deposit ');
        inputRef.current?.focus();
      },
    },
    {
      type: 'navigation',
      title: 'View pools',
      subtitle: 'Browse liquidity pools',
      icon: 'Zap',
      onSelect: () => {
        void router.push('/pools');
      },
    },
  ];
}

/**
 * Action suggestions when user is typing an action
 */
function generateActionSuggestions(
  query: string,
  setQuery: (query: string) => void,
  inputRef: React.RefObject<HTMLInputElement>
): StepSuggestion[] {
  const suggestions: StepSuggestion[] = [];
  const queryLower = query.toLowerCase().trim();

  // Find matching actions
  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (keyword.startsWith(queryLower) && keyword !== queryLower) {
        suggestions.push({
          type: 'action',
          title: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          subtitle: getActionDescription(action as ActionType),
          icon: getActionIcon(action as ActionType),
          value: keyword,
          onSelect: () => {
            setQuery(keyword + ' ');
            inputRef.current?.focus();
          },
        });
        break; // Only add one keyword per action
      }
    }
  }

  return suggestions.slice(0, 5);
}

/**
 * Suggestions after an action is completed
 */
function generatePostActionSuggestions(
  commandStep: CommandStep,
  setQuery: (query: string) => void,
  inputRef: React.RefObject<HTMLInputElement>
): StepSuggestion[] {
  const suggestions: StepSuggestion[] = [];
  const baseQuery = getBaseQuery(commandStep);

  // Always suggest adding an amount (optional)
  suggestions.push({
    type: 'continuation',
    title: 'Add amount (optional)',
    subtitle: 'Specify how much to ' + commandStep.action,
    icon: 'Plus',
    isOptional: true,
    onSelect: () => {
      // Just add a space and keep cursor ready for typing
      if (!baseQuery.endsWith(' ')) {
        setQuery(baseQuery + ' ');
      }
      inputRef.current?.focus();
    },
  });

  // Suggest popular tokens
  const relevantTokens = getRelevantTokensForAction(commandStep.action!);
  relevantTokens.slice(0, 4).forEach((token) => {
    suggestions.push({
      type: 'token',
      title: token.symbol,
      subtitle: token.name || '',
      token,
      onSelect: () => {
        const connector = getConnectorForAction(commandStep.action!);
        setQuery(`${baseQuery} ${token.symbol} ${connector}`);
        inputRef.current?.focus();
      },
    });
  });

  return suggestions;
}

/**
 * Amount suggestions when user is typing an amount
 */
function generateAmountSuggestions(
  commandStep: CommandStep,
  query: string,
  setQuery: (query: string) => void,
  inputRef: React.RefObject<HTMLInputElement>
): StepSuggestion[] {
  const suggestions: StepSuggestion[] = [];

  // Extract the partial amount
  const words = query.trim().split(/\s+/);
  const partialAmount = words[words.length - 1] || '';

  // Suggest completing the amount
  suggestions.push({
    type: 'amount',
    title: 'Continue typing amount',
    subtitle: 'Enter the amount you want to ' + commandStep.action,
    icon: 'Plus',
    isPrimary: true,
    onSelect: () => {
      // Just focus, let them continue typing
      inputRef.current?.focus();
    },
  });

  // If they have typed some digits, offer to continue to token selection
  if (/^\d+\.?$/.test(partialAmount)) {
    suggestions.push({
      type: 'continuation',
      title: 'Continue to token selection',
      subtitle: 'Choose which token to ' + commandStep.action,
      icon: 'ArrowRight',
      onSelect: () => {
        // Complete the amount by adding a space if needed, then show token suggestions
        const baseQuery = query.substring(0, query.lastIndexOf(partialAmount));
        const finalAmount = partialAmount.endsWith('.')
          ? partialAmount.slice(0, -1)
          : partialAmount;
        setQuery(`${baseQuery}${finalAmount} `);
        inputRef.current?.focus();
      },
    });
  }

  // Suggest common amounts if they have some digits
  if (/^\d+$/.test(partialAmount)) {
    const baseAmount = parseInt(partialAmount);
    const amounts = [baseAmount, baseAmount * 10, baseAmount * 100].filter(
      (amount) => amount <= 10000
    );

    amounts.forEach((amount) => {
      suggestions.push({
        type: 'amount',
        title: amount.toString(),
        subtitle: `Use ${amount} as amount`,
        icon: 'ArrowRight',
        onSelect: () => {
          const baseQuery = query.substring(0, query.lastIndexOf(partialAmount));
          setQuery(`${baseQuery}${amount} `);
          inputRef.current?.focus();
        },
      });
    });
  }

  return suggestions.slice(0, 4);
}

/**
 * Token suggestions after amount is completed
 */
function generateTokenAfterAmountSuggestions(
  commandStep: CommandStep,
  setQuery: (query: string) => void,
  inputRef: React.RefObject<HTMLInputElement>
): StepSuggestion[] {
  const suggestions: StepSuggestion[] = [];
  const baseQuery = getBaseQuery(commandStep);

  // Show tokens directly without a placeholder "Select token" option
  const relevantTokens = getRelevantTokensForAction(commandStep.action!);
  relevantTokens.slice(0, 6).forEach((token, index) => {
    suggestions.push({
      type: 'token',
      title: token.symbol,
      subtitle: token.name || '',
      token,
      isPrimary: index === 0, // Mark first token as primary
      onSelect: () => {
        const connector = getConnectorForAction(commandStep.action!);
        setQuery(`${baseQuery} ${token.symbol} ${connector}`);
        inputRef.current?.focus();
      },
    });
  });

  return suggestions;
}

/**
 * Token suggestions when user is typing a token
 */
function generateFromTokenSuggestions(
  commandStep: CommandStep,
  query: string,
  setQuery: (query: string) => void,
  inputRef: React.RefObject<HTMLInputElement>
): StepSuggestion[] {
  const suggestions: StepSuggestion[] = [];

  // Extract search term (preserve original case)
  const words = query.trim().split(/\s+/);
  const originalSearchTerm = words[words.length - 1] || '';
  const searchTermLower = originalSearchTerm.toLowerCase();

  if (originalSearchTerm.length === 0) {
    return generateTokenAfterAmountSuggestions(commandStep, setQuery, inputRef);
  }

  // Find matching tokens
  const matchingTokens = TOKENS.filter((token) => {
    const symbolMatch = token.symbol.toLowerCase().includes(searchTermLower);
    const nameMatch = token.name?.toLowerCase().includes(searchTermLower);
    return symbolMatch || nameMatch;
  }).slice(0, 6);

  matchingTokens.forEach((token) => {
    suggestions.push({
      type: 'token',
      title: token.symbol,
      subtitle: token.name || '',
      token,
      onSelect: () => {
        // Find the last occurrence of the original search term (case-sensitive)
        const lastIndex = query.lastIndexOf(originalSearchTerm);
        if (lastIndex !== -1) {
          const baseQuery = query.substring(0, lastIndex);
          const connector = getConnectorForAction(commandStep.action!);
          setQuery(`${baseQuery}${token.symbol} ${connector}`);
        } else {
          // Fallback: just append the token with connector
          const connector = getConnectorForAction(commandStep.action!);
          setQuery(`${query} ${token.symbol} ${connector}`);
        }
        inputRef.current?.focus();
      },
    });
  });

  return suggestions;
}

/**
 * Suggestions after from token is completed
 */
function generateAfterFromTokenSuggestions(
  commandStep: CommandStep,
  setQuery: (query: string) => void,
  inputRef: React.RefObject<HTMLInputElement>,
  executeCommand: (commandStep: CommandStep, mode?: 'execute' | 'fill') => Promise<void>
): StepSuggestion[] {
  const suggestions: StepSuggestion[] = [];
  const baseQuery = getBaseQuery(commandStep);
  const connector = getConnectorForAction(commandStep.action!);

  if (commandStep.action === 'stake') {
    // For stake, command is ready
    return generateExecutionSuggestions(commandStep, executeCommand);
  }

  suggestions.push({
    type: 'continuation',
    title: `Continue with "${connector.trim()}"`,
    subtitle: getConnectorDescription(commandStep.action!, connector),
    icon: 'ArrowRight',
    isPrimary: true,
    onSelect: () => {
      setQuery(`${baseQuery} ${connector}`);
      inputRef.current?.focus();
    },
  });

  return suggestions;
}

/**
 * Suggestions after connector is added
 */
function generateAfterConnectorSuggestions(
  commandStep: CommandStep,
  setQuery: (query: string) => void,
  inputRef: React.RefObject<HTMLInputElement>
): StepSuggestion[] {
  const suggestions: StepSuggestion[] = [];

  if (commandStep.action === 'swap') {
    // For swap, only suggest tokens after "for" (no target amount)
    const availableTokens = TOKENS.filter(
      (token) => !commandStep.fromToken || token.symbol !== commandStep.fromToken.symbol
    ).slice(0, 6);

    availableTokens.forEach((token, index) => {
      suggestions.push({
        type: 'token',
        title: token.symbol,
        subtitle: token.name || '',
        token,
        isPrimary: index === 0, // Mark first token as primary
        onSelect: () => {
          const queryWithConnector = getQueryWithConnector(commandStep);
          // Now append the token: "swap sSCRT for" + " " + "sATOM" = "swap sSCRT for sATOM"
          setQuery(`${queryWithConnector} ${token.symbol}`);
          inputRef.current?.focus();
        },
      });
    });
  } else {
    // For other actions (deposit, withdraw, send), suggest appropriate targets (pools, etc.)
    if (commandStep.action === 'deposit' && commandStep.fromToken) {
      // Show pools that contain the fromToken
      const availablePools = LIQUIDITY_PAIRS.filter(
        (pool) =>
          pool.token0 === commandStep.fromToken!.symbol ||
          pool.token1 === commandStep.fromToken!.symbol
      ).slice(0, 6);

      if (availablePools.length > 0) {
        availablePools.forEach((pool, index) => {
          suggestions.push({
            type: 'pool',
            title: pool.symbol,
            subtitle: `Deposit into the ${pool.token0}/${pool.token1} pool`,
            pool,
            isPrimary: index === 0,
            onSelect: () => {
              const queryWithConnector = getQueryWithConnector(commandStep);
              setQuery(`${queryWithConnector} ${pool.symbol}`);
              inputRef.current?.focus();
            },
          });
        });
      } else {
        // Fallback if no pools found for this token
        suggestions.push({
          type: 'continuation',
          title: 'No pools available',
          subtitle: `No liquidity pools found for ${commandStep.fromToken.symbol}`,
          icon: 'ArrowRight',
          onSelect: () => {
            inputRef.current?.focus();
          },
        });
      }
    } else {
      // For other actions (withdraw, send), suggest generic target
      suggestions.push({
        type: 'continuation',
        title: 'Specify target',
        subtitle: getTargetDescription(commandStep.action!),
        icon: 'ArrowRight',
        isPrimary: true,
        onSelect: () => {
          inputRef.current?.focus();
        },
      });
    }
  }

  return suggestions;
}

/**
 * Target token suggestions for swap
 */
function generateToTokenSuggestions(
  commandStep: CommandStep,
  query: string,
  setQuery: (query: string) => void,
  inputRef: React.RefObject<HTMLInputElement>
): StepSuggestion[] {
  const suggestions: StepSuggestion[] = [];

  // Extract search term (preserve original case)
  const words = query.trim().split(/\s+/);
  const originalSearchTerm = words[words.length - 1] || '';
  const searchTermLower = originalSearchTerm.toLowerCase();

  // Find matching tokens (excluding from token)
  const matchingTokens = TOKENS.filter((token) => {
    const symbolMatch = token.symbol.toLowerCase().includes(searchTermLower);
    const nameMatch = token.name?.toLowerCase().includes(searchTermLower);
    const notFromToken = !commandStep.fromToken || token.symbol !== commandStep.fromToken.symbol;
    return (symbolMatch || nameMatch) && notFromToken;
  }).slice(0, 6);

  matchingTokens.forEach((token) => {
    suggestions.push({
      type: 'token',
      title: token.symbol,
      subtitle: token.name || '',
      token,
      onSelect: () => {
        // Find the last occurrence of the original search term (case-sensitive)
        const lastIndex = query.lastIndexOf(originalSearchTerm);
        if (lastIndex !== -1) {
          const baseQuery = query.substring(0, lastIndex);
          const afterQuery = query.substring(lastIndex + originalSearchTerm.length);
          setQuery(`${baseQuery}${token.symbol}${afterQuery}`);
        } else {
          // Fallback: just append the token
          setQuery(`${query} ${token.symbol}`);
        }
        inputRef.current?.focus();
      },
    });
  });

  return suggestions;
}

/**
 * Execution suggestions when command is ready
 */
function generateExecutionSuggestions(
  commandStep: CommandStep,
  executeCommand: (commandStep: CommandStep, mode?: 'execute' | 'fill') => Promise<void>
): StepSuggestion[] {
  const suggestions: StepSuggestion[] = [];

  // Validate that the command is actually ready and valid
  if (!commandStep.action || !commandStep.fromToken) {
    return suggestions; // No suggestions if basic requirements not met
  }

  // For swap, ensure we have a valid toToken
  if (commandStep.action === 'swap' && !commandStep.toToken) {
    return suggestions; // No execution suggestions if toToken is missing for swap
  }

  // Verify tokens exist in our configuration
  const fromTokenExists = TOKENS.some((token) => token.symbol === commandStep.fromToken?.symbol);
  const toTokenExists =
    !commandStep.toToken || TOKENS.some((token) => token.symbol === commandStep.toToken?.symbol);

  if (!fromTokenExists || !toTokenExists) {
    return suggestions; // Don't show execution if tokens don't exist
  }

  // Primary execution option
  suggestions.push({
    type: 'completion',
    title: `Execute ${commandStep.action}`,
    subtitle: getExecutionDescription(commandStep),
    icon: 'Send',
    isPrimary: true,
    onSelect: () => {
      void executeCommand(commandStep, 'execute');
    },
  });

  // Alternative: Fill form
  suggestions.push({
    type: 'completion',
    title: 'Fill form',
    subtitle: 'Pre-fill the form with these values',
    icon: 'ArrowRight',
    onSelect: () => {
      void executeCommand(commandStep, 'fill');
    },
  });

  return suggestions;
}

// Helper functions

function getBaseQuery(commandStep: CommandStep): string {
  const parts = [];

  if (commandStep.action) {
    // Find the actual keyword used
    const actionKeywords = ACTION_KEYWORDS[commandStep.action];
    parts.push(actionKeywords[0]); // Use the first keyword as default
  }

  if (commandStep.amount) {
    parts.push(commandStep.amount);
  }

  if (commandStep.fromToken) {
    parts.push(commandStep.fromToken.symbol);
  }

  // Include connector if we're in connector_added state or beyond
  if (
    commandStep.state === 'connector_added' ||
    commandStep.state === 'to_token_partial' ||
    commandStep.state === 'to_token_complete' ||
    commandStep.state === 'command_ready'
  ) {
    const connector = getConnectorForAction(commandStep.action!);
    if (connector) {
      parts.push(connector.trim()); // Add connector without trailing space
    }
  }

  return parts.join(' ');
}

/**
 * Get the query with connector for token suggestions after connector
 */
function getQueryWithConnector(commandStep: CommandStep): string {
  const parts = [];

  if (commandStep.action) {
    const actionKeywords = ACTION_KEYWORDS[commandStep.action];
    parts.push(actionKeywords[0]);
  }

  if (commandStep.amount) {
    parts.push(commandStep.amount);
  }

  if (commandStep.fromToken) {
    parts.push(commandStep.fromToken.symbol);
  }

  // Always add connector for this specific case
  const connector = getConnectorForAction(commandStep.action!);
  if (connector) {
    parts.push(connector.trim());
  }

  return parts.join(' ');
}

function getActionDescription(action: ActionType): string {
  switch (action) {
    case 'swap':
      return 'Exchange one token for another';
    case 'stake':
      return 'Earn rewards by staking';
    case 'deposit':
      return 'Add liquidity to pools';
    case 'withdraw':
      return 'Remove liquidity from pools';
    case 'send':
      return 'Transfer tokens to address';
    default:
      return '';
  }
}

function getActionIcon(action: ActionType): string {
  switch (action) {
    case 'swap':
      return 'ArrowRight';
    case 'stake':
      return 'TrendingUp';
    case 'deposit':
      return 'Plus';
    case 'withdraw':
      return 'Minus';
    case 'send':
      return 'Send';
    default:
      return 'ArrowRight';
  }
}

function getRelevantTokensForAction(action: ActionType) {
  // Return popular tokens for the action
  // For now, return a subset of all tokens
  return TOKENS.slice(0, 8);
}

function getConnectorForAction(action: ActionType): string {
  switch (action) {
    case 'swap':
      return 'for ';
    case 'deposit':
      return 'in ';
    case 'withdraw':
      return 'from ';
    case 'send':
      return 'to ';
    default:
      return '';
  }
}

function getConnectorDescription(action: ActionType, connector: string): string {
  switch (action) {
    case 'swap':
      return 'Specify what token to receive';
    case 'deposit':
      return 'Select which pool to deposit into';
    case 'withdraw':
      return 'Select which pool to withdraw from';
    case 'send':
      return 'Specify recipient address';
    default:
      return '';
  }
}

function getTargetDescription(action: ActionType): string {
  switch (action) {
    case 'deposit':
      return 'Enter pool name or select from list';
    case 'withdraw':
      return 'Enter pool name or select from list';
    case 'send':
      return 'Enter recipient wallet address';
    default:
      return '';
  }
}

function getExecutionDescription(commandStep: CommandStep): string {
  const action = commandStep.action;
  const amount = commandStep.amount || '';
  const fromToken = commandStep.fromToken?.symbol || '';
  const toToken = commandStep.toToken?.symbol || '';

  switch (action) {
    case 'swap':
      return `${action} ${amount} ${fromToken} for ${toToken}`.trim();
    case 'stake':
      return `${action} ${amount} ${fromToken}`.trim();
    default:
      return `Execute the ${action} command`;
  }
}
