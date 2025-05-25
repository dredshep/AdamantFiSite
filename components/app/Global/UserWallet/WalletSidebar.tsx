import TokenImageWithFallback from '@/components/app/Shared/TokenImageWithFallback';
import { useLoadBalancePreference } from '@/hooks/useLoadBalancePreference';
import { useModalStore } from '@/store/modalStore';
import { useTokenStore } from '@/store/tokenStore';
import { useWalletStore } from '@/store/walletStore';
import { SecretString } from '@/types';
import React, { useState } from 'react';
import { HiQrCode } from 'react-icons/hi2';
import { RiArrowUpSLine, RiFileCopyLine, RiRefreshLine, RiSettings3Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
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
      toast.success('Address copied to clipboard!');
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
        toast.success(`All ${tokens.length} token balances refreshed`);
      } else if (successful > 0) {
        toast.success(`${successful}/${tokens.length} token balances refreshed`);
      } else {
        toast.error('Failed to refresh token balances');
      }
    } catch (error) {
      console.error('Error refreshing balances:', error);
      toast.error('Failed to refresh balances');
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
        fixed top-0 right-0 bottom-0 w-[312px] z-50
        bg-adamant-box-veryDark bg-opacity-90
        backdrop-blur-sm
        transition-transform duration-300
        shadow-xl
        ${isWalletModalOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-adamant-box-border">
        {currentView === 'main' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TokenImageWithFallback
                tokenAddress={(address as SecretString) ?? 'secret1defaultaddress'}
                size={48}
                alt="Wallet"
                className="rounded-full"
              />
              <div className="flex flex-col">
                <div className="font-semibold text-adamant-text-box-main">
                  {truncatedAddress || 'Not connected'}
                </div>
                <div className="text-xs text-adamant-text-box-secondary">Secret Network</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyAddressToClipboard}
                className="p-2 rounded-lg hover:bg-adamant-box-dark/50 transition-colors text-adamant-text-box-secondary hover:text-adamant-text-box-main"
                title="Copy address"
              >
                <RiFileCopyLine className="w-4 h-4" />
              </button>
              <button
                onClick={openSettings}
                className="p-2 rounded-lg hover:bg-adamant-box-dark/50 transition-colors text-adamant-text-box-secondary hover:text-adamant-text-box-main"
                title="Settings"
              >
                <RiSettings3Line className="w-4 h-4" />
              </button>
              <button
                onClick={handleCloseSidebar}
                className="p-2 rounded-lg hover:bg-adamant-box-dark/50 transition-colors text-adamant-text-box-secondary hover:text-adamant-text-box-main"
                title="Close"
              >
                <RiArrowUpSLine className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {(currentView === 'send' || currentView === 'receive' || currentView === 'settings') && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-adamant-text-box-main">
              {currentView === 'send' && 'Send Tokens'}
              {currentView === 'receive' && 'Receive Tokens'}
              {currentView === 'settings' && 'Settings'}
            </h2>
            <button
              onClick={handleCloseSidebar}
              className="p-2 rounded-lg hover:bg-adamant-box-dark/50 transition-colors text-adamant-text-box-secondary hover:text-adamant-text-box-main"
              title="Close"
            >
              <RiArrowUpSLine className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Wallet View */}
      {currentView === 'main' && (
        <div className="p-4">
          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('send')}
              className="flex-1 py-3 rounded-xl bg-adamant-accentBg text-black font-bold uppercase hover:bg-opacity-90 transition-all"
            >
              Send
            </button>
            <button
              onClick={() => setCurrentView('receive')}
              className="flex-1 py-3 rounded-xl bg-adamant-box-dark text-white font-bold uppercase border border-adamant-accentBg hover:bg-adamant-box-light transition-all flex items-center justify-center gap-2"
            >
              <span>Receive</span>
              <HiQrCode className="w-5 h-5" />
            </button>
          </div>

          {/* Tokens List */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-adamant-text-box-main">Tokens</h3>
              {loadBalanceConfig.shouldShowFetchButton && (
                <button
                  onClick={() => void refreshAllBalances()}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-adamant-box-dark hover:bg-adamant-box-regular border border-adamant-gradientBright/20 hover:border-adamant-gradientBright/40 rounded-lg transition-all duration-200 text-adamant-text-box-secondary hover:text-adamant-text-box-main disabled:opacity-50"
                >
                  <RiRefreshLine className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Loading...' : 'Refresh All'}
                </button>
              )}
            </div>
            {tokens.length > 0 ? (
              <div className="space-y-2">
                {tokens.map((token, index) => (
                  <TokenListItem key={index} token={token} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-adamant-text-box-secondary text-sm">No tokens found</div>
                <div className="text-xs text-adamant-text-box-secondary mt-1">
                  Add tokens to your wallet to see them here
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
