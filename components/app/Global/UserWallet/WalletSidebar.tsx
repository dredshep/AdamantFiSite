import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { TOKENS } from '@/config/tokens';
import { useAllTokensPricing } from '@/hooks/useCoinGeckoPricing';
import { useLoadBalancePreference } from '@/hooks/useLoadBalancePreference';
import { useNativeSCRTBalance } from '@/hooks/useNativeSCRTBalance';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useWalletTotalValue } from '@/hooks/useWalletTotalValue';
import { useBalanceFetcherStore } from '@/store/balanceFetcherStore';
import { useModalStore } from '@/store/modalStore';
import { useTokenStore } from '@/store/tokenStore';
import { useWalletStore } from '@/store/walletStore';
import { SecretString } from '@/types';
import { isPricingEnabled } from '@/utils/features';
import { showToastOnce } from '@/utils/toast/toastManager';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const allBalances = useBalanceFetcherStore((state) => state.balances);
  const loadBalanceConfig = useLoadBalancePreference();

  const walletBalance = useWalletBalance();
  const walletTotal = isPricingEnabled() ? useWalletTotalValue() : null;
  const nativeScrt = useNativeSCRTBalance();
  const pricingState = isPricingEnabled() ? useAllTokensPricing(TOKENS) : null;

  // Computation kept for future use but currently unused
  useMemo(() => {
    if (!isPricingEnabled() || !pricingState) {
      return {
        totalUSDComputed: 0,
        totalSCRTComputed: 0,
        change24hPercentComputed: 0,
      };
    }

    const { pricing } = pricingState;
    const sScrtPrice = (pricing['sSCRT']?.price ?? walletBalance.scrtPrice) || 0;
    const sScrtChange = pricing['sSCRT']?.change24h ?? 0;

    let currentUSD = 0;
    let previousUSD = 0;

    // Include native SCRT
    const nativeBalanceNum = parseFloat(nativeScrt.balance || '0');
    if (!Number.isNaN(nativeBalanceNum) && nativeBalanceNum > 0 && sScrtPrice > 0) {
      const prev = sScrtPrice / (1 + sScrtChange / 100);
      currentUSD += nativeBalanceNum * sScrtPrice;
      previousUSD += nativeBalanceNum * prev;
    }

    // Include SNIP-20 tokens
    TOKENS.forEach((token) => {
      const balStr = allBalances[token.address]?.balance;
      const hasBalance = typeof balStr === 'string' && balStr !== '-' && balStr.trim().length > 0;
      const priceInfo = pricing[token.symbol];
      if (!hasBalance || !priceInfo) return;

      const balNum = parseFloat(balStr);
      if (Number.isNaN(balNum) || balNum <= 0) return;

      const tokenPrice = priceInfo.price;
      const prev = tokenPrice / (1 + (priceInfo.change24h ?? 0) / 100);
      currentUSD += balNum * tokenPrice;
      previousUSD += balNum * prev;
    });

    const changePct = previousUSD > 0 ? ((currentUSD - previousUSD) / previousUSD) * 100 : 0;
    const totalSCRT = sScrtPrice > 0 ? currentUSD / sScrtPrice : 0;

    // Debug logging removed for production

    return {
      totalUSDComputed: currentUSD,
      totalSCRTComputed: totalSCRT,
      change24hPercentComputed: changePct,
    };
  }, [allBalances, nativeScrt.balance, pricingState, walletBalance.scrtPrice, isPricingEnabled()]);

  // Debug logging removed to reduce console spam
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
      if (!isWalletModalOpen) return;

      const target = event.target as Element;

      // Check if the click is inside our wallet dropdown menu
      const isInWalletDropdown = target.closest('[data-wallet-dropdown="true"]') !== null;

      // If clicking inside dropdown, don't close anything
      if (isInWalletDropdown) {
        return;
      }

      // If clicking inside sidebar (but not in dropdown), don't close sidebar
      if (sidebarRef.current && sidebarRef.current.contains(event.target as Node)) {
        return;
      }

      // Only close sidebar if clicking completely outside both sidebar and dropdown
      handleCloseSidebar();
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
                    {/* Native SCRT row */}
                    <div className="group flex justify-between items-center hover:bg-white hover:bg-opacity-5 py-3 pl-6 transition-all duration-200">
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                        <TokenImageWithFallback
                          tokenAddress={
                            TOKENS.find((t) => t.symbol === 'sSCRT')?.address ??
                            'secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek'
                          }
                          size={40}
                          alt="SCRT"
                          className="rounded-lg flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-semibold text-white group-hover:text-white transition-colors text-base">
                            SCRT
                          </span>
                          <span className="text-sm text-adamant-text-box-secondary leading-tight">
                            Secret (native)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex flex-col items-end gap-1 relative">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-sans text-white font-medium">
                                {(() => {
                                  const num = parseFloat(nativeScrt.balance || '0');
                                  if (Number.isNaN(num)) return '0';
                                  if (num === 0) return '0';
                                  if (num < 0.000001) return '< 0.000001';
                                  return num.toFixed(6);
                                })()}
                              </span>
                              <span className="text-sm text-white font-normal">SCRT</span>
                            </div>
                          </div>
                          {isPricingEnabled() && pricingState && (
                            <div className="flex flex-col items-end text-right">
                              <span className="text-sm font-medium text-white">
                                {(() => {
                                  const price =
                                    pricingState.pricing['sSCRT']?.price ??
                                    walletBalance.scrtPrice ??
                                    0;
                                  const bal = parseFloat(nativeScrt.balance || '0');
                                  const usd =
                                    !Number.isNaN(bal) && bal > 0 && price > 0 ? bal * price : 0;
                                  return usd > 0 ? `$${usd.toFixed(2)}` : '—';
                                })()}
                              </span>
                              {(() => {
                                const ch = pricingState.pricing['sSCRT']?.change24h;
                                if (typeof ch !== 'number') return null;
                                const cls = ch >= 0 ? 'text-green-400' : 'text-red-400';
                                const sign = ch >= 0 ? '+' : '';
                                return (
                                  <span className={`text-xs ${cls}`}>{`${sign}${ch.toFixed(
                                    2
                                  )}%`}</span>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="w-8 flex justify-center">
                          <button
                            onClick={() => nativeScrt.refetch()}
                            className="p-1 text-adamant-text-box-secondary hover:text-white transition-colors"
                            title="Refresh balance"
                          >
                            <RiRefreshLine
                              className={`w-3 h-3 ${nativeScrt.loading ? 'animate-spin' : ''}`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
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
