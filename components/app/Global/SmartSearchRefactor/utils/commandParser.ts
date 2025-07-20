import { ConfigToken } from '@/config/tokens';
import { ACTION_KEYWORDS } from '../constants/actionKeywords';
import { ParsedCommand } from '../types';
import { detectAction, findTokenByText } from './tokenMatcher';

/**
 * Parse the user's input to extract swap commands
 * Extracted from original SmartSearchBox parseCommand function
 * FIXED: Better amount parsing and same-token prevention
 */
export function parseCommand(input: string): ParsedCommand {
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
  if (command.action && ['swap', 'stake', 'deposit', 'withdraw', 'send'].includes(command.action)) {
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

    // IMPROVED: Parse tokens and amounts with better context awareness
    const words = tokenQuery.split(/\s+/).filter((word) => word.length > 0);
    const foundTokens: Array<{
      token: ConfigToken;
      position: number;
      wordCount: number;
      precedingAmount?: string;
      followingAmount?: string;
    }> = [];

    // Find tokens and their associated amounts
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word || /^\d+(\.\d+)?$/.test(word)) continue; // Skip standalone numbers

      // Try single word first
      const singleToken = findTokenByText(word);
      if (singleToken && !foundTokens.find((t) => t.token.symbol === singleToken.symbol)) {
        const precedingAmount =
          i > 0 && /^\d+(\.\d+)?$/.test(words[i - 1]!) ? words[i - 1]! : undefined;
        const followingAmount =
          i < words.length - 1 && /^\d+(\.\d+)?$/.test(words[i + 1]!) ? words[i + 1]! : undefined;

        const tokenData: {
          token: ConfigToken;
          position: number;
          wordCount: number;
          precedingAmount?: string;
          followingAmount?: string;
        } = {
          token: singleToken,
          position: i,
          wordCount: 1,
        };

        if (precedingAmount) tokenData.precedingAmount = precedingAmount;
        if (followingAmount) tokenData.followingAmount = followingAmount;

        foundTokens.push(tokenData);
        command.confidence += 0.3;
        continue;
      }

      // Try two words for compound tokens
      if (i < words.length - 1) {
        const nextWord = words[i + 1];
        if (nextWord && word && !/^\d+(\.\d+)?$/.test(nextWord)) {
          const twoWords = `${word} ${nextWord}`;
          const compoundToken = findTokenByText(twoWords);
          if (compoundToken && !foundTokens.find((t) => t.token.symbol === compoundToken.symbol)) {
            const precedingAmount =
              i > 0 && /^\d+(\.\d+)?$/.test(words[i - 1]!) ? words[i - 1]! : undefined;
            const followingAmount =
              i < words.length - 2 && /^\d+(\.\d+)?$/.test(words[i + 2]!)
                ? words[i + 2]!
                : undefined;

            const tokenData: {
              token: ConfigToken;
              position: number;
              wordCount: number;
              precedingAmount?: string;
              followingAmount?: string;
            } = {
              token: compoundToken,
              position: i,
              wordCount: 2,
            };

            if (precedingAmount) tokenData.precedingAmount = precedingAmount;
            if (followingAmount) tokenData.followingAmount = followingAmount;

            foundTokens.push(tokenData);
            command.confidence += 0.3;
            i++; // Skip next word since we used it
          }
        }
      }
    }

    // IMPROVED: Assign tokens based on context and position
    if (foundTokens.length >= 2) {
      // Look for directional words to determine order
      const directionWords = ['for', 'to', 'in', 'from'];
      let directionIndex = -1;

      directionWords.forEach((word) => {
        const index = words.indexOf(word);
        if (index !== -1 && (directionIndex === -1 || index < directionIndex)) {
          directionIndex = index;
        }
      });

      if (directionIndex !== -1) {
        // Use directional context
        const beforeDirection = foundTokens.filter((t) => t.position < directionIndex);
        const afterDirection = foundTokens.filter((t) => t.position > directionIndex);

        if (beforeDirection.length > 0 && beforeDirection[0]) {
          command.fromToken = beforeDirection[0].token;
        }
        if (afterDirection.length > 0 && afterDirection[0]) {
          command.toToken = afterDirection[0].token;
        }
      } else {
        // Default assignment based on natural language order
        if (foundTokens[0]) command.fromToken = foundTokens[0].token;
        if (foundTokens[1]) command.toToken = foundTokens[1].token;
      }
    } else if (foundTokens.length === 1 && foundTokens[0]) {
      const token = foundTokens[0];

      // Check if "for" or "to" appears before this token
      const directionIndex = Math.max(words.indexOf('for'), words.indexOf('to'));

      if (directionIndex !== -1 && token.position > directionIndex) {
        // Token appears after directional word, so it's the target
        command.toToken = token.token;
      } else {
        // Default to fromToken
        command.fromToken = token.token;
      }
    }

    // FIXED: Prevent same token for from and to
    if (
      command.fromToken &&
      command.toToken &&
      command.fromToken.symbol === command.toToken.symbol
    ) {
      // If they're the same, clear the toToken and reduce confidence
      delete command.toToken;
      command.confidence -= 0.2;
    }

    // IMPROVED: Better amount parsing with context awareness
    if (foundTokens.length > 0) {
      // Strategy 1: Look for amount after "for" but before toToken (highest priority for target amounts)
      if (command.toToken) {
        const directionIndex = words.indexOf('for');
        if (directionIndex !== -1) {
          const toTokenData = foundTokens.find((t) => t.token.symbol === command.toToken!.symbol);
          if (toTokenData) {
            // Look for number between "for" and the toToken
            for (let i = directionIndex + 1; i < toTokenData.position; i++) {
              const word = words[i];
              if (word && /^\d+(\.\d+)?$/.test(word)) {
                command.amount = word;
                command.confidence += 0.3; // Higher confidence for contextual amounts
                break;
              }
            }

            // Also check if the toToken has a preceding amount (e.g., "for 10 sSCRT")
            if (!command.amount && toTokenData.precedingAmount) {
              command.amount = toTokenData.precedingAmount;
              command.confidence += 0.3;
            }
          }
        }
      }

      // Strategy 2: Amount directly before fromToken (if no amount found yet)
      if (!command.amount && command.fromToken) {
        const fromTokenData = foundTokens.find((t) => t.token.symbol === command.fromToken!.symbol);
        if (fromTokenData?.precedingAmount) {
          command.amount = fromTokenData.precedingAmount;
          command.confidence += 0.2;
        }
      }

      // Strategy 3: First number in the query (fallback)
      if (!command.amount) {
        const firstNumber = words.find((word) => /^\d+(\.\d+)?$/.test(word));
        if (firstNumber) {
          command.amount = firstNumber;
          command.confidence += 0.1;
        }
      }
    }
  }

  return command;
}
