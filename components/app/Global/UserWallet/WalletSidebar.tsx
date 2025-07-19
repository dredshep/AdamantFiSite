import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { useLoadBalancePreference } from '@/hooks/useLoadBalancePreference';
import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { useModalStore } from '@/store/modalStore';
import { useTokenStore } from '@/store/tokenStore';
import { useWalletStore } from '@/store/walletStore';
import { SecretString } from '@/types';
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

  const openSettings = () => {
    setCurrentView('settings');
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
    <aside
      ref={sidebarRef}
      className={`
        fixed top-0 right-0 bottom-0 w-[380px] z-50
        bg-gradient-to-b from-adamant-app-input via-adamant-app-input to-adamant-box-veryDark
        backdrop-blur-lg
        transition-transform duration-300 ease-out
        shadow-2xl border-l border-adamant-gradientBright/10
        ${isWalletModalOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-adamant-gradientBright/5 via-adamant-gradientDim/5 to-transparent" />

        <div className="relative p-6 border-b border-adamant-box-border/30">
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

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCurrentView('send')}
                  className="flex-1 group relative bg-white hover:bg-gray-100 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RiSendPlaneLine className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                    <span className="text-sm uppercase tracking-wide font-black">Send</span>
                  </div>
                </button>
                <button
                  onClick={() => setCurrentView('receive')}
                  className="flex-1 group bg-adamant-box-dark hover:bg-adamant-box-regular text-white font-bold py-3 px-4 rounded-lg border border-adamant-gradientBright/30 hover:border-adamant-gradientBright/60 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <HiQrCode className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
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
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tokens Section */}
          <div className="py-6 flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-6 px-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Tokens
              </h3>
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

            {tokens.length > 0 ? (
              <div
                className="space-y-3 overflow-y-auto h-full pl-3"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#8A754A #1a1a2e' }}
              >
                {tokens.map((token, index) => (
                  <div
                    key={index}
                    className="transform hover:scale-[1.01] transition-transform duration-200"
                  >
                    <TokenListItem token={token} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-xs">
                  <div className="w-16 h-16 bg-adamant-box-dark rounded-2xl flex items-center justify-center mx-auto">
                    <RiWalletLine className="w-8 h-8 text-adamant-text-box-secondary" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-adamant-text-box-main font-medium">No tokens found</div>
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
      )}

      {/* Send Tokens View */}
      {currentView === 'send' && address !== null && (
        <SendTokensPanel walletAddress={address} onClose={() => setCurrentView('main')} />
      )}

      {/* Receive Tokens View */}
      {currentView === 'receive' && address !== null && (
        <ReceivePanel walletAddress={address} onClose={() => setCurrentView('main')} />
      )}

      {/* Settings View - Simplified */}
      {currentView === 'settings' && (
        <div className="flex-1 p-6">
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
      )}

      {/* Contract Keys View */}
      {currentView === 'contractKeys' && <ContractKeysPanel onClose={handleBackToSettings} />}
    </aside>
  );
};

export default WalletSidebar;
