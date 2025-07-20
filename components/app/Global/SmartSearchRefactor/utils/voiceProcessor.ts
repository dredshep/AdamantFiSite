import { VOICE_TOKEN_MAPPINGS } from '../constants/voiceMappings';

/**
 * Process voice input to convert spoken words to text commands
 * Extracted from original SmartSearchBox processVoiceInput function
 */
export function processVoiceInput(voiceInput: string): string {
  let processed = voiceInput.toLowerCase();

  // Replace voice token mappings
  Object.entries(VOICE_TOKEN_MAPPINGS).forEach(([spoken, symbol]) => {
    const regex = new RegExp(`\\b${spoken}\\b`, 'gi');
    processed = processed.replace(regex, symbol);
  });

  return processed;
}

/**
 * Check if voice input is supported in the current browser
 * Chrome or Edge only with SpeechRecognition API
 */
export function isVoiceSupported(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const isChrome =
    userAgent.includes('chrome') && !userAgent.includes('chromium') && !userAgent.includes('brave');
  const isEdge = userAgent.includes('edg/');

  const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

  return (isChrome || isEdge) && !!SpeechRecognitionConstructor;
}
