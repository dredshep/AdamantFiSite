import { ACTION_KEYWORDS } from '../constants/actionKeywords';
import { ActionType, CommandState, CommandStep } from '../types';
import { findTokenByText } from './tokenMatcher';

/**
 * Analyze the current input and determine the command construction state
 */
export function analyzeCommandState(input: string): CommandStep {
  const trimmed = input.trim();
  const normalized = trimmed.toLowerCase();

  // Initial state - empty or just whitespace
  if (!trimmed) {
    return { state: 'initial' };
  }

  // Detect action
  const action = detectAction(normalized);

  // If no action detected yet, user is typing action
  if (!action) {
    return {
      state: 'action_partial',
    };
  }

  // Action detected - now analyze what comes after
  const actionKeyword = getActionKeyword(action, normalized);
  if (!actionKeyword) {
    return { state: 'action_partial' };
  }

  // Check if input ends with just the action and a space
  if (normalized === actionKeyword + ' ') {
    return {
      state: 'action_complete',
      action,
    };
  }

  // Parse what comes after the action
  const afterAction = trimmed.substring(actionKeyword.length).trim();
  const afterActionWords = afterAction.split(/\s+/).filter(Boolean);

  if (!afterAction) {
    return {
      state: 'action_complete',
      action,
    };
  }

  // Analyze the content after action based on action type
  return analyzePostActionState(action, afterActionWords);
}

/**
 * Analyze the state after an action has been determined
 */
function analyzePostActionState(action: ActionType, words: string[]): CommandStep {
  const step: CommandStep = { state: 'action_complete', action };

  // Different actions have different patterns
  switch (action) {
    case 'swap':
      return analyzeSwapState(step, words);
    case 'stake':
      return analyzeStakeState(step, words);
    case 'deposit':
      return analyzeDepositState(step, words);
    case 'withdraw':
      return analyzeWithdrawState(step, words);
    case 'send':
      return analyzeSendState(step, words);
    default:
      return step;
  }
}

/**
 * Analyze swap command state: swap [amount] [token] for [token]
 * Note: For swaps, we only allow tokens after "for", not amounts
 */
function analyzeSwapState(step: CommandStep, words: string[]): CommandStep {
  if (words.length === 0) {
    return { ...step, state: 'action_complete' };
  }

  let wordIndex = 0;
  const currentStep = { ...step };

  // Check for amount first
  if (isAmount(words[wordIndex]!)) {
    currentStep.amount = words[wordIndex]!;
    wordIndex++;

    if (words.length === 1) {
      return { ...currentStep, state: 'amount_complete' };
    }
  } else if (isPartialAmount(words[wordIndex]!)) {
    return { ...currentStep, state: 'amount_partial' };
  }
  // If first word is not an amount, continue to check for token

  // Check for from token
  if (wordIndex < words.length) {
    const singleWord = words[wordIndex]!;
    const possibleToken = words.slice(wordIndex).join(' ');

    // Try single word first (more accurate), then full phrase
    // Pass context based on action type
    const context =
      currentStep.action === 'send' ? 'send' : currentStep.action === 'stake' ? 'stake' : 'swap';
    const token = findTokenByText(singleWord, context) || findTokenByText(possibleToken, context);

    if (token) {
      currentStep.fromToken = token;

      // Skip the token words
      if (possibleToken === token.symbol || possibleToken === token.name) {
        wordIndex = words.length;
      } else {
        wordIndex++;
      }

      currentStep.state = 'from_token_complete';
    } else {
      // User is typing a token

      return { ...currentStep, state: 'from_token_partial' };
    }
  }

  // Check for "for" connector
  if (wordIndex < words.length && words[wordIndex]?.toLowerCase() === 'for') {
    wordIndex++;
    currentStep.state = 'connector_added';

    if (wordIndex >= words.length) {
      return currentStep;
    }
  }

  // For swap commands, skip amount checking after "for" and go directly to token
  // Check for target token (no target amount support for swaps)
  if (wordIndex < words.length) {
    const singleWord = words[wordIndex]!;
    const remainingWords = words.slice(wordIndex).join(' ');

    // Try single word first (more accurate), then full phrase
    // Pass context based on action type
    const context =
      currentStep.action === 'send' ? 'send' : currentStep.action === 'stake' ? 'stake' : 'swap';
    const toToken =
      findTokenByText(singleWord, context) || findTokenByText(remainingWords, context);

    if (toToken) {
      currentStep.toToken = toToken;

      // Validate that both tokens exist before marking as ready
      if (currentStep.fromToken && toToken) {
        currentStep.state = 'command_ready';
      } else {
        currentStep.state = 'to_token_complete';
      }
    } else {
      currentStep.state = 'to_token_partial';
    }
  }

  return currentStep;
}

/**
 * Analyze stake command state: stake [amount] [token]
 */
