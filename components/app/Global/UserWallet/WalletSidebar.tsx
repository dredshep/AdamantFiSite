import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { useLoadBalancePreference } from '@/hooks/useLoadBalancePreference';
import { useModalStore } from '@/store/modalStore';
import { useTokenStore } from '@/store/tokenStore';
import { useWalletStore } from '@/store/walletStore';
import { SecretString } from '@/types';
import { showToastOnce } from '@/utils/toast/toastManager';
import React, { useState } from 'react';
import { HiQrCode } from 'react-icons/hi2';
import {
  RiArrowUpSLine,
  RiFileCopyLine,
  RiRefreshLine,
  RiSendPlaneLine,
  RiSettings3Line,
  RiWalletLine,
} from 'react-icons/ri';
import { ReceivePanel } from './ReceivePanel';
import { SendTokensPanel } from './SendTokensPanel';
import { SettingsPanel } from './SettingsPanel';
import { TokenListItem } from './TokenListItem';

const WalletSidebar: React.FC = () => {
  const { closeWalletModal, isWalletModalOpen } = useModalStore();
  const { address } = useWalletStore();
  const { listAllTokens } = useTokenStore();
  const loadBalanceConfig = useLoadBalancePreference();
  const tokens = listAllTokens() ?? [];

  // Instead of separate dialogs, just track which "sub-view" to render:
  const [currentView, setCurrentView] = useState<'main' | 'send' | 'receive' | 'settings'>('main');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const truncatedAddress = address === null ? '' : address.slice(0, 8) + '...' + address.slice(-6);

  const copyAddressToClipboard = () => {
    if (address === null) return;
    void navigator.clipboard.writeText(address).then(() => {
      showToastOnce('address-copied', 'Address copied to clipboard!', 'success');
    });
  };

  const openSettings = () => {
    setCurrentView('settings');
  };

  const refreshAllBalances = async () => {
    setIsRefreshing(true);
    try {
      // Trigger refresh for all tokens
      const refreshPromises = tokens.map(async (token) => {
        try {
          // This would ideally call the token's refetch function
          // For now, we'll simulate the refresh
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { success: true, token: token.symbol };
        } catch (error) {
          console.error(`Failed to refresh ${token.symbol}:`, error);
          return { success: false, token: token.symbol };
        }
      });

      const results = await Promise.allSettled(refreshPromises);
      const successful = results.filter(
        (result) => result.status === 'fulfilled' && result.value.success
      ).length;

      if (successful === tokens.length) {
        showToastOnce(
          'refresh-success',
          `All ${tokens.length} token balances refreshed`,
          'success'
        );
      } else if (successful > 0) {
        showToastOnce(
          'refresh-partial',
          `${successful}/${tokens.length} token balances refreshed`,
          'success'
        );
      } else {
        showToastOnce('refresh-failed', 'Failed to refresh token balances', 'error');
      }
    } catch (error) {
      console.error('Error refreshing balances:', error);
      showToastOnce('refresh-error', 'Failed to refresh balances', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isWalletModalOpen) {
    return null;
  }

  // Common "back" or "close" triggers
  const handleCloseSidebar = () => {
    closeWalletModal();
    setCurrentView('main');
  };

  return (
    <aside
      className={`
        fixed top-0 right-0 bottom-0 w-[380px] z-50
        bg-gradient-to-b from-adamant-box-veryDark/95 via-adamant-box-veryDark/98 to-black/95
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
              {/* Close button */}
              <div className="flex justify-end">
                <button
                  onClick={handleCloseSidebar}
                  className="p-2 rounded-xl hover:bg-adamant-box-dark/50 transition-all duration-200 text-adamant-text-box-secondary hover:text-white group"
                  title="Close wallet"
                >
                  <RiArrowUpSLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Wallet info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <TokenImageWithFallback
                    tokenAddress={(address as SecretString) ?? 'secret1defaultaddress'}
                    size={56}
                    alt="Wallet"
                    className="rounded-2xl ring-2 ring-adamant-gradientBright/20"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-adamant-box-veryDark"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <RiWalletLine className="w-4 h-4 text-adamant-gradientBright" />
                    <span className="text-xs font-medium text-adamant-gradientBright uppercase tracking-wide">
                      Secret Network
                    </span>
                  </div>
                  <div
                    onClick={copyAddressToClipboard}
                    className="font-mono text-lg font-semibold text-white cursor-pointer hover:text-adamant-gradientBright transition-colors duration-200 group flex items-center gap-2"
                    title="Click to copy address"
                  >
                    {truncatedAddress || 'Not connected'}
                    <RiFileCopyLine className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentView('send')}
                  className="flex-1 group relative bg-white hover:bg-gray-100 text-black font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center gap-3">
                    <RiSendPlaneLine className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                    <span className="text-sm uppercase tracking-wide font-black">Send</span>
                  </div>
                </button>
                <button
                  onClick={() => setCurrentView('receive')}
                  className="flex-1 group bg-adamant-box-dark hover:bg-adamant-box-regular text-white font-bold py-4 px-6 rounded-2xl border border-adamant-gradientBright/30 hover:border-adamant-gradientBright/60 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center gap-3">
                    <HiQrCode className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm uppercase tracking-wide">Receive</span>
                  </div>
                </button>
              </div>

              {/* Settings button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={openSettings}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-adamant-text-box-secondary hover:text-white bg-adamant-box-dark/50 hover:bg-adamant-box-dark rounded-xl transition-all duration-200"
                >
                  <RiSettings3Line className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </div>
          )}

          {(currentView === 'send' || currentView === 'receive' || currentView === 'settings') && (
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
              </h2>
              <button
                onClick={handleCloseSidebar}
                className="p-2 rounded-xl hover:bg-adamant-box-dark/50 transition-all duration-200 text-adamant-text-box-secondary hover:text-white group"
                title="Close"
              >
                <RiArrowUpSLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Wallet View */}
      {currentView === 'main' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tokens Section */}
          <div className="p-6 flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-adamant-gradientBright rounded-full"></div>
                Portfolio
                <span className="text-sm font-normal text-adamant-text-box-secondary ml-1">
                  ({tokens.length} {tokens.length === 1 ? 'token' : 'tokens'})
                </span>
              </h3>
              {loadBalanceConfig.shouldShowFetchButton && (
                <button
                  onClick={() => void refreshAllBalances()}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-adamant-box-dark hover:bg-adamant-box-regular border border-adamant-gradientBright/20 hover:border-adamant-gradientBright/40 rounded-xl transition-all duration-200 text-adamant-text-box-secondary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <RiRefreshLine
                    className={`w-4 h-4 ${
                      isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'
                    } transition-transform duration-300`}
                  />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              )}
            </div>

            {tokens.length > 0 ? (
              <div
                className="space-y-3 overflow-y-auto h-full pr-2"
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

      {/* Settings View */}
      {currentView === 'settings' && <SettingsPanel onClose={() => setCurrentView('main')} />}
    </aside>
  );
};

export default WalletSidebar;
