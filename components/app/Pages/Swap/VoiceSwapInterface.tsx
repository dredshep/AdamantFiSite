import { InfoContainer } from '@/components/app/Shared/Forms/Input/InputWrappers';
import { ConfigToken, TOKENS } from '@/config/tokens';
import { useSwapFormLean } from '@/hooks/useSwapFormLean';
import { useSwapStore } from '@/store/swapStore';
import { ArrowRight, Mic, MicOff, Volume2, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface VoiceCommand {
  action: 'swap';
  amount?: string;
  fromToken?: string;
  toToken?: string;
}

// Debug info interface
interface DebugInfo {
  originalTranscript?: string;
  lowercaseTranscript?: string;
  confidence?: number;
  words?: string[];
  timestamp?: string;
  processedAmount?: string;
  foundTokens?: Array<{ word: string; token: string }>;
  finalCommand?: VoiceCommand;
  allTokensChecked?: Array<{
    word: string;
    normalized: string;
    mappedTo: string;
  }>;
  error?: string;
}

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

// Voice token configuration - edit this array to manage voice commands
interface VoiceTokenConfig {
  symbol: string;
  displayName: string;
  keywords: string[];
  showInHelp?: boolean;
  priority?: number; // Higher priority keywords are checked first
}

const VOICE_TOKEN_CONFIG: VoiceTokenConfig[] = [
  {
    symbol: 'sSCRT',
    displayName: 'sSCRT',
    keywords: ['secret', 'scrt', 'secretscrt', 'secretnetwork'],
    showInHelp: true,
    priority: 10,
  },
  {
    symbol: 'USDC.nbl',
    displayName: 'USDC',
    keywords: ['usdc', 'dollar', 'usd', 'noble', 'nobleusdc', 'centre', 'circle', 'fiat', 'cash'],
    showInHelp: true,
    priority: 10,
  },
  {
    symbol: 'sATOM',
    displayName: 'sATOM',
    keywords: ['atom', 'satom', 'secretatom'],
    showInHelp: true,
    priority: 8,
  },
  {
    symbol: 'SILK',
    displayName: 'SILK',
    keywords: ['silk', 'stable', 'stablecoin', 'silkstable', 'peg'],
    showInHelp: true,
    priority: 8,
  },
  {
    symbol: 'ETH.axl',
    displayName: 'ETH',
    keywords: ['eth', 'ethereum', 'ether', 'axelar', 'axelareth', 'axleth', 'bridge', 'bridgedeth'],
    showInHelp: true,
    priority: 8,
  },
  {
    symbol: 'JKL',
    displayName: 'JKL',
    keywords: ['jackal', 'jkl', 'storage', 'decentralized'],
    showInHelp: true,
    priority: 6,
  },
  {
    symbol: 'bADMT',
    displayName: 'bADMT',
    keywords: ['adamant', 'admt', 'badmt', 'bonded', 'bondedadmt', 'rewards', 'governance'],
    showInHelp: true,
    priority: 6,
  },
];

// Number mappings - edit to add more number words
interface VoiceNumberConfig {
  keyword: string;
  value: string;
  showInHelp?: boolean;
}

const VOICE_NUMBER_CONFIG: VoiceNumberConfig[] = [
  { keyword: 'zero', value: '0', showInHelp: false },
  { keyword: 'one', value: '1', showInHelp: true },
  { keyword: 'two', value: '2', showInHelp: false },
  { keyword: 'three', value: '3', showInHelp: false },
  { keyword: 'four', value: '4', showInHelp: false },
  { keyword: 'five', value: '5', showInHelp: true },
  { keyword: 'six', value: '6', showInHelp: false },
  { keyword: 'seven', value: '7', showInHelp: false },
  { keyword: 'eight', value: '8', showInHelp: false },
  { keyword: 'nine', value: '9', showInHelp: false },
  { keyword: 'ten', value: '10', showInHelp: true },
  { keyword: 'eleven', value: '11', showInHelp: false },
  { keyword: 'twelve', value: '12', showInHelp: false },
  { keyword: 'fifteen', value: '15', showInHelp: false },
  { keyword: 'twenty', value: '20', showInHelp: true },
  { keyword: 'twentyfive', value: '25', showInHelp: false },
  { keyword: 'thirty', value: '30', showInHelp: false },
  { keyword: 'fifty', value: '50', showInHelp: false },
  { keyword: 'hundred', value: '100', showInHelp: true },
  { keyword: 'thousand', value: '1000', showInHelp: true },
  { keyword: 'onek', value: '1000', showInHelp: false },
  { keyword: 'million', value: '1000000', showInHelp: false },
  { keyword: 'onem', value: '1000000', showInHelp: false },
];

// Generate the lookup mapping from the config
const VOICE_TOKEN_MAPPINGS: Record<string, string> = (() => {
  const mappings: Record<string, string> = {};

  // Sort tokens by priority (higher first) to ensure important keywords are processed first
  const sortedTokens = [...VOICE_TOKEN_CONFIG].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );

  // Add token mappings
  sortedTokens.forEach((token) => {
    token.keywords.forEach((keyword) => {
      mappings[keyword.toLowerCase()] = token.symbol;
    });
  });

  // Add number mappings
  VOICE_NUMBER_CONFIG.forEach((number) => {
    mappings[number.keyword.toLowerCase()] = number.value;
  });

  return mappings;
})();

