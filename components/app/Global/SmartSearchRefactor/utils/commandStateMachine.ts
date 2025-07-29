import { ACTION_KEYWORDS } from '../constants/actionKeywords';
import { ActionType, CommandState, CommandStep } from '../types';
import { findTokenByText } from './tokenMatcher';

/**
 * Analyze the current input and determine the command construction state
 */
export function analyzeCommandState(input: string): CommandStep {
  const trimmed = input.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
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
  return analyzePostActionState(action, afterActionWords, afterAction);
}

/**
 * Analyze the state after an action has been determined
 */
function analyzePostActionState(
  action: ActionType,
  words: string[],
  fullText: string
): CommandStep {
  const step: CommandStep = { state: 'action_complete', action };

  // Different actions have different patterns
  switch (action) {
    case 'swap':
      return analyzeSwapState(step, words, fullText);
    case 'stake':
      return analyzeStakeState(step, words, fullText);
    case 'deposit':
      return analyzeDepositState(step, words, fullText);
    case 'withdraw':
      return analyzeWithdrawState(step, words, fullText);
    case 'send':
      return analyzeSendState(step, words, fullText);
    default:
      return step;
  }
}

/**
 * Analyze swap command state: swap [amount] [token] for [amount] [token]
 */
function analyzeSwapState(step: CommandStep, words: string[], fullText: string): CommandStep {
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

  // Check for from token
  if (wordIndex < words.length) {
    const possibleToken = words.slice(wordIndex).join(' ');
    const token = findTokenByText(possibleToken) || findTokenByText(words[wordIndex]!);

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

  // Check for target amount
  if (wordIndex < words.length && isAmount(words[wordIndex]!)) {
    currentStep.toAmount = words[wordIndex]!;
    wordIndex++;
    currentStep.state = 'to_amount_complete';

    if (wordIndex >= words.length) {
      return currentStep;
    }
  } else if (wordIndex < words.length && isPartialAmount(words[wordIndex]!)) {
    return { ...currentStep, state: 'to_amount_partial' };
  }

  // Check for target token
  if (wordIndex < words.length) {
    const remainingWords = words.slice(wordIndex).join(' ');
    const toToken = findTokenByText(remainingWords) || findTokenByText(words[wordIndex]!);

    if (toToken) {
      currentStep.toToken = toToken;
      currentStep.state = 'command_ready';
    } else {
      currentStep.state = 'to_token_partial';
    }
  }

  return currentStep;
}

/**
 * Analyze stake command state: stake [amount] [token]
 */
function analyzeStakeState(step: CommandStep, words: string[], fullText: string): CommandStep {
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

    // Check for token after amount
    const tokenText = words.slice(1).join(' ');
    const token = findTokenByText(tokenText);
    if (token) {
      currentStep.fromToken = token;
      currentStep.state = 'command_ready';
    } else {
      currentStep.state = 'from_token_partial';
    }
  } else if (isPartialAmount(words[0]!)) {
    return { ...currentStep, state: 'amount_partial' };
  } else {
    // Check if it's a token
    const tokenText = words.join(' ');
    const token = findTokenByText(tokenText);
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
function analyzeDepositState(step: CommandStep, words: string[], fullText: string): CommandStep {
  // Similar to stake but with "in [pool]" at the end
  const currentStep = analyzeStakeState(step, words, fullText);

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
function analyzeWithdrawState(step: CommandStep, words: string[], fullText: string): CommandStep {
  const currentStep = analyzeStakeState(step, words, fullText);

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
function analyzeSendState(step: CommandStep, words: string[], fullText: string): CommandStep {
  const currentStep = analyzeStakeState(step, words, fullText);

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
        return ['to_amount_partial', 'to_token_partial'];
      } else {
        return ['command_ready']; // For pools, validators, addresses
      }

    case 'to_amount_partial':
      return ['to_amount_complete'];

    case 'to_amount_complete':
      return ['to_token_partial'];

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
