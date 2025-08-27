import { TOKENS } from '@/config/tokens';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import {
  TokenService,
  TokenServiceError,
  TokenServiceErrorType,
} from '@/services/secret/TokenService';
import * as Dialog from '@radix-ui/react-dialog';
import {
  CheckCircledIcon,
  CheckIcon,
  ChevronDownIcon,
  Cross2Icon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  GearIcon,
  InfoCircledIcon,
  LightningBoltIcon,
  PlusIcon,
  ReloadIcon,
  RocketIcon,
} from '@radix-ui/react-icons';
import * as Select from '@radix-ui/react-select';
import * as Tabs from '@radix-ui/react-tabs';
import * as Toast from '@radix-ui/react-toast';
import React, { useEffect, useState } from 'react';

interface ViewingKeyInfo {
  address: string;
  symbol: string;
  name: string;
  codeHash: string;
  hasViewingKey: boolean;
  viewingKeyPreview?: string | undefined;
  balance?: string | undefined;
  error?: string | undefined;
  errorType?: TokenServiceErrorType;
  suggestedAction?: string;
  isLoadingKey?: boolean;
  isLoadingBalance?: boolean;
}

export const ViewingKeyDebugger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>(TOKENS[0]?.address ?? '');
  const [tokenInfo, setTokenInfo] = useState<ViewingKeyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [suggestedTokens, setSuggestedTokens] = useState<Set<string>>(new Set());

  const { walletAddress } = useSecretNetwork();
  const tokenService = new TokenService();

  // Add staking contracts manually for debugging
  const stakingContracts = [
    {
      address: 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev',
      symbol: 'bADMT Staking',
      name: 'Staking Contract for bADMT',
      codeHash: 'c644edd309de7fd865b4fbe22054bcbe85a6c0b8abf5f110053fe1b2d0e8a72a',
    },
  ];

  const allTokens = [...TOKENS, ...stakingContracts];

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const getTokenByAddress = (address: string) => {
    return allTokens.find((token) => token.address === address);
  };

  const checkViewingKey = async (tokenAddress: string) => {
    if (!window.keplr) {
      addLog('Keplr not found');
      return null;
    }

    try {
      addLog(`Checking viewing key for ${tokenAddress}`);

      // Update loading state
      if (tokenInfo && tokenInfo.address === tokenAddress) {
        setTokenInfo((prev) => (prev ? { ...prev, isLoadingKey: true } : null));
      }

      const viewingKey = await window.keplr
        .getSecret20ViewingKey('secret-4', tokenAddress)
        .catch(() => null);

      if (viewingKey && viewingKey.length > 0) {
        addLog(`Viewing key found: ${viewingKey.substring(0, 8)}...`);
        return viewingKey;
      } else {
        addLog('No viewing key found');
        return null;
      }
    } catch (error) {
      addLog(`Error checking viewing key: ${String(error)}`);
      return null;
    } finally {
      // Clear loading state
      if (tokenInfo && tokenInfo.address === tokenAddress) {
        setTokenInfo((prev) => (prev ? { ...prev, isLoadingKey: false } : null));
      }
    }
  };

  const fetchTokenInfo = async (tokenAddress: string, retryBalance = false) => {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const token = getTokenByAddress(tokenAddress);
    if (!token) return;

    setIsLoading(true);
    addLog(`[${traceId}] Starting analysis for ${token.symbol} (${token.name})`);

    try {
      // Check viewing key
      const viewingKey = await checkViewingKey(tokenAddress);

      const info: ViewingKeyInfo = {
        address: tokenAddress,
        symbol: token.symbol,
        name: token.name,
        codeHash: token.codeHash,
        hasViewingKey: !!viewingKey,
        viewingKeyPreview: viewingKey ? `${viewingKey.substring(0, 8)}...` : undefined,
        isLoadingKey: false,
        isLoadingBalance: false,
      };

      // Set initial info without balance
      setTokenInfo(info);

      if (viewingKey && walletAddress) {
        // Try to fetch balance with retry logic
        addLog(`[${traceId}] Attempting to fetch balance...`);
        info.isLoadingBalance = true;
        setTokenInfo({ ...info }); // Update UI to show loading

        try {
          addLog(`[${traceId}] Calling getBalance...`);
          const balance = await tokenService.getBalance(
            tokenAddress,
            token.codeHash,
            'ViewingKeyDebugger.fetchTokenInfo',
            traceId
          );
          info.balance = balance;
          info.isLoadingBalance = false;
          delete info.error; // Clear any previous errors
          delete info.errorType;
          delete info.suggestedAction;
          addLog(`[${traceId}] Balance fetched successfully: ${balance}`);
        } catch (error) {
          info.isLoadingBalance = false;

          // Handle TokenServiceError with better categorization
          if (error instanceof TokenServiceError) {
            addLog(`[${error.traceId || traceId}] Caught TokenServiceError: ${error.message}`);
            info.error = error.message;
            info.errorType = error.type;
            if (error.suggestedAction) {
              info.suggestedAction = error.suggestedAction;
            }

            // Different handling based on error type
            switch (error.type) {
              case TokenServiceErrorType.VIEWING_KEY_REQUIRED:
                addLog(`[${traceId}] Viewing key required: ${error.message}`);
                if (!retryBalance && !info.hasViewingKey && !suggestedTokens.has(tokenAddress)) {
                  addLog(`[${traceId}] Will attempt to suggest token to set viewing key...`);
                  // Auto-suggest token to help user set viewing key - only if no viewing key exists and not already suggested
                  setSuggestedTokens((prev) => new Set(prev).add(tokenAddress));
                  setTimeout(() => {
                    suggestToken(tokenAddress).catch((error) => {
                      console.error('ViewingKeyDebugger - Error in auto-suggest:', error);
                      addLog(
                        `[${traceId}] Auto-suggest failed: ${
                          error instanceof Error ? error.message : String(error)
                        }`
                      );
                    });
                  }, 1000);
                } else if (info.hasViewingKey) {
                  addLog(
                    `[${traceId}] Viewing key exists but is invalid - manual intervention required`
                  );
                } else if (suggestedTokens.has(tokenAddress)) {
                  addLog(`[${traceId}] Token already suggested - manual intervention required`);
                } else {
                  addLog(`[${traceId}] Retry failed - viewing key still required`);
                }
                break;

              case TokenServiceErrorType.VIEWING_KEY_INVALID:
                addLog(`[${traceId}] Invalid viewing key: ${error.message}`);
                if (!retryBalance) {
                  addLog(
                    `[${traceId}] Viewing key appears to be invalid - manual reset may be required`
                  );
                } else {
                  addLog(`[${traceId}] Retry failed - viewing key is still invalid`);
                }
                break;

              case TokenServiceErrorType.VIEWING_KEY_REJECTED:
                addLog(`[${traceId}] Viewing key rejected: ${error.message}`);
                addLog(`[${traceId}] User rejected the viewing key request`);
                break;

              case TokenServiceErrorType.NETWORK_ERROR:
                addLog(`[${traceId}] Network error: ${error.message}`);
                if (!retryBalance) {
                  addLog(`[${traceId}] Will retry automatically in a few seconds...`);
                  setTimeout(() => {
                    if (tokenInfo?.address === tokenAddress) {
                      fetchTokenInfo(tokenAddress, true).catch((error) => {
                        console.error('ViewingKeyDebugger - Error in retry:', error);
                        addLog(
                          `[${traceId}] Retry failed: ${
                            error instanceof Error ? error.message : String(error)
                          }`
                        );
                      });
                    }
                  }, 5000);
                } else {
                  addLog(`[${traceId}] Network retry failed`);
                }
                break;

              case TokenServiceErrorType.CONTRACT_ERROR:
                addLog(`[${traceId}] Contract error: ${error.message}`);
                addLog(`[${traceId}] There may be an issue with the token contract`);
                break;

              default:
                addLog(`[${traceId}] Unknown error: ${error.message}`);
                if (!retryBalance) {
                  addLog(`[${traceId}] Will retry once...`);
                  setTimeout(() => {
                    if (tokenInfo?.address === tokenAddress) {
                      fetchTokenInfo(tokenAddress, true).catch((error) => {
                        console.error('ViewingKeyDebugger - Error in retry:', error);
                        addLog(
                          `[${traceId}] Retry failed: ${
                            error instanceof Error ? error.message : String(error)
                          }`
                        );
                      });
                    }
                  }, 3000);
                }
                break;
            }
          } else {
            // Fallback for non-TokenServiceError
            addLog(`[${traceId}] Caught generic error: ${String(error)}`);
            const errorMessage = error instanceof Error ? error.message : String(error);
            info.error = errorMessage;
            addLog(`[${traceId}] Balance fetch failed: ${errorMessage}`);

            if (!retryBalance) {
              addLog(`[${traceId}] Will retry automatically...`);
              setTimeout(() => {
                if (tokenInfo?.address === tokenAddress && tokenInfo?.hasViewingKey) {
                  fetchTokenInfo(tokenAddress, true).catch((error) => {
                    console.error('ViewingKeyDebugger - Error in retry:', error);
                    addLog(
                      `[${traceId}] Retry failed: ${
                        error instanceof Error ? error.message : String(error)
                      }`
                    );
                  });
                }
              }, 3000);
            } else {
              addLog(`[${traceId}] Balance fetch failed on retry: ${errorMessage}`);
            }
          }
        }
      } else if (!walletAddress) {
        addLog(`[${traceId}] No wallet connected`);
        info.error = 'No wallet connected';
        info.errorType = TokenServiceErrorType.WALLET_ERROR;
        info.suggestedAction = 'Connect your wallet';
      }

      setTokenInfo(info);
    } catch (error) {
      addLog(`[${traceId}] Caught fatal analysis error: ${String(error)}`);
      addLog(`Analysis failed: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestToken = async (tokenAddress: string) => {
    if (!window.keplr) {
      showToastMessage('Keplr not found');
      return;
    }

    setIsLoading(true);
    addLog(`Suggesting token to Keplr: ${tokenAddress}`);

    try {
      await tokenService.suggestToken(tokenAddress, 'ViewingKeyDebugger.suggestToken');
      addLog('Token suggested successfully');
      showToastMessage(
        'Token suggested to Keplr. Please check your wallet and manually refresh token info if needed.'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Failed to suggest token: ${errorMessage}`);
      showToastMessage(`Failed to suggest token: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addTokenToWallet = async (tokenAddress: string) => {
    if (!window.keplr) {
      showToastMessage('Keplr not found');
      return;
    }

    const token = getTokenByAddress(tokenAddress);
    if (!token) {
      showToastMessage('Token configuration not found');
      return;
    }

    setIsLoading(true);
    addLog(`Adding token to Keplr wallet: ${token.symbol} (${token.name})`);

    try {
      await tokenService.suggestToken(tokenAddress, 'ViewingKeyDebugger.addTokenToWallet');
      addLog('Token added to wallet successfully');
      showToastMessage(`${token.symbol} added to Keplr wallet successfully!`);

      setTimeout(() => {
        fetchTokenInfo(tokenAddress).catch((error) => {
          console.error('ViewingKeyDebugger - Error in refresh after add token:', error);
          addLog(`Refresh failed: ${error instanceof Error ? error.message : String(error)}`);
        });
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Failed to add token to wallet: ${errorMessage}`);
      showToastMessage(`Failed to add token to wallet: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetViewingKey = async (tokenAddress: string) => {
    setIsLoading(true);
    addLog(`Attempting to reset viewing key for ${tokenAddress}`);

    try {
      const existingKey = await checkViewingKey(tokenAddress);

      if (existingKey) {
        addLog(`Existing viewing key detected: ${existingKey.substring(0, 8)}...`);
        addLog('Note: Keplr cannot override existing viewing keys via suggestToken()');
        addLog(
          'Manual removal required: Open Keplr → Settings → Manage Tokens → Remove this token'
        );
        showToastMessage('Manual action required: Remove token from Keplr settings first');
        return;
      }

      await tokenService.resetViewingKey(tokenAddress, 'ViewingKeyDebugger.resetViewingKey');
      addLog('Viewing key reset initiated');
      showToastMessage('Viewing key reset initiated. Please check Keplr.');

      setTimeout(() => {
        fetchTokenInfo(tokenAddress).catch((error) => {
          console.error('ViewingKeyDebugger - Error in refresh after reset:', error);
          addLog(`Refresh failed: ${error instanceof Error ? error.message : String(error)}`);
        });
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Failed to reset viewing key: ${errorMessage}`);
      showToastMessage(`Failed to reset viewing key: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCachedError = () => {
    tokenService.clearCachedError();
    addLog('Cleared cached error state');
    showToastMessage('Cached error state cleared');
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };
  const clearTokenError = () => {
    if (tokenInfo) {
      setTokenInfo({ ...tokenInfo, error: undefined, balance: undefined });
      setSuggestedTokens(new Set()); // Reset suggested tokens tracking
      addLog('Cleared token error state and reset suggestion tracking');
      showToastMessage('Token error cleared. You can try fetching balance again.');
    }
  };

  useEffect(() => {
    if (selectedToken) {
      fetchTokenInfo(selectedToken).catch((error) => {
        console.error('ViewingKeyDebugger - Error in fetchTokenInfo:', error);
        addLog(
          `Error fetching token info: ${error instanceof Error ? error.message : String(error)}`
        );
      });
    }
  }, [selectedToken, walletAddress]);

  return (
    <Toast.Provider swipeDirection="right">
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button className="fixed bottom-4 right-4 bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark hover:from-adamant-dark hover:to-adamant-dark text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 z-50">
            <GearIcon className="w-6 h-6" />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-adamant-background border border-adamant-box-border rounded-lg p-6 w-[90vw] max-w-4xl max-h-[90vh] overflow-auto z-50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark bg-clip-text text-transparent">
                Token Configuration
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-adamant-text-box-secondary hover:text-adamant-text-box-main transition-colors p-1 rounded-lg hover:bg-adamant-box-regular">
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              {/* Token Selection */}
              <div>
                <label className="block text-sm font-medium text-adamant-text-form-main mb-3">
                  Select Token
                </label>
                <Select.Root value={selectedToken} onValueChange={setSelectedToken}>
                  <Select.Trigger className="flex items-center justify-between w-full bg-adamant-app-selectTrigger border border-adamant-box-border rounded-lg px-4 py-3 text-adamant-text-box-main hover:border-adamant-gradientBright transition-colors duration-150">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDownIcon className="text-adamant-text-box-secondary" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="bg-adamant-box-dark border border-adamant-box-border rounded-lg shadow-2xl z-50">
                      <Select.Viewport className="p-2">
                        {allTokens.map((token) => (
                          <Select.Item
                            key={token.address}
                            value={token.address}
                            className="flex items-center px-4 py-3 text-adamant-text-box-main hover:bg-adamant-box-regular cursor-pointer rounded-lg transition-colors duration-150"
                          >
                            <Select.ItemText>
                              <span className="font-medium">{token.symbol}</span>
                              <span className="text-adamant-text-box-secondary ml-2">
                                - {token.name}
                              </span>
                            </Select.ItemText>
                            <Select.ItemIndicator className="ml-auto">
                              <CheckIcon className="text-adamant-gradientBright" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <Tabs.Root defaultValue="info" className="w-full">
                <Tabs.List className="flex border-b border-adamant-box-border bg-adamant-box-regular rounded-t-lg p-1">
                  <Tabs.Trigger
                    value="info"
                    className="px-6 py-3 text-adamant-text-box-secondary hover:text-adamant-text-box-main data-[state=active]:text-adamant-text-button-form-main data-[state=active]:bg-adamant-button-form-main data-[state=active]:border-b-2 data-[state=active]:border-adamant-gradientBright rounded-lg transition-all duration-150 font-medium"
                  >
                    Token Info
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="actions"
                    className="px-6 py-3 text-adamant-text-box-secondary hover:text-adamant-text-box-main data-[state=active]:text-adamant-text-button-form-main data-[state=active]:bg-adamant-button-form-main data-[state=active]:border-b-2 data-[state=active]:border-adamant-gradientBright rounded-lg transition-all duration-150 font-medium"
                  >
                    Actions
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="logs"
                    className="px-6 py-3 text-adamant-text-box-secondary hover:text-adamant-text-box-main data-[state=active]:text-adamant-text-button-form-main data-[state=active]:bg-adamant-button-form-main data-[state=active]:border-b-2 data-[state=active]:border-adamant-gradientBright rounded-lg transition-all duration-150 font-medium"
                  >
                    Debug Logs ({logs.length})
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="info" className="mt-6">
                  {tokenInfo && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-adamant-box-dark p-6 rounded-lg border border-adamant-box-border">
                          <h3 className="font-semibold text-adamant-text-box-main mb-4 flex items-center">
                            <div className="w-2 h-2 bg-adamant-gradientBright rounded-full mr-3"></div>
                            Token Details
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-adamant-text-box-secondary">Symbol:</span>
                              <span className="text-adamant-text-box-main font-medium">
                                {tokenInfo.symbol}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-adamant-text-box-secondary">Name:</span>
                              <span className="text-adamant-text-box-main">{tokenInfo.name}</span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-adamant-text-box-secondary">Address:</span>
                              <span className="text-adamant-text-box-main font-mono text-xs bg-adamant-box-regular p-2 rounded break-all">
                                {tokenInfo.address}
                              </span>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className="text-adamant-text-box-secondary">Code Hash:</span>
                              <span className="text-adamant-text-box-main font-mono text-xs bg-adamant-box-regular p-2 rounded break-all">
                                {tokenInfo.codeHash}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-adamant-box-dark p-6 rounded-lg border border-adamant-box-border">
                          <h3 className="font-semibold text-adamant-text-box-main mb-4 flex items-center">
                            <div className="w-2 h-2 bg-adamant-gradientBright rounded-full mr-3"></div>
                            Viewing Key Status
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-adamant-text-box-secondary">Has Key:</span>
                              {tokenInfo.isLoadingKey ? (
                                <div className="flex items-center">
                                  <ReloadIcon className="w-4 h-4 animate-spin text-adamant-gradientBright mr-2" />
                                  <span className="text-adamant-text-box-secondary">
                                    Checking...
                                  </span>
                                </div>
                              ) : (
                                <span
                                  className={`font-semibold flex items-center ${
                                    tokenInfo.hasViewingKey ? 'text-green-400' : 'text-red-400'
                                  }`}
                                >
                                  {tokenInfo.hasViewingKey ? (
                                    <>
                                      <CheckCircledIcon className="w-4 h-4 mr-1" />
                                      Yes
                                    </>
                                  ) : (
                                    <>
                                      <CrossCircledIcon className="w-4 h-4 mr-1" />
                                      No
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                            {tokenInfo.viewingKeyPreview && (
                              <div className="flex justify-between">
                                <span className="text-adamant-text-box-secondary">
                                  Key Preview:
                                </span>
                                <span className="text-adamant-text-box-main font-mono bg-adamant-box-regular px-2 py-1 rounded">
                                  {tokenInfo.viewingKeyPreview}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-adamant-text-box-secondary">Balance:</span>
                              {tokenInfo.isLoadingBalance ? (
                                <div className="flex items-center">
                                  <ReloadIcon className="w-4 h-4 animate-spin text-adamant-gradientBright mr-2" />
                                  <span className="text-adamant-text-box-secondary">
                                    Loading...
                                  </span>
                                </div>
                              ) : tokenInfo.balance ? (
                                <span className="text-green-400 font-medium flex items-center">
                                  <CheckIcon className="w-4 h-4 mr-1" />
                                  {tokenInfo.balance}
                                </span>
                              ) : tokenInfo.hasViewingKey && walletAddress ? (
                                <button
                                  onClick={() => {
                                    setSuggestedTokens(new Set()); // Reset suggested tokens tracking
                                    void fetchTokenInfo(selectedToken);
                                  }}
                                  className="text-adamant-gradientBright hover:text-adamant-gradientDark text-xs flex items-center transition-colors duration-150"
                                >
                                  <ReloadIcon className="w-3 h-3 mr-1" />
                                  Retry
                                </button>
                              ) : (
                                <span className="text-adamant-text-box-secondary">
                                  Not available
                                </span>
                              )}
                            </div>
                            {tokenInfo.error && (
                              <div className="text-red-400 text-xs mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start">
                                    <ExclamationTriangleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-2">
                                      <div>
                                        <strong>Error:</strong> {tokenInfo.error}
                                      </div>
                                      {tokenInfo.suggestedAction && (
                                        <div className="text-yellow-400 text-xs">
                                          <strong>Suggestion:</strong> {tokenInfo.suggestedAction}
                                        </div>
                                      )}
                                      {tokenInfo.errorType ===
                                        TokenServiceErrorType.VIEWING_KEY_INVALID && (
                                        <button
                                          onClick={() => void resetViewingKey(tokenInfo.address)}
                                          className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1 rounded text-xs font-medium transition-colors"
                                        >
                                          Reset Viewing Key
                                        </button>
                                      )}
                                      {tokenInfo.errorType ===
                                        TokenServiceErrorType.VIEWING_KEY_REQUIRED && (
                                        <button
                                          onClick={() => void suggestToken(tokenInfo.address)}
                                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                        >
                                          Set Viewing Key
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={clearTokenError}
                                    className="ml-2 text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-adamant-box-dark p-6 rounded-lg border border-adamant-box-border">
                        <h3 className="font-semibold text-adamant-text-box-main mb-4 flex items-center">
                          <div className="w-2 h-2 bg-adamant-gradientBright rounded-full mr-3"></div>
                          Wallet Connection
                        </h3>
                        <div className="text-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-adamant-text-box-secondary">Status:</span>
                            <span
                              className={`font-semibold flex items-center ${
                                walletAddress ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {walletAddress ? (
                                <>
                                  <CheckCircledIcon className="w-4 h-4 mr-1" />
                                  Connected
                                </>
                              ) : (
                                <>
                                  <CrossCircledIcon className="w-4 h-4 mr-1" />
                                  Disconnected
                                </>
                              )}
                            </span>
                          </div>
                          {walletAddress && (
                            <div className="flex flex-col space-y-1">
                              <span className="text-adamant-text-box-secondary">Address:</span>
                              <span className="text-adamant-text-box-main font-mono text-xs bg-adamant-box-regular p-2 rounded break-all">
                                {walletAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Tabs.Content>

                <Tabs.Content value="actions" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setSuggestedTokens(new Set()); // Reset suggested tokens tracking
                        fetchTokenInfo(selectedToken).catch((error) => {
                          console.error('ViewingKeyDebugger - Error in manual refresh:', error);
                          addLog(
                            `Manual refresh failed: ${
                              error instanceof Error ? error.message : String(error)
                            }`
                          );
                        });
                      }}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark hover:from-adamant-dark hover:to-adamant-dark disabled:from-adamant-app-buttonDisabled disabled:to-adamant-app-buttonDisabled text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-center font-medium transform hover:scale-105 disabled:hover:scale-100"
                    >
                      {isLoading ? (
                        <ReloadIcon className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RocketIcon className="w-4 h-4 mr-2" />
                      )}
                      Refresh Analysis
                    </button>
                    <button
                      onClick={() => {
                        addTokenToWallet(selectedToken).catch((error) => {
                          console.error('ViewingKeyDebugger - Error in add token button:', error);
                          addLog(
                            `Add token failed: ${
                              error instanceof Error ? error.message : String(error)
                            }`
                          );
                        });
                      }}
                      disabled={isLoading}
                      className="bg-adamant-button-form-main hover:bg-adamant-button-form-main/80 disabled:bg-adamant-app-buttonDisabled text-adamant-button-form-secondary p-4 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Token to Wallet
                    </button>
                    <button
                      onClick={() => {
                        suggestToken(selectedToken).catch((error) => {
                          console.error(
                            'ViewingKeyDebugger - Error in suggest token button:',
                            error
                          );
                          addLog(
                            `Suggest token failed: ${
                              error instanceof Error ? error.message : String(error)
                            }`
                          );
                        });
                      }}
                      disabled={isLoading}
                      className="bg-adamant-button-form-main hover:bg-adamant-button-form-main/80 disabled:bg-adamant-app-buttonDisabled text-adamant-button-form-secondary p-4 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                    >
                      <LightningBoltIcon className="w-4 h-4 mr-2" />
                      Suggest Token to Keplr
                    </button>
                    <button
                      onClick={() => {
                        resetViewingKey(selectedToken).catch((error) => {
                          console.error(
                            'ViewingKeyDebugger - Error in reset viewing key button:',
                            error
                          );
                          addLog(
                            `Reset viewing key failed: ${
                              error instanceof Error ? error.message : String(error)
                            }`
                          );
                        });
                      }}
                      disabled={isLoading}
                      className="bg-adamant-button-form-main hover:bg-adamant-button-form-main/80 disabled:bg-adamant-app-buttonDisabled text-adamant-button-form-secondary p-4 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                    >
                      <ReloadIcon className="w-4 h-4 mr-2" />
                      Reset Viewing Key
                    </button>
                    <button
                      onClick={clearCachedError}
                      disabled={isLoading}
                      className="bg-adamant-button-form-main hover:bg-adamant-button-form-main/80 disabled:bg-adamant-app-buttonDisabled text-adamant-button-form-secondary p-4 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                    >
                      <Cross2Icon className="w-4 h-4 mr-2" />
                      Clear Cached Errors
                    </button>
                    <button
                      onClick={clearTokenError}
                      disabled={isLoading || !tokenInfo?.error}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-adamant-app-buttonDisabled text-white p-4 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                    >
                      <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                      Clear Token Error
                    </button>
                  </div>
                  <div className="mt-6 p-6 bg-adamant-box-dark border border-adamant-gradientBright/30 rounded-lg">
                    <h4 className="text-adamant-gradientBright font-semibold mb-4 flex items-center">
                      <InfoCircledIcon className="w-5 h-5 mr-3 text-adamant-gradientBright" />
                      Troubleshooting Guide
                    </h4>
                    <ul className="text-sm text-adamant-text-box-secondary space-y-2">
                      <li className="flex items-start">
                        <span className="text-adamant-gradientBright mr-2">•</span>
                        If token is not in wallet, use "Add Token to Wallet"
                      </li>
                      <li className="flex items-start">
                        <span className="text-adamant-gradientBright mr-2">•</span>
                        If viewing key exists but balance fails, try "Reset Viewing Key"
                      </li>
                      <li className="flex items-start">
                        <span className="text-adamant-gradientBright mr-2">•</span>
                        If no viewing key exists, use "Suggest Token to Keplr"
                      </li>
                      <li className="flex items-start">
                        <span className="text-adamant-gradientBright mr-2">•</span>
                        If Keplr shows a warning about viewing key, click it to set a new one
                      </li>
                      <li className="flex items-start">
                        <span className="text-adamant-gradientBright mr-2">•</span>
                        Clear cached errors if you're seeing stale error messages
                      </li>
                      <li className="flex items-start">
                        <span className="text-adamant-gradientBright mr-2">•</span>
                        Check debug logs tab for detailed information
                      </li>
                      <li className="flex items-start">
                        <span className="text-adamant-gradientBright mr-2">•</span>
                        Manual removal from Keplr settings is rarely needed
                      </li>
                    </ul>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="logs" className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-adamant-text-box-main flex items-center">
                      <div className="w-2 h-2 bg-adamant-gradientBright rounded-full mr-3"></div>
                      Debug Logs
                    </h3>
                    <button
                      onClick={clearLogs}
                      className="text-sm bg-adamant-button-form-main hover:bg-adamant-button-form-main/80 text-adamant-button-form-secondary px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Clear Logs
                    </button>
                  </div>
                  <div className="bg-adamant-box-veryDark border border-adamant-box-border rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                      <div className="text-adamant-text-box-secondary flex items-center justify-center h-full">
                        No logs yet. Perform an action to see debug information.
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <div
                          key={index}
                          className="text-adamant-text-box-secondary mb-1 hover:text-adamant-text-box-main transition-colors"
                        >
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </Tabs.Content>
              </Tabs.Root>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Toast.Root
        className="bg-adamant-box-dark border border-adamant-box-border rounded-lg p-4 shadow-2xl backdrop-blur-sm"
        open={showToast}
        onOpenChange={setShowToast}
      >
        <Toast.Title className="text-adamant-text-box-main font-semibold">
          {toastMessage}
        </Toast.Title>
      </Toast.Root>

      <Toast.Viewport className="fixed bottom-0 right-0 flex flex-col p-6 gap-2 w-96 max-w-[100vw] m-0 list-none z-50" />
    </Toast.Provider>
  );
};