function analyzeStakeState(step: CommandStep, words: string[]): CommandStep {
  if (words.length === 0) {
    return { ...step, state: 'action_complete' };
  }

  const currentStep = { ...step };

  // Check if first word is amount
  if (isAmount(words[0]!)) {
    currentStep.amount = words[0]!;
    currentStep.state = 'amount_complete';

    if (words.length === 1) {
      return currentStep;
    }

    // Check for token after amount, but stop at connectors
    const connectors = ['in', 'from', 'to', 'for'];
    const restWords = words.slice(1);
    const connectorIndex = restWords.findIndex((word) => connectors.includes(word.toLowerCase()));

    const tokenWords = connectorIndex !== -1 ? restWords.slice(0, connectorIndex) : restWords;
    const tokenText = tokenWords.join(' ');

    const context =
      currentStep.action === 'send' ? 'send' : currentStep.action === 'stake' ? 'stake' : 'swap';
    const token = findTokenByText(tokenText, context);
    if (token) {
      currentStep.fromToken = token;
      currentStep.state = 'command_ready';
    } else {
      currentStep.state = 'from_token_partial';
    }
  } else if (isPartialAmount(words[0]!)) {
    return { ...currentStep, state: 'amount_partial' };
  } else {
    // Check if it's a token, but stop at connectors
    const connectors = ['in', 'from', 'to', 'for'];
    const connectorIndex = words.findIndex((word) => connectors.includes(word.toLowerCase()));

    const tokenWords = connectorIndex !== -1 ? words.slice(0, connectorIndex) : words;
    const tokenText = tokenWords.join(' ');

    const context =
      currentStep.action === 'send' ? 'send' : currentStep.action === 'stake' ? 'stake' : 'swap';
    const token = findTokenByText(tokenText, context);
    if (token) {
      currentStep.fromToken = token;
      currentStep.state = 'command_ready';
    } else {
      currentStep.state = 'from_token_partial';
    }
  }

  return currentStep;
}

/**
 * Analyze deposit command state: deposit [amount] [token] in [pool]
 */
function analyzeDepositState(step: CommandStep, words: string[]): CommandStep {
  // Similar to stake but with "in [pool]" at the end
  const currentStep = analyzeStakeState(step, words);

  // Look for "in" connector for pool specification
  const inIndex = words.findIndex((word) => word.toLowerCase() === 'in');
  if (inIndex !== -1) {
    currentStep.state = 'connector_added';
    const poolText = words.slice(inIndex + 1).join(' ');
    if (poolText) {
      currentStep.target = poolText;
      currentStep.state = 'command_ready';
    }
  }

  return currentStep;
}

/**
 * Analyze withdraw command state: withdraw [amount] [token] from [pool]
 */
function analyzeWithdrawState(step: CommandStep, words: string[]): CommandStep {
  const currentStep = analyzeStakeState(step, words);

  // Look for "from" connector
  const fromIndex = words.findIndex((word) => word.toLowerCase() === 'from');
  if (fromIndex !== -1) {
    currentStep.state = 'connector_added';
    const poolText = words.slice(fromIndex + 1).join(' ');
    if (poolText) {
      currentStep.target = poolText;
      currentStep.state = 'command_ready';
    }
  }

  return currentStep;
}

/**
 * Analyze send command state: send [amount] [token] to [address]
 */
function analyzeSendState(step: CommandStep, words: string[]): CommandStep {
  const currentStep = analyzeStakeState(step, words);

  // Look for "to" connector
  const toIndex = words.findIndex((word) => word.toLowerCase() === 'to');
  if (toIndex !== -1) {
    currentStep.state = 'connector_added';
    const addressText = words.slice(toIndex + 1).join(' ');
    if (addressText) {
      currentStep.target = addressText;
      currentStep.state = 'command_ready';
    }
  }

  return currentStep;
}

/**
 * Detect action from the beginning of the input
 */
function detectAction(normalized: string): ActionType | null {
  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.startsWith(keyword + ' ') || normalized === keyword) {
        return action as ActionType;
      }
    }
  }
  return null;
}

/**
 * Get the actual keyword used for an action
 */
function getActionKeyword(action: ActionType, normalized: string): string | null {
  const keywords = ACTION_KEYWORDS[action];
  for (const keyword of keywords) {
    if (normalized.startsWith(keyword + ' ') || normalized === keyword) {
      return keyword;
    }
  }
  return null;
}

/**
 * Check if a string represents a complete amount
 */
function isAmount(str: string): boolean {
  return /^\d+(\.\d+)?$/.test(str);
}

/**
 * Check if a string represents a partial amount (user still typing)
 */
function isPartialAmount(str: string): boolean {
  return /^\d+\.?$/.test(str);
}

/**
 * Get the next expected steps for a given command state
 */
export function getNextSteps(commandStep: CommandStep): CommandState[] {
  switch (commandStep.state) {
    case 'initial':
      return ['action_partial'];

    case 'action_partial':
      return ['action_complete'];

    case 'action_complete':
      // Depending on action, different next steps are possible
      switch (commandStep.action) {
        case 'swap':
          return ['amount_partial', 'from_token_partial'];
        case 'stake':
        case 'deposit':
        case 'withdraw':
        case 'send':
          return ['amount_partial', 'from_token_partial'];
        default:
          return ['amount_partial'];
      }

    case 'amount_partial':
      return ['amount_complete'];

    case 'amount_complete':
      return ['from_token_partial'];

    case 'from_token_partial':
      return ['from_token_complete'];

    case 'from_token_complete':
      if (commandStep.action === 'swap') {
        return ['connector_added'];
      } else if (commandStep.action === 'deposit') {
        return ['connector_added']; // for "in [pool]"
      } else if (commandStep.action === 'withdraw') {
        return ['connector_added']; // for "from [pool]"
      } else if (commandStep.action === 'send') {
        return ['connector_added']; // for "to [address]"
      } else {
        return ['command_ready'];
      }

    case 'connector_added':
      if (commandStep.action === 'swap') {
        return ['to_token_partial'];
      } else {
        return ['command_ready']; // For pools, validators, addresses
      }

    case 'to_token_partial':
      return ['to_token_complete'];

    case 'to_token_complete':
      return ['command_ready'];

    case 'command_ready':
      return []; // No next steps, ready for execution

    default:
      return [];
  }
}
