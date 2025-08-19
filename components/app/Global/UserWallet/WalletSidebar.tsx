import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { useLoadBalancePreference } from '@/hooks/useLoadBalancePreference';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useWalletTotalValue } from '@/hooks/useWalletTotalValue';
import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { useModalStore } from '@/store/modalStore';
import { useTokenStore } from '@/store/tokenStore';
import { useWalletStore } from '@/store/walletStore';
import { SecretString } from '@/types';
import { isPricingEnabled } from '@/utils/features';
import { showToastOnce } from '@/utils/toast/toastManager';
import React, { useEffect, useRef, useState } from 'react';
import { HiQrCode } from 'react-icons/hi2';
import {
  RiArrowRightSLine,
  RiFileCopyLine,
  RiKey2Line,
  RiRefreshLine,
  RiSendPlaneLine,
  RiSettings3Line,
  RiWalletLine,
} from 'react-icons/ri';
import { ContractKeysPanel } from './ContractKeysPanel';
import { ReceivePanel } from './ReceivePanel';
import { SendTokensPanel } from './SendTokensPanel';
import { TokenListItem } from './TokenListItem';

const WalletSidebar: React.FC = () => {
  const { closeWalletModal, isWalletModalOpen } = useModalStore();
  const { address } = useWalletStore();
  const { listAllTokens } = useTokenStore();
  const { fetchAllBalances, isProcessingQueue } = useBalanceFetcherStore();
  const loadBalanceConfig = useLoadBalancePreference();

  const walletBalance = useWalletBalance();
  const walletTotal = isPricingEnabled() ? useWalletTotalValue() : null;
  const tokens = listAllTokens() ?? [];
  const sidebarRef = useRef<HTMLElement>(null);

  // Instead of separate dialogs, just track which "sub-view" to render:
  const [currentView, setCurrentView] = useState<
    'main' | 'send' | 'receive' | 'settings' | 'contractKeys'
  >('main');

  const truncatedAddress = address === null ? '' : address.slice(0, 8) + '...' + address.slice(-6);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isWalletModalOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        handleCloseSidebar();
      }
    };

    if (isWalletModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isWalletModalOpen]);

  const copyAddressToClipboard = () => {
    if (address === null) return;
    void navigator.clipboard.writeText(address).then(() => {
      showToastOnce('address-copied', 'Address copied to clipboard!', 'success');
    });
  };

  const refreshAllBalances = () => {
    fetchAllBalances();
    showToastOnce('refresh-started', 'Refreshing all token balances...', 'info');
  };

  if (!isWalletModalOpen) {
    return null;
  }

  // Common "back" or "close" triggers
  const handleCloseSidebar = () => {
    closeWalletModal();
    setCurrentView('main');
  };

  const handleBackToSettings = () => {
    setCurrentView('settings');
  };

  return (
    <div className="relative">
      {/* Underlay behind the sidebar - with individual hover detection */}
      <div
        className={`
          fixed right-2.5 top-2.5 w-[440px] h-full z-40
          bg-[rgba(255,255,255,0.025)] rounded-l-xl
          transition-all duration-200 ease-out cursor-pointer
          hover:bg-[rgba(255,255,255,0.04)]
          hover:translate-x-[-8px]
          hover:shadow-lg
          ${isWalletModalOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-2.5 right-2.5 bottom-0 w-[390px] z-50
          bg-gradient-to-b from-adamant-app-input via-adamant-app-input to-adamant-box-veryDark
          backdrop-blur-lg
          transition-transform duration-300 ease-out
          shadow-2xl border-l border-t rounded-l-xl border-adamant-box-border
          border-r rounded-r-xl
          flex flex-col h-screen
          ${isWalletModalOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header - Fixed height */}
        <div className="relative flex-shrink-0">
          <div className="relative p-6">
            {currentView === 'main' && (
              <div className="space-y-4">
                {/* Top row with wallet info and buttons */}
                <div className="flex items-start justify-between">
                  {/* Wallet info - positioned top left */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <TokenImageWithFallback
                        tokenAddress={(address as SecretString) ?? 'secret1defaultaddress'}
                        size={48}
                        alt="Wallet"
                        className="rounded-2xl ring-2 ring-adamant-gradientBright/20"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-adamant-app-input"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <RiWalletLine className="w-3 h-3 text-adamant-gradientBright" />
                        <span className="text-xs font-medium text-adamant-gradientBright uppercase tracking-wide">
                          Secret Network
                        </span>
                      </div>
                      <div
                        onClick={copyAddressToClipboard}
                        className="font-sans text-base font-semibold text-white cursor-pointer hover:text-adamant-gradientBright transition-colors duration-200 group flex items-center gap-2"
                        title="Click to copy address"
                      >
                        {truncatedAddress || 'Not connected'}
                        <RiFileCopyLine className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>

                  {/* Settings and close buttons - positioned top right */}
                  <div className="flex items-center gap-2">
                    {/* <button
                    onClick={openSettings}
                    className="p-2 rounded-lg hover:bg-adamant-box-dark/50 transition-all duration-200 text-adamant-text-box-secondary hover:text-white group"
                    title="Settings"
                  >
                    <RiSettings3Line className="w-4 h-4" />
                  </button> */}
                    <button
                      onClick={handleCloseSidebar}
                      className="p-2 rounded-lg hover:bg-adamant-box-dark/50 transition-all duration-200 text-adamant-text-box-secondary hover:text-white group"
                      title="Close wallet"
                    >
                      <RiArrowRightSLine className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Native SCRT Balance Display */}
                <div className="text-left py-4">
                  {walletBalance.loading ? (
                    <div className="text-2xl font-medium text-white">Loading balance...</div>
                  ) : (
                    <>
                      {/* Total USD Value - Only show if pricing is enabled and we have a valid price */}
                      {isPricingEnabled() &&
                        walletBalance.scrtPrice > 0 &&
                        !walletBalance.error && (
                          <div className="flex items-end gap-3 mb-1">
                            <div className="text-4xl font-medium text-white">
                              ${walletBalance.totalUsdValue.toFixed(2)}
                            </div>
                            {walletTotal && !walletTotal.loading && (
                              <div
                                className={`mb-1 text-sm font-medium ${
                                  walletTotal.change24hPercent >= 0
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {walletTotal.change24hPercent >= 0 ? '+' : ''}
                                {walletTotal.change24hPercent.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        )}

                      {/* SCRT Equivalent - Show when pricing is enabled, otherwise show placeholder */}
                      <div
                        className={`${
                          isPricingEnabled() && walletBalance.scrtPrice > 0 && !walletBalance.error
                            ? 'text-base'
                            : 'text-4xl'
                        } text-white font-medium`}
                      >
                        {isPricingEnabled() && walletBalance.scrtPrice > 0 && !walletBalance.error
                          ? `${walletBalance.scrtEquivalent} SCRT`
                          : 'Connect for pricing'}
                      </div>

                      {/* Error display */}
                      {walletBalance.error && (
                        <div className="text-sm text-red-400 mt-2">
                          Error: {walletBalance.error}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setCurrentView('send')}
                    className="flex-1 group relative bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] shadow-lg hover:shadow-xl hover:ring-2 hover:ring-adamant-gradientBright/30"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RiSendPlaneLine className="w-4 h-4" />
                      <span className="text-sm uppercase tracking-wide font-black">Send</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setCurrentView('receive')}
                    className="flex-1 group bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 active:scale-[0.98] shadow-lg hover:shadow-xl hover:ring-2 hover:ring-adamant-gradientBright/30"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <HiQrCode className="w-4 h-4" />
                      <span className="text-sm uppercase tracking-wide">Receive</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {(currentView === 'send' ||
              currentView === 'receive' ||
              currentView === 'settings' ||
              currentView === 'contractKeys') && (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  {currentView === 'send' && (
                    <>
                      <RiSendPlaneLine className="w-6 h-6 text-adamant-gradientBright" />
                      Send Tokens
                    </>
                  )}
                  {currentView === 'receive' && (
                    <>
                      <HiQrCode className="w-6 h-6 text-adamant-gradientBright" />
                      Receive Tokens
                    </>
                  )}
                  {currentView === 'settings' && (
                    <>
                      <RiSettings3Line className="w-6 h-6 text-adamant-gradientBright" />
                      Settings
                    </>
                  )}
                  {currentView === 'contractKeys' && (
                    <>
                      <RiKey2Line className="w-6 h-6 text-adamant-gradientBright" />
                      Contract Keys
                    </>
                  )}
                </h2>
                <button
                  onClick={handleCloseSidebar}
                  className="p-2 rounded-xl hover:bg-adamant-box-dark/50 transition-all duration-200 text-adamant-text-box-secondary hover:text-white group"
                  title="Close"
                >
                  <RiArrowRightSLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Wallet View */}
        {currentView === 'main' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tokens Section */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Tokens Header - Fixed */}
              <div className="flex-shrink-0 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">Tokens</h3>
                  {loadBalanceConfig.shouldShowFetchButton && (
                    <button
                      onClick={refreshAllBalances}
                      disabled={isProcessingQueue}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-adamant-box-dark hover:bg-adamant-box-regular border border-adamant-gradientBright/20 hover:border-adamant-gradientBright/40 rounded-lg transition-all duration-200 text-adamant-text-box-secondary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <RiRefreshLine
                        className={`w-4 h-4 ${
                          isProcessingQueue ? 'animate-spin' : 'group-hover:rotate-180'
                        } transition-transform duration-300`}
                      />
                      {isProcessingQueue ? 'Refreshing...' : 'Refresh'}
                    </button>
                  )}
                </div>
              </div>

              {/* Tokens List - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {tokens.length > 0 ? (
                  <div
                    className=""
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#8A754A #1a1a2e' }}
                  >
                    {tokens.map((token, index) => (
                      <TokenListItem key={index} token={token} />
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-4 max-w-xs">
                      <div className="w-16 h-16 bg-adamant-box-dark rounded-2xl flex items-center justify-center mx-auto">
                        <RiWalletLine className="w-8 h-8 text-adamant-text-box-secondary" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-adamant-text-box-main font-medium">
                          No tokens found
                        </div>
                        <div className="text-sm text-adamant-text-box-secondary leading-relaxed">
                          Your tokens will appear here once you add them to your wallet or receive
                          transfers.
                        </div>
                        <button className="bg-adamant-box-dark hover:bg-adamant-box-regular text-white px-4 py-2 rounded-lg border border-adamant-gradientBright/30 hover:border-adamant-gradientBright/60 transition-all duration-200 text-sm">
                          View Balance
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Send Tokens View */}
        {currentView === 'send' && address !== null && (
          <div className="flex-1 overflow-hidden">
            <SendTokensPanel walletAddress={address} onClose={() => setCurrentView('main')} />
          </div>
        )}

        {/* Receive Tokens View */}
        {currentView === 'receive' && address !== null && (
          <div className="flex-1 overflow-hidden">
            <ReceivePanel walletAddress={address} onClose={() => setCurrentView('main')} />
          </div>
        )}

        {/* Settings View - Simplified */}
        {currentView === 'settings' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="space-y-4">
                {/* Comment out balance auto-loading since it's not in use */}
                {/* 
              <div>
                <h4 className="text-sm font-medium text-adamant-text-box-main mb-2">Balance Auto-Loading</h4>
                <div className="text-xs text-adamant-text-box-secondary">Feature not currently in use</div>
              </div>
              */}

                {/* Comment out contract keys since we have a different way of handling things now */}
                {/* 
              <button
                onClick={() => setCurrentView('contractKeys')}
                className="w-full text-left p-3 bg-adamant-box-dark hover:bg-adamant-box-regular rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <RiKey2Line className="w-5 h-5 text-adamant-gradientBright" />
                  <div>
                    <div className="text-sm font-medium text-adamant-text-box-main">Manage Contract Keys</div>
                    <div className="text-xs text-adamant-text-box-secondary">Feature not currently in use</div>
                  </div>
                </div>
              </button>
              */}

                <div className="text-center text-adamant-text-box-secondary text-sm">
                  Settings panel simplified - advanced features will be added as needed.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contract Keys View */}
        {currentView === 'contractKeys' && (
          <div className="flex-1 overflow-hidden">
            <ContractKeysPanel onClose={handleBackToSettings} />
          </div>
        )}
      </aside>
    </div>
  );
};

export default WalletSidebar;