export const VoiceSwapInterface: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [showKeywords, setShowKeywords] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const { setTokenInputProperty } = useSwapStore();
  const { handleSwapClick, payToken, receiveToken, payDetails } = useSwapFormLean();

  useEffect(() => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      setIsSupported(true);

      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Listening...');
        setDebugInfo(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[0]?.[0]?.transcript || '';
        const confidence = event.results[0]?.[0]?.confidence || 0;

        setTranscript(result);

        // Debug information
        const debug: DebugInfo = {
          originalTranscript: result,
          lowercaseTranscript: result.toLowerCase(),
          confidence: confidence,
          words: result.toLowerCase().split(/\s+/),
          timestamp: new Date().toLocaleTimeString(),
        };
        setDebugInfo(debug);

        processVoiceCommand(result.toLowerCase());
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setTranscript(`Error: ${event.error}`);
        setDebugInfo({ error: event.error, timestamp: new Date().toLocaleTimeString() });
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const findTokenByVoiceInput = useCallback((voiceInput: string): ConfigToken | null => {
    const normalized = voiceInput.toLowerCase().replace(/[^a-z0-9]/g, '');

    const mappedSymbol = VOICE_TOKEN_MAPPINGS[normalized];
    if (mappedSymbol) {
      return TOKENS.find((token) => token.symbol === mappedSymbol) || null;
    }

    for (const [key, symbol] of Object.entries(VOICE_TOKEN_MAPPINGS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return TOKENS.find((token) => token.symbol === symbol) || null;
      }
    }

    return (
      TOKENS.find(
        (token) =>
          token.symbol.toLowerCase().includes(normalized) ||
          token.name.toLowerCase().includes(normalized)
      ) || null
    );
  }, []);

  const parseAmount = useCallback((voiceInput: string): string => {
    const cleaned = voiceInput
      .toLowerCase()
      .replace(/swap|exchange|trade|from|to|for|dollars?|tokens?/g, '')
      .trim();

    for (const [word, number] of Object.entries(VOICE_TOKEN_MAPPINGS)) {
      if (cleaned.includes(word) && !isNaN(Number(number))) {
        return number;
      }
    }

    const numberMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch && numberMatch[1]) {
      return numberMatch[1];
    }

    return '';
  }, []);

  const processVoiceCommand = useCallback(
    (voiceInput: string) => {
      console.log('Processing voice command:', voiceInput);

      const command: VoiceCommand = {
        action: 'swap',
      };

      const amount = parseAmount(voiceInput);
      if (amount) {
        command.amount = amount;
      }

      const words = voiceInput.toLowerCase().split(/\s+/);
      const tokens: string[] = [];
      const foundTokens: Array<{ word: string; token: string }> = [];

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (!word) continue;

        const token = findTokenByVoiceInput(word);
        if (token) {
          tokens.push(token.symbol);
          foundTokens.push({ word, token: token.symbol });
        }

        if (i < words.length - 1) {
          const nextWord = words[i + 1];
          if (nextWord) {
            const twoWords = `${word} ${nextWord}`;
            const token = findTokenByVoiceInput(twoWords);
            if (token) {
              tokens.push(token.symbol);
              foundTokens.push({ word: twoWords, token: token.symbol });
              i++;
            }
          }
        }
      }

      if (tokens.length >= 2) {
        const fromToken = tokens[0];
        const toToken = tokens[1];
        if (fromToken) command.fromToken = fromToken;
        if (toToken) command.toToken = toToken;
      } else if (tokens.length === 1) {
        const toToken = tokens[0];
        if (toToken) command.toToken = toToken;
      }

      // Update debug info with processing results - only include non-undefined values
      const debugUpdate: Partial<DebugInfo> = {
        foundTokens: foundTokens,
        finalCommand: command,
        allTokensChecked: words
          .filter((word) => word)
          .map((word) => ({
            word,
            normalized: word.replace(/[^a-z0-9]/g, ''),
            mappedTo: VOICE_TOKEN_MAPPINGS[word] || 'not found',
          })),
      };

      if (amount) {
        debugUpdate.processedAmount = amount;
      }

      setDebugInfo(
        (prev: DebugInfo | null): DebugInfo => ({
          ...prev,
          ...debugUpdate,
        })
      );

      setLastCommand(command);
      executeVoiceCommand(command);
    },
    [findTokenByVoiceInput, parseAmount]
  );

  const executeVoiceCommand = useCallback(
    (command: VoiceCommand) => {
      console.log('Executing voice command:', command);

      if (command.fromToken) {
        const fromToken = TOKENS.find((t) => t.symbol === command.fromToken);
        if (fromToken) {
          setTokenInputProperty('swap.pay', 'tokenAddress', fromToken.address);
        }
      }

      if (command.toToken) {
        const toToken = TOKENS.find((t) => t.symbol === command.toToken);
        if (toToken) {
          setTokenInputProperty('swap.receive', 'tokenAddress', toToken.address);
        }
      }

      if (command.amount) {
        setTokenInputProperty('swap.pay', 'amount', command.amount);
      }

      setTranscript(
        `✅ ${command.amount || ''} ${command.fromToken || 'current'} → ${
          command.toToken || 'current'
        }`
      );
    },
    [setTokenInputProperty]
  );

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const executeSwap = () => {
    if (payToken && receiveToken && payDetails.amount) {
      void handleSwapClick();
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-adamant-app-box/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <MicOff className="w-5 h-5 text-red-400" />
          <span className="text-lg font-medium text-red-300">Voice Not Supported</span>
        </div>
        <p className="text-sm text-adamant-text-form-secondary">
          Please use Chrome or Edge for voice features
        </p>
      </div>
    );
  }

  return (
    <div className="bg-adamant-app-box/50 backdrop-blur-sm rounded-xl border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Volume2 className="w-5 h-5 text-adamant-accentText" />
            {isListening && (
              <div className="absolute -inset-1 bg-adamant-accentText/20 rounded-full animate-pulse" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-adamant-text-box-main">Voice Swap</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeywords(!showKeywords)}
            className="text-xs text-adamant-text-box-secondary hover:text-white transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-white/5"
          >
            {showKeywords ? 'Hide' : 'Show'} Keywords
          </button>

          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!isSupported}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isListening
                ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                : 'bg-adamant-accentBg/10 border border-adamant-accentBg/20 text-adamant-accentText hover:bg-adamant-accentBg/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span className={isListening ? 'animate-pulse' : ''}>Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Speak
              </>
            )}
          </button>

          {payToken && receiveToken && payDetails.amount && (
            <button
              onClick={executeSwap}
              className="bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark hover:brightness-110 text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Execute
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Usage Examples */}
        <div className="text-sm text-adamant-text-box-secondary">
          💬 Try saying:
          <span className="text-adamant-accentText font-medium ml-1">
            "Swap 10 secret for usdc"
          </span>{' '}
          or
          <span className="text-adamant-accentText font-medium ml-1">
            "Exchange 5 atom to silk"
          </span>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <InfoContainer>
            <div className="flex items-center gap-2 text-sm">
              <Volume2 className="w-4 h-4 text-adamant-accentText flex-shrink-0" />
              <span className="text-adamant-text-box-secondary">Heard:</span>
              <span className="text-adamant-text-box-main font-medium">{transcript}</span>
            </div>
          </InfoContainer>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <h4 className="text-sm font-medium text-yellow-300 mb-2">🐛 Debug Info</h4>
            <div className="space-y-2 text-xs text-yellow-200">
              <div>
                <strong>Raw Transcript:</strong> "{debugInfo.originalTranscript || 'N/A'}"
              </div>
              <div>
                <strong>Confidence:</strong> {debugInfo.confidence?.toFixed(2) || 'N/A'}
              </div>
              <div>
                <strong>Words:</strong> [{debugInfo.words?.join(', ') || 'none'}]
              </div>
              {debugInfo.processedAmount && (
                <div>
                  <strong>Found Amount:</strong> {debugInfo.processedAmount}
                </div>
              )}
              {debugInfo.foundTokens && debugInfo.foundTokens.length > 0 && (
                <div>
                  <strong>Found Tokens:</strong>{' '}
                  {debugInfo.foundTokens
                    .map((t: { word: string; token: string }) => `"${t.word}" → ${t.token}`)
                    .join(', ')}
                </div>
              )}
              {debugInfo.allTokensChecked && (
                <div className="mt-2">
                  <strong>All Words Checked:</strong>
                  <div className="ml-2 space-y-1">
                    {debugInfo.allTokensChecked.map(
                      (
                        check: { word: string; normalized: string; mappedTo: string },
                        i: number
                      ) => (
                        <div key={i} className="text-xs">
                          "{check.word}" → normalized: "{check.normalized}" → mapped:{' '}
                          {check.mappedTo}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              {debugInfo.finalCommand && (
                <div className="mt-2">
                  <strong>Final Command:</strong> {JSON.stringify(debugInfo.finalCommand, null, 2)}
                </div>
              )}
              {debugInfo.error && (
                <div className="text-red-300">
                  <strong>Error:</strong> {debugInfo.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Command Display */}
        {lastCommand && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
              <span className="text-green-300 font-medium">Command:</span>
              <div className="flex items-center gap-2 text-green-200">
                {lastCommand.amount && <span className="font-medium">{lastCommand.amount}</span>}
                <span>{lastCommand.fromToken || 'current'}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{lastCommand.toToken || 'current'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Keywords Panel */}
        {showKeywords && (
          <InfoContainer>
            <h4 className="text-sm font-medium text-adamant-text-box-main mb-3">
              Voice Keywords Reference
            </h4>

            <div className="space-y-3">
              {VOICE_TOKEN_CONFIG.filter((token) => token.showInHelp).map((token) => (
                <div key={token.symbol} className="flex gap-3">
                  <div className="text-xs font-medium text-adamant-accentText min-w-[60px]">
                    {token.displayName}:
                  </div>
                  <div className="text-xs text-adamant-text-box-secondary flex-1">
                    {token.keywords
                      .slice(0, 4)
                      .map((k) => `"${k}"`)
                      .join(', ')}
                    {token.keywords.length > 4 && (
                      <span className="text-gray-500 ml-1">+{token.keywords.length - 4} more</span>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-2 border-t border-white/5">
                <div className="text-xs font-medium text-adamant-accentText min-w-[60px]">
                  Numbers:
                </div>
                <div className="text-xs text-adamant-text-box-secondary flex-1">
                  {VOICE_NUMBER_CONFIG.filter((n) => n.showInHelp)
                    .map((n) => `"${n.keyword}"`)
                    .join(', ')}
                </div>
              </div>
            </div>
          </InfoContainer>
        )}
      </div>
    </div>
  );
};

export default VoiceSwapInterface;
