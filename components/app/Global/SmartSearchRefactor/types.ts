import { ConfigToken, LiquidityPair } from '@/config/tokens';
import React from 'react';

// Command Construction State Machine Types
export type CommandState =
  | 'initial' // No command started
  | 'action_partial' // User typing action (e.g., "sw")
  | 'action_complete' // Action completed (e.g., "swap ")
  | 'amount_partial' // User typing amount (e.g., "swap 1")
  | 'amount_complete' // Amount completed (e.g., "swap 10 ")
  | 'from_token_partial' // User typing first token (e.g., "swap 10 s")
  | 'from_token_complete' // First token completed (e.g., "swap 10 sSCRT ")
  | 'connector_added' // Connector added (e.g., "swap 10 sSCRT for ")
  | 'to_amount_partial' // User typing target amount (e.g., "swap 10 sSCRT for 5")
  | 'to_amount_complete' // Target amount completed (e.g., "swap 10 sSCRT for 5 ")
  | 'to_token_partial' // User typing target token (e.g., "swap 10 sSCRT for 5 s")
  | 'to_token_complete' // Target token completed (e.g., "swap 10 sSCRT for 5 sATOM")
  | 'command_ready'; // Command ready for execution

export type ActionType = 'swap' | 'stake' | 'deposit' | 'withdraw' | 'send' | 'receive';

export interface CommandStep {
  state: CommandState;
  action?: ActionType;
  amount?: string;
  fromToken?: ConfigToken;
  toToken?: ConfigToken;
  toAmount?: string;
  target?: string; // For pools, validators, etc.
}

export type SuggestionType =
  | 'action' // Action suggestions (swap, stake, etc.)
  | 'amount' // Amount suggestions
  | 'token' // Token suggestions
  | 'continuation' // Next step guidance (e.g., "Add amount", "Select token")
  | 'completion' // Command completion (e.g., "Execute swap", "Fill form")
  | 'navigation' // Navigation suggestions
  | 'social' // Social links
  | 'utility' // Utility functions
  | 'pool'; // Pool suggestions

export interface StepSuggestion {
  type: SuggestionType;
  title: string;
  subtitle?: string;
  token?: ConfigToken;
  pool?: LiquidityPair;
  icon?: string | React.ReactNode;
  value?: string; // The value to add/replace
  nextState?: CommandState; // What state to transition to
  onSelect: () => void;
  isOptional?: boolean; // Whether this step can be skipped
  isPrimary?: boolean; // Whether this is the primary suggestion
}

export interface ParsedCommand {
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

export interface SearchSuggestion {
  type: 'token' | 'command' | 'action' | 'navigation' | 'social' | 'utility' | 'pool';
  title: string;
  subtitle?: string;
  token?: ConfigToken;
  pool?: LiquidityPair;
  command?: ParsedCommand;
  icon?: string | React.ReactNode; // Can be icon name string or React component
  onSelect: () => void;
  url?: string; // For external links
}

export interface SmartSearchBoxProps {
  className?: string;
  placeholder?: string;
  isMobile?: boolean;
}

// Speech Recognition types
export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent {
  error: string;
}

export interface SpeechRecognition {
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

// Note: Window interface extension for SpeechRecognition is already declared in types/window.d.ts
