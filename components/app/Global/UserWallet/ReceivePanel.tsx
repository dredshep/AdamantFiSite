import { SecretString } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import { RiFileCopyLine } from 'react-icons/ri';
import { toast } from 'react-toastify';

interface ReceivePanelProps {
  walletAddress: SecretString;
  onClose: () => void; // Switches back to 'main' view in WalletSidebar
}

export const ReceivePanel: React.FC<ReceivePanelProps> = ({ walletAddress, onClose }) => {
  const copyAddressToClipboard = () => {
    void navigator.clipboard.writeText(walletAddress).then(() => {
      toast.success('Address copied to clipboard!');
    });
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-8">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-adamant-gradientBright to-adamant-gradientDark p-[1px] rounded-2xl shadow-[0_0_20px_-4px_rgba(167,142,90,0.3)]">
            <div className="bg-adamant-box-veryDark p-6 rounded-2xl">
              <QRCodeSVG
                value={walletAddress}
                size={200}
                level="H"
                includeMargin
                className="w-48 h-48"
                bgColor="transparent"
                fgColor="#cfd0d2"
              />
            </div>
          </div>
        </div>

        {/* Address Display */}
        <div>
          <label className="block text-sm text-adamant-accentText font-medium mb-2">
            Your Address
          </label>
          <div className="relative group">
            <input
              type="text"
              value={walletAddress}
              readOnly
              className="w-full bg-adamant-app-input/50 backdrop-blur-sm border border-adamant-gradientBright/20 rounded-xl px-4 py-3 pr-12 text-white font-mono text-sm outline-none transition-all hover:bg-adamant-app-input/70 focus:bg-adamant-app-input/90"
            />
            <button
              onClick={copyAddressToClipboard}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-adamant-accentText hover:text-white transition-colors duration-200 p-1.5 rounded-lg hover:bg-white/5"
            >
              <RiFileCopyLine className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
