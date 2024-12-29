import PlaceholderImageFromSeed from '@/components/app/Shared/PlaceholderImageFromSeed';
import { useModalStore } from '@/store/modalStore';
import { useTokenStore } from '@/store/tokenStore';
import { useWalletStore } from '@/store/walletStore';
import React, { useState } from 'react';
import { HiQrCode } from 'react-icons/hi2';
import { RiArrowUpSLine, RiFileCopyLine, RiSettings3Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { ReceiveDialog } from './ReceiveDialog';
import { SendTokensDialog } from './SendTokensDialog';
import { TokenListItem } from './TokenListItem';

const WalletModal: React.FC = () => {
  const { closeWalletModal } = useModalStore();
  const { address } = useWalletStore();
  const { listAllTokens } = useTokenStore();
  const tokens = listAllTokens() ?? [];
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  const copyAddressToClipboard = () => {
    if (address === null) return;
    void navigator.clipboard.writeText(address).then(() => {
      toast.success('Address copied to clipboard!');
    });
  };

  const truncatedAddress = address === null ? '' : address.slice(0, 6) + '...' + address.slice(-4);

  const openSettingsModal = () => {
    console.log('Open settings modal');
  };

  return (
    <div className="bg-adamant-box-veryDark rounded-lg shadow-md absolute top-2 right-2 w-[312px] h-[calc(100vh-16px)] z-10">
      <div className="flex items-center justify-between mb-4 p-6">
        <div className="flex items-center">
          <PlaceholderImageFromSeed seed={address ?? 'secret1 no address'} size={48} />
          <div className="mx-3">
            <div className="font-bold">{truncatedAddress ?? 'secret1 no address'}</div>
          </div>
          <RiFileCopyLine
            className="text-gray-500 p-1 w-6 h-6 rounded-full hover:bg-opacity-10 duration-150 transition-all hover:bg-white cursor-pointer text-base"
            onClick={copyAddressToClipboard}
          />
          <RiSettings3Line
            className="text-gray-500 p-1 w-6 h-6 rounded-full hover:bg-opacity-10 duration-150 transition-all hover:bg-white cursor-pointer"
            onClick={openSettingsModal}
          />
        </div>
        <RiArrowUpSLine
          className="text-gray-500 p-1 w-7 h-7 rounded-full hover:bg-opacity-10 duration-150 transition-all hover:bg-white cursor-pointer text-xl mb-0.5"
          onClick={closeWalletModal}
        />
      </div>

      <div className="px-6">
        <div className="flex gap-2">
          <button
            onClick={() => setIsSendModalOpen(true)}
            className="flex-1 py-3 rounded-xl bg-adamant-accentBg text-black font-bold my-4 uppercase hover:bg-opacity-90 transition-all"
          >
            Send
          </button>
          <button
            onClick={() => setIsReceiveModalOpen(true)}
            className="flex-1 py-3 rounded-xl bg-adamant-box-dark text-white font-bold my-4 uppercase border border-adamant-accentBg hover:bg-adamant-box-light transition-all flex items-center justify-center gap-2"
          >
            <span>Receive</span>
            <HiQrCode className="w-5 h-5" />
          </button>
        </div>
      </div>

      {address !== null && (
        <>
          <SendTokensDialog
            open={isSendModalOpen}
            onOpenChange={setIsSendModalOpen}
            walletAddress={address}
          />
          <ReceiveDialog
            open={isReceiveModalOpen}
            onOpenChange={setIsReceiveModalOpen}
            walletAddress={address}
          />
        </>
      )}

      <div>
        <div className="text-sm font-medium mt-10 mb-2 ml-4 text-white">Tokens</div>
        {tokens.length > 0 ? (
          <div className="space-y-1 mt-4">
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
  );
};

export default WalletModal;
