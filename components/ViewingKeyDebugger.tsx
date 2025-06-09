import { TOKENS } from '@/config/tokens';
import { useBalance } from '@/hooks/useBalance';
import { useSecretNetwork } from '@/hooks/useSecretNetwork';
import { balanceService } from '@/services/balanceService';
import { SecretString } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import {
  CheckCircledIcon,
  CheckIcon,
  ChevronDownIcon,
  Cross2Icon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  GearIcon,
  LightningBoltIcon,
  ReloadIcon,
  RocketIcon,
} from '@radix-ui/react-icons';
import * as Select from '@radix-ui/react-select';
import * as Tabs from '@radix-ui/react-tabs';
import * as Toast from '@radix-ui/react-toast';
import React, { useCallback, useEffect, useState } from 'react';

// Simplified Info structure, as balance/error comes from useBalance
interface DebugTokenInfo {
  address: string;
  symbol: string;
  name: string;
  codeHash: string;
  hasViewingKey: boolean;
  viewingKeyPreview?: string;
  isLoadingKey: boolean;
}

export const ViewingKeyDebugger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>(TOKENS[0]?.address ?? '');
  const [tokenInfo, setTokenInfo] = useState<DebugTokenInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);

  const { walletAddress } = useSecretNetwork();
  // Get balance data from our new centralized hook
  const {
    amount: balance,
    loading: isLoadingBalance,
    error: balanceError,
    refetch: refetchBalance,
  } = useBalance(selectedToken as SecretString);

  // Add staking contracts manually for debugging
  const stakingContracts = [
    {
      address: 'secret15rlkcn54mjkwfl6s735zjx3v7zcry6g499t5ev',
      symbol: 'bADMT Staking',
      name: 'Staking Contract for bADMT',
      codeHash: 'c644edd309de7fd865b4fbe22054bcbe85a6c0b8abf5f110053fe1b2d0e8a72a',
      decimals: 6, // Assuming decimals for display
    },
  ];

  const allTokens = [...TOKENS, ...stakingContracts];

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]); // Keep last 50 logs
  }, []);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const getTokenByAddress = (address: string) => {
    return allTokens.find((token) => token.address === address);
  };

  const checkViewingKey = useCallback(
    async (tokenAddress: string) => {
      if (!window.keplr) {
        addLog('Keplr not found');
        return;
      }
      addLog(`Checking viewing key for ${tokenAddress}`);
      setTokenInfo((prev) => (prev ? { ...prev, isLoadingKey: true } : null));
      try {
        const viewingKey = await window.keplr
          .getSecret20ViewingKey('secret-4', tokenAddress)
          .catch(() => null);

        setTokenInfo((prev) => {
          if (!prev) return null;
          const newInfo: DebugTokenInfo = {
            ...prev,
            hasViewingKey: !!viewingKey,
            isLoadingKey: false,
          };
          if (viewingKey) {
            newInfo.viewingKeyPreview = `${viewingKey.substring(0, 8)}...`;
          }
          return newInfo;
        });
        if (viewingKey) {
          addLog(`Viewing key found: ${viewingKey.substring(0, 8)}...`);
        } else {
          addLog('No viewing key found');
        }
      } catch (error) {
        addLog(`Error checking viewing key: ${String(error)}`);
        setTokenInfo((prev) => (prev ? { ...prev, isLoadingKey: false } : null));
      }
    },
    [addLog]
  );

  // This effect runs when the selected token changes, to update all info.
  useEffect(() => {
    const token = getTokenByAddress(selectedToken);
    if (!token) return;

    addLog(`Starting analysis for ${token.symbol} (${token.name})`);

    // Set basic info immediately
    setTokenInfo({
      address: selectedToken,
      symbol: token.symbol,
      name: token.name,
      codeHash: token.codeHash,
      hasViewingKey: false, // Default state, will be updated
      isLoadingKey: true,
    });

    // Check for the viewing key
    void checkViewingKey(selectedToken);

    // Balance is handled by the useBalance hook automatically
  }, [selectedToken, walletAddress, checkViewingKey, addLog]);

  const handleRefresh = useCallback(() => {
    addLog('Manual refresh triggered.');
    if (selectedToken) {
      void checkViewingKey(selectedToken);
      refetchBalance();
    }
  }, [selectedToken, checkViewingKey, refetchBalance, addLog]);

  // Actions now use the centralized balanceService
  const handleSuggestToken = useCallback(async () => {
    addLog(`Suggesting token to Keplr: ${selectedToken}`);
    await balanceService.requestTokenSuggestion(selectedToken);
    showToastMessage('Token suggestion sent to Keplr.');
    handleRefresh(); // Refresh info after action
  }, [selectedToken, addLog, handleRefresh]);

  const handleResetViewingKey = useCallback(async () => {
    addLog(`Attempting to reset viewing key for ${selectedToken}`);
    await balanceService.resetViewingKey(selectedToken);
    showToastMessage('Viewing key reset initiated. Please check Keplr.');
    handleRefresh(); // Refresh info after action
  }, [selectedToken, addLog, handleRefresh]);

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  const formatBalance = (bal: string | null, decimals: number): string => {
    if (bal === null || bal === undefined) return 'N/A';
    const num = parseFloat(bal);
    if (isNaN(num)) return 'N/A';
    return (num / Math.pow(1, decimals)).toFixed(6);
  };

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
                              {isLoadingBalance ? (
                                <div className="flex items-center">
                                  <ReloadIcon className="w-4 h-4 animate-spin text-adamant-gradientBright mr-2" />
                                  <span className="text-adamant-text-box-secondary">
                                    Loading...
                                  </span>
                                </div>
                              ) : balance ? (
                                <span className="text-green-400 font-medium flex items-center">
                                  <CheckIcon className="w-4 h-4 mr-1" />
                                  {formatBalance(
                                    balance,
                                    getTokenByAddress(selectedToken)?.decimals ?? 6
                                  )}
                                </span>
                              ) : (
                                <span className="text-adamant-text-box-secondary">
                                  Not available
                                </span>
                              )}
                            </div>
                            {balanceError && (
                              <div className="text-red-400 text-xs mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <div className="flex items-start">
                                  <ExclamationTriangleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                  <div className="space-y-2">
                                    <div>
                                      <strong>Error:</strong> {balanceError}
                                    </div>
                                    <div className="text-yellow-400 text-xs">
                                      <strong>Suggestion:</strong> Try adding the token to your
                                      wallet or resetting the viewing key.
                                    </div>
                                  </div>
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
                      onClick={handleRefresh}
                      disabled={isLoadingBalance}
                      className="bg-gradient-to-r from-adamant-gradientBright to-adamant-gradientDark hover:from-adamant-dark hover:to-adamant-dark disabled:from-adamant-app-buttonDisabled disabled:to-adamant-app-buttonDisabled text-white p-4 rounded-lg transition-all duration-200 flex items-center justify-center font-medium transform hover:scale-105 disabled:hover:scale-100"
                    >
                      {isLoadingBalance ? (
                        <ReloadIcon className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RocketIcon className="w-4 h-4 mr-2" />
                      )}
                      Refresh Analysis
                    </button>
                    <button
                      onClick={handleSuggestToken}
                      disabled={isLoadingBalance}
                      className="bg-adamant-button-form-main hover:bg-adamant-button-form-main/80 disabled:bg-adamant-app-buttonDisabled text-adamant-button-form-secondary p-4 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                    >
                      <LightningBoltIcon className="w-4 h-4 mr-2" />
                      Suggest Token to Keplr
                    </button>
                    <button
                      onClick={handleResetViewingKey}
                      disabled={isLoadingBalance}
                      className="bg-adamant-button-form-main hover:bg-adamant-button-form-main/80 disabled:bg-adamant-app-buttonDisabled text-adamant-button-form-secondary p-4 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                    >
                      <ReloadIcon className="w-4 h-4 mr-2" />
                      Reset Viewing Key
                    </button>
                    <button
                      onClick={clearLogs}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-adamant-app-buttonDisabled text-white p-4 rounded-lg transition-all duration-200 font-medium transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                    >
                      <Cross2Icon className="w-4 h-4 mr-2" />
                      Clear Logs
                    </button>
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
