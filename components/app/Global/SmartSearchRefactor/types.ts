import { ConfigToken, LiquidityPair } from '@/config/tokens';
import React from 'react';

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
