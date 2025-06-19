import { Window as KeplrWindow } from '@keplr-wallet/types';

declare global {
  type Window = KeplrWindow;
}

interface OfflineSigner {
  getAccounts(): Promise<readonly { address: string; algo: string; pubkey: Uint8Array }[]>;
  signDirect(signerAddress: string, signDoc: unknown): Promise<unknown>;
}

interface EnigmaUtils {
  decrypt(ciphertext: Uint8Array, nonce: Uint8Array): Promise<Uint8Array>;
  encrypt(plaintext: Uint8Array): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }>;
}

interface Window {
  keplr?: {
    enable(chainId: string): Promise<void>;
    getOfflineSigner(chainId: string): OfflineSigner;
    getEnigmaUtils(chainId: string): EnigmaUtils;
    // Add other Keplr methods as needed
  };
  getOfflineSigner?: (chainId: string) => OfflineSigner;
  getEnigmaUtils?: (chainId: string) => EnigmaUtils;
  // Web Speech API
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
