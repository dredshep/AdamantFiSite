import PlaceholderImageFromSeed from '@/components/app/Shared/PlaceholderImageFromSeed';
import { useModalStore } from '@/store/modalStore';
import { useSwapStore } from '@/store/swapStore';
import { useWalletStore } from '@/store/walletStore';
import keplrConnect from '@/utils/wallet/keplrConnect';
import keplrDisconnect from '@/utils/wallet/keplrDisconnect';
import React, { useEffect } from 'react';
import { RxCaretDown } from 'react-icons/rx';
// Import your new sidebar
import WalletSidebar from './WalletSidebar';

const UserWallet: React.FC = () => {
  const { connectionRefused } = useSwapStore();
  const { openWalletModal } = useModalStore();
  const { address, ADMTBalance, SCRTBalance } = useWalletStore();
  const truncatedAddress = address === null ? '' : address.slice(0, 6) + '...' + address.slice(-4);
  const isConnected = address !== null;

  useEffect(() => {
    if (!connectionRefused) {
      void keplrConnect();
    }
  }, [connectionRefused]);

  return (
    <>
      <div className="flex items-center gap-4 select-none">
        {isConnected ? (
          <>
            <div
              className="flex gap-4 hover:bg-white hover:bg-opacity-5 px-6 py-3 rounded-lg transition-all duration-100 cursor-pointer"
              onClick={() => openWalletModal()}
            >
              <div onClick={() => keplrDisconnect()}>
                <PlaceholderImageFromSeed seed={address} size={48} />
              </div>
              <div>
                <div className="hidden md:flex font-medium items-center gap-2">
                  {truncatedAddress}
                  <RxCaretDown className="text-white h-5 w-5" />
                </div>
                <div className="hidden md:block font-normal opacity-50">
                  {SCRTBalance} SCRT / {ADMTBalance} ADMT
                </div>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={() => void keplrConnect()}
            className="cursor-pointer text-black bg-white px-8 pt-2 pb-2 rounded-lg font-bold leading-6 flex hover:bg-adamant-accentBg transition-all"
          >
            CONNECT
          </button>
        )}
      </div>

      {/* The new sidebar - toggles open/close via modalStore */}
      <WalletSidebar />
    </>
  );
};

export default UserWallet;
