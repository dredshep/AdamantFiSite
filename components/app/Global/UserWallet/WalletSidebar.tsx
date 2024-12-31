// C:\Users\sebas\projects\AdamantFiSite\components\app\Global\UserWallet\WalletSidebar.tsx

import PlaceholderImageFromSeed from '@/components/app/Shared/PlaceholderImageFromSeed';
import { useModalStore } from '@/store/modalStore';
import { useTokenStore } from '@/store/tokenStore';
import { useWalletStore } from '@/store/walletStore';
import React, { useState } from 'react';
import { HiQrCode } from 'react-icons/hi2';
import { RiArrowUpSLine, RiFileCopyLine, RiSettings3Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { ReceivePanel } from './ReceivePanel';
import { SendTokensPanel } from './SendTokensPanel';
import { TokenListItem } from './TokenListItem';

const WalletSidebar: React.FC = () => {
  const { closeWalletModal, isWalletModalOpen } = useModalStore();
  const { address } = useWalletStore();
  const { listAllTokens } = useTokenStore();
  const tokens = listAllTokens() ?? [];

  // Instead of separate dialogs, just track which "sub-view" to render:
  const [currentView, setCurrentView] = useState<'main' | 'send' | 'receive'>('main');

  const truncatedAddress = address === null ? '' : address.slice(0, 6) + '...' + address.slice(-4);

  const copyAddressToClipboard = () => {
    if (address === null) return;
    void navigator.clipboard.writeText(address).then(() => {
      toast.success('Address copied to clipboard!');
    });
  };

  const openSettings = () => {
    console.log('Open settings modal');
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
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {currentView === 'main' && (
          <div className="flex items-center gap-3">
            <PlaceholderImageFromSeed seed={address ?? 'secret1 no address'} size={48} />
            <div>
              <div className="font-bold">{truncatedAddress || 'secret1 no address'}</div>
            </div>
            <RiFileCopyLine
              className="text-gray-500 p-1 w-6 h-6 rounded-full hover:bg-white hover:bg-opacity-10 cursor-pointer"
              onClick={copyAddressToClipboard}
            />
            <RiSettings3Line
              className="text-gray-500 p-1 w-6 h-6 rounded-full hover:bg-white hover:bg-opacity-10 cursor-pointer"
              onClick={openSettings}
            />
          </div>
        )}

        {(currentView === 'main' || currentView === 'send' || currentView === 'receive') && (
          <RiArrowUpSLine
            className="text-gray-500 p-1 w-7 h-7 rounded-full hover:bg-white hover:bg-opacity-10 cursor-pointer"
            onClick={handleCloseSidebar}
          />
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
          <div className="mt-8">
            <div className="text-sm font-medium mb-2 text-white">Tokens</div>
            {tokens.length > 0 ? (
              <div className="space-y-1">
                {tokens.map((token, index) => (
                  <TokenListItem key={index} token={token} />
                ))}
              </div>
            ) : (
              <div>
                <p className="text-center text-gray-500 py-4">No tokens found</p>
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
    </aside>
  );
};

export default WalletSidebar;
